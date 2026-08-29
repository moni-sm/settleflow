package com.settleflow.psp;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/psps")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class PspController {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RestClient restClient;

    public PspController(CircuitBreakerRegistry circuitBreakerRegistry) {
        this.circuitBreakerRegistry = circuitBreakerRegistry;
        this.restClient = RestClient.builder().build();
    }

    public record PspStatusDto(
            String id,
            String name,
            String code,
            String endpoint,
            String apiKeyMasked,
            String webhookSecretMasked,
            String circuitState,
            double failureRate,
            int avgLatencyMs,
            int priority,
            List<String> supportedCurrencies,
            List<String> supportedMethods,
            boolean enabled,
            double minAmount,
            double maxAmount,
            String lastCircuitChange
    ) {}

    @GetMapping
    public List<PspStatusDto> getPsps() {
        return List.of(
                buildPspDto("psp-alpha", "PSP Alpha", "ALPHA", "http://localhost:8081/v1/payments", "ak_live_••••••••90a1", "whsec_••••••••41ef", 1, List.of("EUR", "USD", "GBP"), List.of("Card", "Wallet"), 5.0, 10000.0, 2.1, 120),
                buildPspDto("psp-beta", "PSP Beta", "BETA", "http://localhost:8082/v1/charges", "ak_live_••••••••33b9", "whsec_••••••••88ac", 2, List.of("EUR", "USD", "SEK"), List.of("Card", "Bank transfer"), 10.0, 50000.0, 60.0, 750),
                buildPspDto("psp-gamma", "PSP Gamma", "GAMMA", "http://localhost:8083/v2/settle", "ak_live_••••••••74c2", "whsec_••••••••12ff", 3, List.of("GBP", "EUR", "NOK"), List.of("Card", "Bank transfer", "Wallet"), 10.0, 25000.0, 15.0, 250)
        );
    }

    private PspStatusDto buildPspDto(String id, String name, String code, String endpoint, String apiKey, String whSec, int priority, List<String> currencies, List<String> methods, double minAmt, double maxAmt, double defaultFailRate, int defaultLatency) {
        String state = "CLOSED";
        double failRate = defaultFailRate;
        int latency = defaultLatency;

        try {
            CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(id);
            state = cb.getState().name();
            float metricsFailRate = cb.getMetrics().getFailureRate();
            if (metricsFailRate >= 0) {
                failRate = Math.round(metricsFailRate * 10.0) / 10.0;
            }
        } catch (Exception ignored) {}

        return new PspStatusDto(
                id, name, code, endpoint, apiKey, whSec, state, failRate, latency, priority, currencies, methods, true, minAmt, maxAmt, "Active"
        );
    }

    @PostMapping("/{id}/circuit-override")
    public ResponseEntity<Map<String, Object>> overrideCircuit(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String targetState = body.getOrDefault("targetState", "CLOSED").toUpperCase();
        try {
            CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(id);
            switch (targetState) {
                case "OPEN" -> cb.transitionToOpenState();
                case "CLOSED" -> cb.transitionToClosedState();
                case "HALF_OPEN" -> cb.transitionToHalfOpenState();
                default -> throw new IllegalArgumentException("Unknown state: " + targetState);
            }
            return ResponseEntity.ok(Map.of(
                    "id", id,
                    "circuitState", cb.getState().name(),
                    "message", "Circuit breaker transitioned to " + cb.getState()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/configure")
    public ResponseEntity<Map<String, Object>> configureMockPsp(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        int port = switch (id) {
            case "psp-alpha" -> 8081;
            case "psp-beta" -> 8082;
            case "psp-gamma" -> 8083;
            default -> 8081;
        };

        try {
            Map<?, ?> response = restClient.post()
                    .uri("http://localhost:" + port + "/configure")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            return ResponseEntity.ok(Map.of("success", true, "mockResponse", response != null ? response : Map.of()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "note", "Mock offline or configured in-memory: " + e.getMessage()));
        }
    }
}
