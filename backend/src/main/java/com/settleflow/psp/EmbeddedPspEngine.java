package com.settleflow.psp;

import com.settleflow.transaction.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Embedded Mock PSP Engine that manages internal provider profiles,
 * latency simulation, failure rates, and settlement ledgers in-memory.
 */
@Service
public class EmbeddedPspEngine {

    private static final Logger log = LoggerFactory.getLogger(EmbeddedPspEngine.class);

    public static class PspProfile {
        private final String id;
        private final String name;
        private final String code;
        private final String endpoint;
        private double failureRate;
        private int avgLatencyMs;
        private boolean enabled;
        private final int priority;
        private final List<String> supportedCurrencies;
        private final List<String> supportedMethods;
        private final double minAmount;
        private final double maxAmount;
        private final List<Map<String, Object>> settlementLedger = new CopyOnWriteArrayList<>();

        public PspProfile(String id, String name, String code, String endpoint,
                          double failureRate, int avgLatencyMs, boolean enabled, int priority,
                          List<String> supportedCurrencies, List<String> supportedMethods,
                          double minAmount, double maxAmount) {
            this.id = id;
            this.name = name;
            this.code = code;
            this.endpoint = endpoint;
            this.failureRate = failureRate;
            this.avgLatencyMs = avgLatencyMs;
            this.enabled = enabled;
            this.priority = priority;
            this.supportedCurrencies = supportedCurrencies;
            this.supportedMethods = supportedMethods;
            this.minAmount = minAmount;
            this.maxAmount = maxAmount;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getCode() { return code; }
        public String getEndpoint() { return endpoint; }
        public double getFailureRate() { return failureRate; }
        public void setFailureRate(double failureRate) { this.failureRate = failureRate; }
        public int getAvgLatencyMs() { return avgLatencyMs; }
        public void setAvgLatencyMs(int avgLatencyMs) { this.avgLatencyMs = avgLatencyMs; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getPriority() { return priority; }
        public List<String> getSupportedCurrencies() { return supportedCurrencies; }
        public List<String> getSupportedMethods() { return supportedMethods; }
        public double getMinAmount() { return minAmount; }
        public double getMaxAmount() { return maxAmount; }
        public List<Map<String, Object>> getSettlementLedger() { return settlementLedger; }
    }

    private final Map<String, PspProfile> profiles = new ConcurrentHashMap<>();

    public EmbeddedPspEngine() {
        // Initialize Alpha, Beta, Gamma profiles
        profiles.put("psp-alpha", new PspProfile(
                "psp-alpha", "PSP Alpha", "ALPHA", "/api/mock-psp/alpha/v1/payments",
                5.0, 120, true, 1,
                List.of("EUR", "USD", "GBP"), List.of("Card", "Wallet"),
                5.0, 10000.0
        ));

        profiles.put("psp-beta", new PspProfile(
                "psp-beta", "PSP Beta", "BETA", "/api/mock-psp/beta/v1/charges",
                60.0, 750, true, 2,
                List.of("EUR", "USD", "SEK"), List.of("Card", "Bank transfer"),
                10.0, 50000.0
        ));

        profiles.put("psp-gamma", new PspProfile(
                "psp-gamma", "PSP Gamma", "GAMMA", "/api/mock-psp/gamma/v2/settle",
                15.0, 250, true, 3,
                List.of("GBP", "EUR", "NOK"), List.of("Card", "Bank transfer", "Wallet"),
                10.0, 25000.0
        ));

        // Seed realistic settlement records for initial reconciliation audit demonstrations
        seedInitialSettlementLedgers();
    }

    private void seedInitialSettlementLedgers() {
        // Alpha settlement seeds
        recordSettlement("psp-alpha", "TXN-88213", "player_101", 50.0, "EUR", "SETTLED");
        recordSettlement("psp-alpha", "TXN-88210", "player_204", 25.0, "GBP", "SETTLED");
        recordSettlement("psp-alpha", "TXN-88188", "player_204", 100.0, "GBP", "SETTLED"); // Intentional amount discrepancy for demo

        // Beta settlement seeds
        recordSettlement("psp-beta", "TXN-88211", "player_089", 500.0, "EUR", "SETTLED");
        recordSettlement("psp-beta", "TXN-88147", "player_089", 75.5, "EUR", "PROCESSING"); // Intentional status discrepancy for demo

        // Gamma settlement seeds
        recordSettlement("psp-gamma", "TXN-88212", "player_412", 200.0, "EUR", "SETTLED");
        recordSettlement("psp-gamma", "TXN-MOCK-9999", "player_317", 150.0, "EUR", "SETTLED"); // Intentional missing-in-DB discrepancy for demo
    }

    public PspProfile getProfile(String pspId) {
        return profiles.get(pspId);
    }

    public Collection<PspProfile> getAllProfiles() {
        return profiles.values();
    }

    public void configureProfile(String pspId, Double failureRate, Integer avgLatencyMs, Boolean enabled) {
        PspProfile profile = profiles.get(pspId);
        if (profile != null) {
            if (failureRate != null) profile.setFailureRate(failureRate);
            if (avgLatencyMs != null) profile.setAvgLatencyMs(avgLatencyMs);
            if (enabled != null) profile.setEnabled(enabled);
            log.info("Updated configuration for [{}]: failRate={}%, latency={}ms, enabled={}",
                    pspId, profile.getFailureRate(), profile.getAvgLatencyMs(), profile.isEnabled());
        }
    }

    public boolean processPayment(String pspId, Transaction transaction) {
        PspProfile profile = profiles.get(pspId);
        if (profile == null || !profile.isEnabled()) {
            log.warn("[{}] PSP is disabled or not found", pspId);
            throw new RuntimeException("PSP provider disabled or unavailable: " + pspId);
        }

        // Simulate provider latency (capped to prevent long block in tests)
        int latency = Math.min(profile.getAvgLatencyMs(), 1500);
        if (latency > 0) {
            try {
                Thread.sleep(Math.min(latency, 250)); // Scaled for fast, realistic response
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }

        // Calculate failure by configured rate
        double roll = Math.random() * 100.0;
        boolean failed = roll < profile.getFailureRate();

        if (failed) {
            log.warn("[{}] ❌ Mock payment execution DECLINED for tx {} (failRate: {}%)",
                    pspId, transaction.getId(), profile.getFailureRate());
            throw new RuntimeException("PSP " + profile.getName() + " declined transaction: Error code 402_DECLINED");
        }

        // Record successful transaction in settlement ledger
        recordSettlement(
                pspId,
                transaction.getReference() != null ? transaction.getReference() : "TXN-" + transaction.getId(),
                transaction.getPlayerId(),
                transaction.getAmount().doubleValue(),
                transaction.getCurrency(),
                "SETTLED"
        );

        log.info("[{}] ✅ Mock payment execution APPROVED for tx {} ({}) in ~{}ms",
                pspId, transaction.getId(), transaction.getReference(), profile.getAvgLatencyMs());
        return true;
    }

    public void recordSettlement(String pspId, String reference, String playerId, double amount, String currency, String status) {
        PspProfile profile = profiles.get(pspId);
        if (profile != null) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", UUID.randomUUID().toString());
            record.put("reference", reference);
            record.put("playerId", playerId);
            record.put("amount", amount);
            record.put("currency", currency);
            record.put("status", status);
            record.put("psp", pspId);
            record.put("settledAt", Instant.now().toString());
            profile.getSettlementLedger().add(record);
        }
    }

    public List<Map<String, Object>> getAllSettlementRecords() {
        List<Map<String, Object>> all = new ArrayList<>();
        for (PspProfile p : profiles.values()) {
            all.addAll(p.getSettlementLedger());
        }
        return all;
    }
}
