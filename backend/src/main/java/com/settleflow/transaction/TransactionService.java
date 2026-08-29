package com.settleflow.transaction;

import com.settleflow.psp.PspClient;
import com.settleflow.routing.PspRouter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransactionService {

    private static final int MAX_ATTEMPTS = 3;

    private final TransactionRepository repository;
    private final PspRouter pspRouter;

    public TransactionService(TransactionRepository repository, PspRouter pspRouter) {
        this.repository = repository;
        this.pspRouter = pspRouter;
    }

    public Transaction create(String playerId, BigDecimal amount, String currency, TransactionType type, String idempotencyKey) {
        return create(playerId, null, amount, currency, type, "Card", idempotencyKey);
    }

    public Transaction create(String playerId, String playerName, BigDecimal amount, String currency, TransactionType type, String method, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Transaction> existing = repository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return existing.get(); // replayed request — return original
            }
        }

        Transaction tx = new Transaction(playerId, playerName, amount, currency, type, method, idempotencyKey);
        repository.save(tx);

        drive(tx);
        return repository.save(tx);
    }

    public Optional<Transaction> get(UUID id) {
        return repository.findById(id);
    }

    public List<Transaction> list() {
        return repository.findAll();
    }

    public Transaction refund(UUID id, BigDecimal amount, String reason) {
        Transaction tx = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + id));

        if (tx.getStatus() != TransactionState.SETTLED) {
            throw new IllegalStateException("Only SETTLED transactions can be refunded. Current status: " + tx.getStatus());
        }

        tx.setStatus(TransactionState.REFUNDED);
        tx.setRefundReason(reason != null ? reason : "Customer support requested refund");
        tx.setRefundedAmount(amount != null ? amount : tx.getAmount());
        return repository.save(tx);
    }

    /**
     * Runs the state machine until the transaction reaches a terminal state (SETTLED or FAILED).
     */
    private void drive(Transaction tx) {
        transition(tx, TransactionState.PENDING, TransactionState.ROUTING);

        while (true) {
            PspClient psp = pspRouter.selectFor(tx);
            tx.setPsp(psp.getId());
            transition(tx, TransactionState.ROUTING, TransactionState.PROCESSING);

            tx.incrementAttemptCount();
            boolean success = psp.attempt(tx);

            if (success) {
                transition(tx, TransactionState.PROCESSING, TransactionState.SETTLED);
                return;
            }

            if (tx.getAttemptCount() >= MAX_ATTEMPTS) {
                transition(tx, TransactionState.PROCESSING, TransactionState.FAILED);
                return;
            }

            transition(tx, TransactionState.PROCESSING, TransactionState.RETRYING);
            transition(tx, TransactionState.RETRYING, TransactionState.ROUTING);
        }
    }

    private void transition(Transaction tx, TransactionState from, TransactionState to) {
        if (tx.getStatus() != from) {
            throw new IllegalStateException(
                "Cannot transition to " + to + ": transaction is in " + tx.getStatus() + ", expected " + from);
        }
        if (!isLegalTransition(from, to)) {
            throw new IllegalStateException("Illegal transition: " + from + " -> " + to);
        }
        tx.setStatus(to);
    }

    private boolean isLegalTransition(TransactionState from, TransactionState to) {
        return switch (from) {
            case PENDING -> to == TransactionState.ROUTING;
            case ROUTING -> to == TransactionState.PROCESSING;
            case PROCESSING -> to == TransactionState.SETTLED
                || to == TransactionState.RETRYING
                || to == TransactionState.FAILED;
            case RETRYING -> to == TransactionState.ROUTING;
            case SETTLED -> to == TransactionState.REFUNDED;
            case FAILED, REFUNDED -> false; // terminal states
        };
    }
}
