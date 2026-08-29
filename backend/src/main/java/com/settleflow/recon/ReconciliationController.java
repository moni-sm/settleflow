package com.settleflow.recon;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reconciliation")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class ReconciliationController {

    private final ReconciliationService service;

    public ReconciliationController(ReconciliationService service) {
        this.service = service;
    }

    @GetMapping("/runs")
    public List<ReconRun> getRuns() {
        return service.getRuns();
    }

    @GetMapping("/discrepancies")
    public List<ReconDiscrepancy> getDiscrepancies() {
        return service.getDiscrepancies();
    }

    @PostMapping("/run")
    public ReconRun triggerRun(@RequestBody(required = false) Map<String, String> body) {
        String triggeredBy = body != null && body.get("triggeredBy") != null ?
                body.get("triggeredBy") : "Ops Dashboard";
        return service.executeAuditRun(triggeredBy);
    }

    @PostMapping("/discrepancies/{id}/resolve")
    public ResponseEntity<ReconDiscrepancy> resolveDiscrepancy(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String justification = body != null ? body.get("justification") : null;
        String adminName = body != null ? body.get("adminName") : "Matteo Rossi (Finance)";
        return ResponseEntity.ok(service.resolveDiscrepancy(id, justification, adminName));
    }
}
