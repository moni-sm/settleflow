package com.settleflow.config;

import com.settleflow.audit.AuditLog;
import com.settleflow.audit.AuditLogRepository;
import com.settleflow.player.PlayerKYC;
import com.settleflow.player.PlayerRepository;
import com.settleflow.recon.ReconDiscrepancy;
import com.settleflow.recon.ReconDiscrepancyRepository;
import com.settleflow.recon.ReconRun;
import com.settleflow.recon.ReconRunRepository;
import com.settleflow.routing.RoutingRule;
import com.settleflow.routing.RoutingRuleRepository;
import com.settleflow.transaction.Transaction;
import com.settleflow.transaction.TransactionRepository;
import com.settleflow.transaction.TransactionState;
import com.settleflow.transaction.TransactionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoutingRuleRepository ruleRepository;
    private final TransactionRepository txRepository;
    private final PlayerRepository playerRepository;
    private final ReconRunRepository runRepository;
    private final ReconDiscrepancyRepository discrepancyRepository;
    private final AuditLogRepository auditLogRepository;

    public DataInitializer(RoutingRuleRepository ruleRepository,
                           TransactionRepository txRepository,
                           PlayerRepository playerRepository,
                           ReconRunRepository runRepository,
                           ReconDiscrepancyRepository discrepancyRepository,
                           AuditLogRepository auditLogRepository) {
        this.ruleRepository = ruleRepository;
        this.txRepository = txRepository;
        this.playerRepository = playerRepository;
        this.runRepository = runRepository;
        this.discrepancyRepository = discrepancyRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void run(String... args) {
        if (ruleRepository.count() == 0) {
            log.info("Seeding default SettleFlow routing rules...");
            ruleRepository.saveAll(List.of(
                    new RoutingRule("rule-eur-primary", "EUR High-Priority Card Routing", "EUR", "psp-alpha", "psp-gamma", new BigDecimal("1.0"), new BigDecimal("5000.0"), 80, true),
                    new RoutingRule("rule-gbp-direct", "GBP Priority Direct Route", "GBP", "psp-gamma", "psp-alpha", new BigDecimal("10.0"), new BigDecimal("15000.0"), 100, true),
                    new RoutingRule("rule-usd-fallback", "USD Global Settlement Flow", "USD", "psp-alpha", "psp-beta", new BigDecimal("5.0"), new BigDecimal("20000.0"), 90, true),
                    new RoutingRule("rule-high-roller", "VIP & High-Value EUR (>€5,000)", "EUR", "psp-alpha", "psp-gamma", new BigDecimal("5000.0"), new BigDecimal("50000.0"), 100, true)
            ));
        }

        if (playerRepository.count() == 0) {
            log.info("Seeding player KYC records...");
            playerRepository.saveAll(List.of(
                    new PlayerKYC("player_101", "Aditi Kumar", "aditi.k@example.com", "Malta (MT)", "TIER_2_VERIFIED", 12, "VERIFIED", new BigDecimal("3450.0"), new BigDecimal("5000.0"), new BigDecimal("50.0"), "12 mins ago"),
                    new PlayerKYC("player_204", "Liam O’Connor", "liam.oc@example.ie", "Ireland (IE)", "TIER_2_VERIFIED", 35, "VERIFIED", new BigDecimal("8900.0"), new BigDecimal("10000.0"), new BigDecimal("120.0"), "4 mins ago"),
                    new PlayerKYC("player_089", "Marcus Lindholm", "marcus.l@example.se", "Sweden (SE)", "TIER_3_EDD", 82, "PENDING_REVIEW", new BigDecimal("42300.0"), new BigDecimal("25000.0"), new BigDecimal("1575.5"), "1 hour ago"),
                    new PlayerKYC("player_317", "Elena Rostova", "elena.r@example.com", "Cyprus (CY)", "TIER_2_VERIFIED", 8, "VERIFIED", new BigDecimal("1200.0"), new BigDecimal("5000.0"), new BigDecimal("30.0"), "2 hours ago"),
                    new PlayerKYC("player_412", "Kasper Schmeichel", "kasper.s@example.dk", "Denmark (DK)", "TIER_1_BASIC", 28, "NOT_SUBMITTED", new BigDecimal("450.0"), new BigDecimal("2000.0"), new BigDecimal("200.0"), "3 hours ago")
            ));
        }

        if (txRepository.count() == 0) {
            log.info("Seeding initial transactions...");
            Transaction t1 = new Transaction("player_101", "Aditi Kumar", new BigDecimal("50.0"), "EUR", TransactionType.DEPOSIT, "Card", "idem-88213");
            t1.setReference("TXN-88213");
            t1.setPsp("psp-alpha");
            t1.setStatus(TransactionState.SETTLED);
            t1.incrementAttemptCount();

            Transaction t2 = new Transaction("player_412", "Kasper Schmeichel", new BigDecimal("200.0"), "EUR", TransactionType.DEPOSIT, "Card", "idem-88212");
            t2.setReference("TXN-88212");
            t2.setPsp("psp-gamma");
            t2.setStatus(TransactionState.SETTLED);
            t2.incrementAttemptCount();

            Transaction t3 = new Transaction("player_089", "Marcus Lindholm", new BigDecimal("500.0"), "EUR", TransactionType.DEPOSIT, "Bank transfer", "idem-88211");
            t3.setReference("TXN-88211");
            t3.setPsp("psp-beta");
            t3.setStatus(TransactionState.SETTLED);
            t3.incrementAttemptCount();

            Transaction t4 = new Transaction("player_204", "Liam O’Connor", new BigDecimal("25.0"), "GBP", TransactionType.DEPOSIT, "Card", "idem-88210");
            t4.setReference("TXN-88210");
            t4.setPsp("psp-alpha");
            t4.setStatus(TransactionState.SETTLED);
            t4.incrementAttemptCount();

            txRepository.saveAll(List.of(t1, t2, t3, t4));
        }

        if (runRepository.count() == 0) {
            log.info("Seeding reconciliation records...");
            runRepository.saveAll(List.of(
                    new ReconRun("run-20260824-0600", "2026-08-24 06:00 UTC", "DISCREPANCIES_FOUND", 1420, new BigDecimal("89450.0"), 1417, 3, 14, "Scheduled Daily Cron"),
                    new ReconRun("run-20260823-0600", "2026-08-23 06:00 UTC", "COMPLETED", 1388, new BigDecimal("76200.0"), 1388, 0, 11, "Scheduled Daily Cron")
            ));

            discrepancyRepository.saveAll(List.of(
                    new ReconDiscrepancy("disc-1", "run-20260824-0600", "MISSING_IN_PSP", "TXN-88192", "player_412", "psp-beta", new BigDecimal("200.0"), BigDecimal.ZERO, "EUR", "SETTLED", "NOT_FOUND", "OPEN"),
                    new ReconDiscrepancy("disc-2", "run-20260824-0600", "AMOUNT_MISMATCH", "TXN-88188", "player_204", "psp-alpha", new BigDecimal("120.0"), new BigDecimal("100.0"), "GBP", "SETTLED", "SETTLED", "OPEN"),
                    new ReconDiscrepancy("disc-3", "run-20260824-0600", "STATUS_MISMATCH", "TXN-88147", "player_089", "psp-beta", new BigDecimal("75.5"), new BigDecimal("75.5"), "EUR", "FAILED", "PROCESSING", "OPEN")
            ));
        }

        if (auditLogRepository.count() == 0) {
            log.info("Seeding audit logs...");
            auditLogRepository.saveAll(List.of(
                    new AuditLog("log-904", "2026-08-24 07:44:12 UTC", "Ravi Shankar", "Operations Lead", "CIRCUIT_BREAKER_OVERRIDE", "PSP", "Manually flipped PSP Beta circuit breaker to OPEN after consecutive timeout spike", "192.168.1.42"),
                    new AuditLog("log-903", "2026-08-24 07:18:05 UTC", "Matteo Rossi", "Finance Manager", "RECON_DISCREPANCY_OVERRIDE", "RECONCILIATION", "Approved manual reconciliation adjustment for batch DISC-098", "192.168.1.18"),
                    new AuditLog("log-902", "2026-08-24 06:12:40 UTC", "Astrid Lind", "Compliance Officer", "KYC_TIER_UPDATE", "RISK_KYC", "Elevated player_089 to Tier 3 (Enhanced Due Diligence)", "192.168.1.66"),
                    new AuditLog("log-901", "2026-08-24 05:00:22 UTC", "Ravi Shankar", "Operations Lead", "ROUTING_RULE_MUTATED", "PSP", "Updated EUR High-Priority Card Routing preferred provider to PSP Alpha with 80% weight", "192.168.1.42")
            ));
        }
    }
}
