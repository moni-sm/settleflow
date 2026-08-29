package com.settleflow.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    String reference,
    String playerId,
    String playerName,
    BigDecimal amount,
    String currency,
    TransactionType type,
    String method,
    String psp,
    TransactionState status,
    int attemptCount,
    int riskScore,
    String idempotencyKey,
    String refundReason,
    BigDecimal refundedAmount,
    Instant createdAt,
    Instant updatedAt
) {
    public static TransactionResponse from(Transaction tx) {
        return new TransactionResponse(
            tx.getId(),
            tx.getReference(),
            tx.getPlayerId(),
            tx.getPlayerName(),
            tx.getAmount(),
            tx.getCurrency(),
            tx.getType(),
            tx.getMethod(),
            tx.getPsp(),
            tx.getStatus(),
            tx.getAttemptCount(),
            tx.getRiskScore(),
            tx.getIdempotencyKey(),
            tx.getRefundReason(),
            tx.getRefundedAmount(),
            tx.getCreatedAt(),
            tx.getUpdatedAt()
        );
    }
}
