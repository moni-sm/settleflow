package com.settleflow.transaction;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "${cors.allowed-origin}")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody CreateTransactionRequest request) {
        Transaction tx = service.create(
                request.playerId(),
                request.playerName(),
                request.amount(),
                request.currency(),
                request.type(),
                request.method(),
                request.idempotencyKey());
        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(tx));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> get(@PathVariable UUID id) {
        return service.get(id)
                .map(tx -> ResponseEntity.ok(TransactionResponse.from(tx)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<TransactionResponse> list() {
        return service.list().stream()
                .map(TransactionResponse::from)
                .collect(Collectors.toList());
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<TransactionResponse> refund(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        BigDecimal amount = body != null && body.get("amount") != null ?
                new BigDecimal(body.get("amount").toString()) : null;
        String reason = body != null && body.get("reason") != null ?
                body.get("reason").toString() : "Admin manual refund";

        Transaction tx = service.refund(id, amount, reason);
        return ResponseEntity.ok(TransactionResponse.from(tx));
    }
}
