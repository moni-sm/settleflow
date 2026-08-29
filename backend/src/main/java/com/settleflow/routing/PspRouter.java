package com.settleflow.routing;

import com.settleflow.psp.PspClient;
import com.settleflow.psp.impl.HttpPspClient;
import com.settleflow.transaction.Transaction;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Intelligent & Circuit-Aware Router:
 * 1. Matches active routing rules by currency and amount
 * 2. Checks Resilience4j Circuit Breakers to exclude degraded PSPs
 * 3. Falls back to secondary routes or healthy providers dynamically
 */
@Component
public class PspRouter {

    private static final Logger log = LoggerFactory.getLogger(PspRouter.class);

    private final List<PspClient> pspClients;
    private final RoutingRuleRepository ruleRepository;
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final AtomicInteger cursor = new AtomicInteger(0);

    public PspRouter(List<PspClient> pspClients, RoutingRuleRepository ruleRepository, CircuitBreakerRegistry circuitBreakerRegistry) {
        this.pspClients = pspClients;
        this.ruleRepository = ruleRepository;
        this.circuitBreakerRegistry = circuitBreakerRegistry;
    }

    public PspClient selectFor(Transaction transaction) {
        if (pspClients.isEmpty()) {
            throw new IllegalStateException("No PSP clients registered");
        }

        Map<String, PspClient> clientMap = pspClients.stream()
                .collect(Collectors.toMap(PspClient::getId, c -> c));

        // 1. Find matching enabled routing rule
        Optional<RoutingRule> matchedRule = findMatchingRule(transaction);

        if (matchedRule.isPresent()) {
            RoutingRule rule = matchedRule.get();
            String preferredId = rule.getPreferredPsp();
            String fallbackId = rule.getFallbackPsp();

            // Check if preferred PSP is healthy
            if (preferredId != null && isPspHealthy(preferredId) && clientMap.containsKey(preferredId)) {
                log.info("🎯 Routing rule '{}' matched: Assigned preferred {} for tx {}",
                        rule.getName(), preferredId, transaction.getId());
                return clientMap.get(preferredId);
            }

            // If preferred is degraded/OPEN, try fallback PSP
            if (fallbackId != null && isPspHealthy(fallbackId) && clientMap.containsKey(fallbackId)) {
                log.warn("⚠️ Preferred PSP {} is degraded/OPEN. Routing rule '{}' fell back to {} for tx {}",
                        preferredId, rule.getName(), fallbackId, transaction.getId());
                return clientMap.get(fallbackId);
            }
        }

        // 2. Select any healthy PSP
        List<PspClient> healthyClients = pspClients.stream()
                .filter(c -> isPspHealthy(c.getId()))
                .toList();

        if (!healthyClients.isEmpty()) {
            int index = Math.floorMod(cursor.getAndIncrement(), healthyClients.size());
            PspClient selected = healthyClients.get(index);
            log.info("⚡ Circuit-aware selection routed tx {} to healthy provider {}", transaction.getId(), selected.getId());
            return selected;
        }

        // 3. If all are OPEN or half-open, pick by round-robin to allow half-open probe calls
        int index = Math.floorMod(cursor.getAndIncrement(), pspClients.size());
        PspClient fallback = pspClients.get(index);
        log.warn("🚨 All PSP circuits degraded. Attempting probe call on {}", fallback.getId());
        return fallback;
    }

    private Optional<RoutingRule> findMatchingRule(Transaction transaction) {
        try {
            List<RoutingRule> rules = ruleRepository.findByEnabledTrue();
            BigDecimal amount = transaction.getAmount();
            String currency = transaction.getCurrency();

            return rules.stream().filter(rule -> {
                if (rule.getCurrency() != null && !rule.getCurrency().equalsIgnoreCase("ALL")
                        && !rule.getCurrency().equalsIgnoreCase(currency)) {
                    return false;
                }
                if (rule.getMinAmount() != null && amount.compareTo(rule.getMinAmount()) < 0) {
                    return false;
                }
                if (rule.getMaxAmount() != null && amount.compareTo(rule.getMaxAmount()) > 0) {
                    return false;
                }
                return true;
            }).findFirst();
        } catch (Exception e) {
            log.error("Failed to query routing rules: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public boolean isPspHealthy(String pspId) {
        try {
            CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(pspId);
            return cb.getState() != CircuitBreaker.State.OPEN;
        } catch (Exception e) {
            return true;
        }
    }
}
