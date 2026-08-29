package com.settleflow.routing;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routing-rules")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class RoutingRuleController {

    private final RoutingRuleRepository repository;

    public RoutingRuleController(RoutingRuleRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<RoutingRule> list() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<RoutingRule> create(@RequestBody RoutingRule rule) {
        if (rule.getId() == null || rule.getId().isBlank()) {
            rule.setId("rule-" + UUID.randomUUID().toString().substring(0, 8));
        }
        RoutingRule saved = repository.save(rule);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoutingRule> update(@PathVariable String id, @RequestBody RoutingRule updated) {
        return repository.findById(id).map(rule -> {
            rule.setName(updated.getName());
            rule.setCurrency(updated.getCurrency());
            rule.setPreferredPsp(updated.getPreferredPsp());
            rule.setFallbackPsp(updated.getFallbackPsp());
            rule.setMinAmount(updated.getMinAmount());
            rule.setMaxAmount(updated.getMaxAmount());
            rule.setTrafficWeight(updated.getTrafficWeight());
            rule.setEnabled(updated.isEnabled());
            return ResponseEntity.ok(repository.save(rule));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
