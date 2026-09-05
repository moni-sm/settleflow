package com.settleflow.psp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Exposes mock PSP endpoints and settlement reports directly from Spring Boot,
 * removing the need for external Node.js mock microservices.
 */
@RestController
@RequestMapping("/api/mock-psp")
@CrossOrigin(origins = "${cors.allowed-origin:*}")
public class MockPspPublicController {

    private final EmbeddedPspEngine engine;

    public MockPspPublicController(EmbeddedPspEngine engine) {
        this.engine = engine;
    }

    @GetMapping("/settlement-report")
    public ResponseEntity<Map<String, Object>> getConsolidatedSettlementReport() {
        List<Map<String, Object>> records = engine.getAllSettlementRecords();
        return ResponseEntity.ok(Map.of(
                "totalRecords", records.size(),
                "generatedAt", new Date().toString(),
                "transactions", records
        ));
    }

    @GetMapping("/{pspId}/settlement-report")
    public ResponseEntity<Map<String, Object>> getPspSettlementReport(@PathVariable String pspId) {
        EmbeddedPspEngine.PspProfile profile = engine.getProfile(pspId);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
                "psp", pspId,
                "name", profile.getName(),
                "failureRate", profile.getFailureRate(),
                "avgLatencyMs", profile.getAvgLatencyMs(),
                "totalRecords", profile.getSettlementLedger().size(),
                "transactions", profile.getSettlementLedger()
        ));
    }
}
