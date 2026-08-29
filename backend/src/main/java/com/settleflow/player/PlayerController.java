package com.settleflow.player;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/players")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class PlayerController {

    private final PlayerRepository repository;

    public PlayerController(PlayerRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PlayerKYC> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerKYC> get(@PathVariable String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/kyc")
    public ResponseEntity<PlayerKYC> updateKyc(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates) {
        return repository.findById(id).map(player -> {
            if (updates.get("tier") != null) player.setTier(updates.get("tier").toString());
            if (updates.get("riskScore") != null) player.setRiskScore(Integer.parseInt(updates.get("riskScore").toString()));
            if (updates.get("documentStatus") != null) player.setDocumentStatus(updates.get("documentStatus").toString());
            if (updates.get("dailyLimitEur") != null) player.setDailyLimitEur(new BigDecimal(updates.get("dailyLimitEur").toString()));
            return ResponseEntity.ok(repository.save(player));
        }).orElse(ResponseEntity.notFound().build());
    }
}
