package com.settleflow.transaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateTransactionRequest(
    @NotBlank String playerId,
    String playerName,
    @NotNull @Positive BigDecimal amount,
    @NotBlank String currency,
    @NotNull TransactionType type,
    String method,
    String idempotencyKey
) {}
