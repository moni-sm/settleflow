package com.settleflow.transaction;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue
    private UUID id;

    private String reference;

    @Column(nullable = false)
    private String playerId;

    private String playerName;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    private String method = "Card";

    // Which PSP handled (or is handling) this transaction. Null until routed.
    private String psp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionState status;

    @Column(nullable = false)
    private int attemptCount = 0;

    private int riskScore = 15;

    private String refundReason;

    private BigDecimal refundedAmount;

    // Prevents the same client request from creating two transactions if retried
    @Column(unique = true)
    private String idempotencyKey;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant updatedAt;

    protected Transaction() {
        // required by JPA
    }

    public Transaction(String playerId, BigDecimal amount, String currency, TransactionType type, String idempotencyKey) {
        this(playerId, null, amount, currency, type, "Card", idempotencyKey);
    }

    public Transaction(String playerId, String playerName, BigDecimal amount, String currency, TransactionType type, String method, String idempotencyKey) {
        this.playerId = playerId;
        this.playerName = playerName != null ? playerName : ("Player " + playerId);
        this.amount = amount;
        this.currency = currency;
        this.type = type;
        this.method = method != null ? method : "Card";
        this.idempotencyKey = idempotencyKey;
        this.status = TransactionState.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.reference = "TXN-" + Math.abs((int) (Math.random() * 90000) + 10000);
    }

    // --- getters / setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getReference() { return reference != null ? reference : ("TXN-" + id); }
    public void setReference(String reference) { this.reference = reference; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getPsp() { return psp; }
    public void setPsp(String psp) { this.psp = psp; }

    public TransactionState getStatus() { return status; }
    public void setStatus(TransactionState status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public int getAttemptCount() { return attemptCount; }
    public void incrementAttemptCount() { this.attemptCount++; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }

    public BigDecimal getRefundedAmount() { return refundedAmount; }
    public void setRefundedAmount(BigDecimal refundedAmount) { this.refundedAmount = refundedAmount; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
}
