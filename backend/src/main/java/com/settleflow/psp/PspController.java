package com.settleflow.psp;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/psps")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class PspController {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final EmbeddedPspEngine embeddedEngine;

    public PspController(CircuitBreakerRegistry circuitBreakerRegistry, EmbeddedPspEngine embeddedEngine) {
        this.circuitBreakerRegistry = circuitBreakerRegistry;
        this.embeddedEngine = embeddedEngine;
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
        List<PspStatusDto> list = new ArrayList<>();
        for (EmbeddedPspEngine.PspProfile profile : embeddedEngine.getAllProfiles()) {
            list.add(buildPspDto(profile));
        }
        return list;
    }

    private PspStatusDto buildPspDto(EmbeddedPspEngine.PspProfile profile) {
        String state = "CLOSED";
        double failRate = profile.getFailureRate();
        int latency = profile.getAvgLatencyMs();

        try {
            CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(profile.getId());
            state = cb.getState().name();
            float metricsFailRate = cb.getMetrics().getFailureRate();
            if (metricsFailRate >= 0) {
                failRate = Math.round(metricsFailRate * 10.0) / 10.0;
            }
        } catch (Exception ignored) {}

        String apiKey = switch (profile.getId()) {
            case "psp-beta" -> "ak_live_••••••••33b9";
            case "psp-gamma" -> "ak_live_••••••••74c2";
            default -> "ak_live_••••••••90a1";
        };

        String whSec = switch (profile.getId()) {
            case "psp-beta" -> "whsec_••••••••88ac";
            case "psp-gamma" -> "whsec_••••••••12ff";
            default -> "whsec_••••••••41ef";
        };

        return new PspStatusDto(
                profile.getId(),
                profile.getName(),
                profile.getCode(),
                profile.getEndpoint(),
                apiKey,
                whSec,
                state,
                failRate,
                latency,
                profile.getPriority(),
                profile.getSupportedCurrencies(),
                profile.getSupportedMethods(),
                profile.isEnabled(),
                profile.getMinAmount(),
                profile.getMaxAmount(),
                "Active"
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
        Double failureRate = null;
        Integer latencyMs = null;
        Boolean enabled = null;

        if (body.containsKey("failureRate")) {
            failureRate = Double.valueOf(String.valueOf(body.get("failureRate")));
        }
        if (body.containsKey("avgLatencyMs")) {
            latencyMs = Integer.valueOf(String.valueOf(body.get("avgLatencyMs")));
        }
        if (body.containsKey("enabled")) {
            enabled = Boolean.valueOf(String.valueOf(body.get("enabled")));
        }

        embeddedEngine.configureProfile(id, failureRate, latencyMs, enabled);

        EmbeddedPspEngine.PspProfile profile = embeddedEngine.getProfile(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "id", id,
                "failureRate", profile != null ? profile.getFailureRate() : 0,
                "avgLatencyMs", profile != null ? profile.getAvgLatencyMs() : 0,
                "enabled", profile != null && profile.isEnabled()
        ));
    }
}

