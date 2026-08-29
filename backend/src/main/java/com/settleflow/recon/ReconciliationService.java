package com.settleflow.recon;

import com.settleflow.transaction.Transaction;
import com.settleflow.transaction.TransactionRepository;
import com.settleflow.transaction.TransactionState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationService.class);

    private final TransactionRepository txRepository;
    private final ReconRunRepository runRepository;
    private final ReconDiscrepancyRepository discrepancyRepository;
    private final RestClient restClient;

    public ReconciliationService(TransactionRepository txRepository,
                                 ReconRunRepository runRepository,
                                 ReconDiscrepancyRepository discrepancyRepository) {
        this.txRepository = txRepository;
        this.runRepository = runRepository;
        this.discrepancyRepository = discrepancyRepository;
        this.restClient = RestClient.builder().build();
    }

    public List<ReconRun> getRuns() {
        return runRepository.findAll();
    }

    public List<ReconDiscrepancy> getDiscrepancies() {
        return discrepancyRepository.findAll();
    }

    public ReconDiscrepancy resolveDiscrepancy(String id, String justification, String adminName) {
        ReconDiscrepancy disc = discrepancyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Discrepancy not found: " + id));

        disc.setStatus("RESOLVED");
        disc.setJustificationNotes(justification != null ? justification : "Manual ops resolution approved");
        disc.setResolvedBy(adminName != null ? adminName : "Admin User");
        disc.setResolvedAt(Instant.now().toString());

        return discrepancyRepository.save(disc);
    }

    public ReconRun executeAuditRun(String triggeredBy) {
        long startTime = System.currentTimeMillis();
        String runId = "RUN-" + System.currentTimeMillis() % 100000;
        String runDate = DateTimeFormatter.ISO_INSTANT.format(Instant.now()).substring(0, 10);

        List<Transaction> dbTransactions = txRepository.findAll();
        Map<String, Map<String, Object>> pspRecords = new HashMap<>();

        // Fetch settlement reports from all 3 PSP mocks
        int[] ports = {8081, 8082, 8083};
        String[] pspIds = {"psp-alpha", "psp-beta", "psp-gamma"};

        for (int i = 0; i < ports.length; i++) {
            try {
                Map<?, ?> report = restClient.get()
                        .uri("http://localhost:" + ports[i] + "/settlement-report")
                        .retrieve()
                        .body(Map.class);

                if (report != null && report.get("transactions") instanceof List<?> list) {
                    for (Object item : list) {
                        if (item instanceof Map<?, ?> txMap) {
                            String ref = String.valueOf(txMap.get("reference") != null ? txMap.get("reference") : txMap.get("id"));
                            pspRecords.put(ref, (Map<String, Object>) txMap);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch settlement report from {} on port {}: {}", pspIds[i], ports[i], e.getMessage());
            }
        }

        int matchedCount = 0;
        List<ReconDiscrepancy> discrepancies = new ArrayList<>();
        BigDecimal totalVolume = BigDecimal.ZERO;

        for (Transaction dbTx : dbTransactions) {
            totalVolume = totalVolume.add(dbTx.getAmount());
            String ref = dbTx.getReference();
            Map<String, Object> pspTx = pspRecords.remove(ref);

            if (pspTx == null) {
                if (dbTx.getStatus() == TransactionState.SETTLED) {
                    // Settled in DB but missing from PSP settlement ledger
                    discrepancies.add(new ReconDiscrepancy(
                            "DISC-" + UUID.randomUUID().toString().substring(0, 6),
                            runId,
                            "MISSING_IN_PSP",
                            ref,
                            dbTx.getPlayerId(),
                            dbTx.getPsp() != null ? dbTx.getPsp() : "psp-alpha",
                            dbTx.getAmount(),
                            BigDecimal.ZERO,
                            dbTx.getCurrency(),
                            dbTx.getStatus().name(),
                            "NOT_FOUND",
                            "OPEN"
                    ));
                }
            } else {
                BigDecimal pspAmt = new BigDecimal(String.valueOf(pspTx.get("amount")));
                if (dbTx.getAmount().compareTo(pspAmt) != 0) {
                    discrepancies.add(new ReconDiscrepancy(
                            "DISC-" + UUID.randomUUID().toString().substring(0, 6),
                            runId,
                            "AMOUNT_MISMATCH",
                            ref,
                            dbTx.getPlayerId(),
                            dbTx.getPsp() != null ? dbTx.getPsp() : "psp-beta",
                            dbTx.getAmount(),
                            pspAmt,
                            dbTx.getCurrency(),
                            dbTx.getStatus().name(),
                            String.valueOf(pspTx.get("status")),
                            "OPEN"
                    ));
                } else {
                    matchedCount++;
                }
            }
        }

        // Remaining in PSP records but missing from internal DB
        for (Map.Entry<String, Map<String, Object>> entry : pspRecords.entrySet()) {
            Map<String, Object> pspTx = entry.getValue();
            discrepancies.add(new ReconDiscrepancy(
                    "DISC-" + UUID.randomUUID().toString().substring(0, 6),
                    runId,
                    "MISSING_IN_DB",
                    entry.getKey(),
                    String.valueOf(pspTx.get("playerId")),
                    String.valueOf(pspTx.get("psp") != null ? pspTx.get("psp") : "psp-gamma"),
                    BigDecimal.ZERO,
                    new BigDecimal(String.valueOf(pspTx.get("amount"))),
                    String.valueOf(pspTx.get("currency") != null ? pspTx.get("currency") : "EUR"),
                    "NOT_FOUND",
                    String.valueOf(pspTx.get("status")),
                    "OPEN"
            ));
        }

        int durationSec = Math.max(1, (int) ((System.currentTimeMillis() - startTime) / 1000));
        String status = discrepancies.isEmpty() ? "COMPLETED" : "DISCREPANCIES_FOUND";

        ReconRun run = new ReconRun(
                runId,
                runDate,
                status,
                dbTransactions.size() + pspRecords.size(),
                totalVolume,
                matchedCount,
                discrepancies.size(),
                durationSec,
                triggeredBy != null ? triggeredBy : "Ops Manual Trigger"
        );

        runRepository.save(run);
        discrepancyRepository.saveAll(discrepancies);

        log.info("Reconciliation run {} finished: {} matched, {} discrepancies in {}s",
                runId, matchedCount, discrepancies.size(), durationSec);

        return run;
    }
}
