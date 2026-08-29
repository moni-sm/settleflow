package com.settleflow.psp.impl;

import com.settleflow.psp.PspClient;
import com.settleflow.transaction.Transaction;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

/**
 * Real HTTP PSP Client that calls the mock PSP microservices
 * wrapped with Resilience4j Circuit Breaker protection.
 */
public class HttpPspClient implements PspClient {

    private static final Logger log = LoggerFactory.getLogger(HttpPspClient.class);

    private final String id;
    private final String name;
    private final String endpointUrl;
    private final CircuitBreaker circuitBreaker;
    private final RestClient restClient;
    private final double simulatedFallbackFailRate;

    public HttpPspClient(String id, String name, String endpointUrl, CircuitBreaker circuitBreaker, double simulatedFallbackFailRate) {
        this.id = id;
        this.name = name;
        this.endpointUrl = endpointUrl;
        this.circuitBreaker = circuitBreaker;
        this.simulatedFallbackFailRate = simulatedFallbackFailRate;
        this.restClient = RestClient.builder()
                .baseUrl(endpointUrl)
                .build();
    }

    @Override
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEndpointUrl() {
        return endpointUrl;
    }

    public CircuitBreaker getCircuitBreaker() {
        return circuitBreaker;
    }

    @Override
    public boolean attempt(Transaction transaction) {
        // Wrap execution with Resilience4j circuit breaker
        try {
            return circuitBreaker.executeSupplier(() -> executePaymentCall(transaction));
        } catch (CallNotPermittedException e) {
            log.warn("[{}] ⛔ Circuit breaker is OPEN. Fast-failing transaction {}", id, transaction.getId());
            return false;
        } catch (Exception e) {
            log.error("[{}] Payment execution failed for transaction {}: {}", id, transaction.getId(), e.getMessage());
            return false;
        }
    }

    private boolean executePaymentCall(Transaction transaction) {
        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> payload = Map.of(
                    "id", transaction.getId().toString(),
                    "playerId", transaction.getPlayerId(),
                    "amount", transaction.getAmount(),
                    "currency", transaction.getCurrency(),
                    "type", transaction.getType().name()
            );

            Map<?, ?> response = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            long latency = System.currentTimeMillis() - startTime;

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                log.info("[{}] ✅ Payment approved for transaction {} in {}ms (Circuit: {})",
                        id, transaction.getId(), latency, circuitBreaker.getState());
                return true;
            } else {
                log.warn("[{}] ❌ Payment declined for transaction {} in {}ms",
                        id, transaction.getId(), latency);
                throw new RuntimeException("PSP declined payment");
            }
        } catch (Exception e) {
            // Check if mock server was offline/unreachable -> fallback to simulation so demo never crashes
            if (e.getMessage() != null && (e.getMessage().contains("Connection refused") || e.getMessage().contains("ConnectException") || e.getMessage().contains("ResourceAccessException"))) {
                log.warn("[{}] Mock server unreachable at {}. Falling back to in-memory simulation.", id, endpointUrl);
                boolean simSuccess = Math.random() >= simulatedFallbackFailRate;
                if (!simSuccess) {
                    throw new RuntimeException("Simulated fallback failure");
                }
                return true;
            }
            throw (e instanceof RuntimeException ? (RuntimeException) e : new RuntimeException(e));
        }
    }
}
