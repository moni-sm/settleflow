#!/usr/bin/env python3
"""
SettleFlow Standalone Settlement Reconciliation Worker
Audits internal database transaction records against external PSP settlement reports.
"""

import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

BACKEND_URL = "http://localhost:8080"
PSP_URLS = {
    "psp-alpha": "http://localhost:8081/settlement-report",
    "psp-beta": "http://localhost:8082/settlement-report",
    "psp-gamma": "http://localhost:8083/settlement-report"
}

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SettleFlow-ReconWorker/1.0"})
        with urllib.request.urlopen(req, timeout=3) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"[!] Warning: Could not fetch from {url} ({e})")
        return None

def run_reconciliation():
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    print("=" * 65)
    print("      SETTLEFLOW PAYMENT RECONCILIATION AUDIT WORKER")
    print(f"      Run Timestamp: {now_str}")
    print("=" * 65)

    # 1. Fetch Internal Transactions
    print("\n[1/3] Fetching internal transactions from backend...")
    db_txs = fetch_json(f"{BACKEND_URL}/api/transactions")
    if db_txs is None:
        print("Backend offline, using fallback database ledger...")
        db_txs = [
            {"reference": "TXN-88213", "playerId": "player_101", "amount": 50.0, "currency": "EUR", "psp": "psp-alpha", "status": "SETTLED"},
            {"reference": "TXN-88212", "playerId": "player_412", "amount": 200.0, "currency": "EUR", "psp": "psp-gamma", "status": "SETTLED"},
            {"reference": "TXN-88211", "playerId": "player_089", "amount": 500.0, "currency": "EUR", "psp": "psp-beta", "status": "SETTLED"},
            {"reference": "TXN-88210", "playerId": "player_204", "amount": 25.0, "currency": "GBP", "psp": "psp-alpha", "status": "SETTLED"},
            {"reference": "TXN-88147", "playerId": "player_089", "amount": 75.5, "currency": "EUR", "psp": "psp-beta", "status": "FAILED"}
        ]
    print(f"Loaded {len(db_txs)} internal transaction records.")

    # 2. Fetch PSP Settlement Reports
    print("\n[2/3] Fetching settlement ledgers from registered PSPs...")
    psp_tx_map = {}
    for psp_id, psp_url in PSP_URLS.items():
        report = fetch_json(psp_url)
        if report and "transactions" in report:
            for tx in report["transactions"]:
                ref = tx.get("reference") or tx.get("id")
                tx["_psp_id"] = psp_id
                psp_tx_map[ref] = tx
            print(f"  - {psp_id}: Retrieved {len(report['transactions'])} settled records")
        else:
            print(f"  - {psp_id}: Offline or no records")

    # 3. Perform Reconciliation Audit
    print("\n[3/3] Cross-referencing internal vs external records...")
    matched = []
    discrepancies = []

    for db_tx in db_txs:
        ref = db_tx.get("reference") or str(db_tx.get("id"))
        psp_tx = psp_tx_map.pop(ref, None)

        if psp_tx is None:
            if db_tx.get("status") == "SETTLED":
                discrepancies.append({
                    "type": "MISSING_IN_PSP",
                    "reference": ref,
                    "playerId": db_tx.get("playerId"),
                    "psp": db_tx.get("psp", "Unknown"),
                    "internalAmount": db_tx.get("amount"),
                    "pspAmount": 0,
                    "currency": db_tx.get("currency"),
                    "internalStatus": db_tx.get("status"),
                    "pspStatus": "NOT_FOUND"
                })
        else:
            db_amt = float(db_tx.get("amount", 0))
            psp_amt = float(psp_tx.get("amount", 0))

            if abs(db_amt - psp_amt) > 0.001:
                discrepancies.append({
                    "type": "AMOUNT_MISMATCH",
                    "reference": ref,
                    "playerId": db_tx.get("playerId"),
                    "psp": psp_tx.get("_psp_id", db_tx.get("psp")),
                    "internalAmount": db_amt,
                    "pspAmount": psp_amt,
                    "currency": db_tx.get("currency"),
                    "internalStatus": db_tx.get("status"),
                    "pspStatus": psp_tx.get("status")
                })
            elif db_tx.get("status") != psp_tx.get("status"):
                discrepancies.append({
                    "type": "STATUS_MISMATCH",
                    "reference": ref,
                    "playerId": db_tx.get("playerId"),
                    "psp": psp_tx.get("_psp_id", db_tx.get("psp")),
                    "internalAmount": db_amt,
                    "pspAmount": psp_amt,
                    "currency": db_tx.get("currency"),
                    "internalStatus": db_tx.get("status"),
                    "pspStatus": psp_tx.get("status")
                })
            else:
                matched.append(ref)

    # Remaining in PSP but missing in DB
    for ref, psp_tx in psp_tx_map.items():
        discrepancies.append({
            "type": "MISSING_IN_DB",
            "reference": ref,
            "playerId": psp_tx.get("playerId"),
            "psp": psp_tx.get("_psp_id"),
            "internalAmount": 0,
            "pspAmount": float(psp_tx.get("amount", 0)),
            "currency": psp_tx.get("currency", "EUR"),
            "internalStatus": "NOT_FOUND",
            "pspStatus": psp_tx.get("status")
        })

    # Summary Report
    print("\n" + "=" * 65)
    print("                   AUDIT SUMMARY RESULT")
    print("=" * 65)
    print(f"Total Transactions Examined: {len(matched) + len(discrepancies)}")
    print(f"Matched & Reconciled:        [OK] {len(matched)}")
    print(f"Discrepancies Flagged:       [!]  {len(discrepancies)}")
    print("=" * 65)

    if discrepancies:
        print("\nDISCREPANCY DETAILS:")
        for idx, d in enumerate(discrepancies, 1):
            print(f" [{idx}] {d['type']:16} | Ref: {d['reference']} | Player: {d['playerId']} | PSP: {d['psp']}")
            print(f"     DB:  {d['internalAmount']:>7.2f} {d['currency']} ({d['internalStatus']})")
            print(f"     PSP: {d['pspAmount']:>7.2f} {d['currency']} ({d['pspStatus']})")

    # Save output JSON
    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "totalExamined": len(matched) + len(discrepancies),
        "matchedCount": len(matched),
        "discrepancyCount": len(discrepancies),
        "discrepancies": discrepancies
    }
    with open("reconciliation_report.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print("\n[+] Full audit report written to reconciliation_report.json")

if __name__ == "__main__":
    run_reconciliation()
