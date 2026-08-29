package com.settleflow.transaction;

public enum TransactionState {
    PENDING,
    ROUTING,
    PROCESSING,
    SETTLED,
    RETRYING,
    FAILED,
    REFUNDED
}
