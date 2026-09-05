package com.settleflow.psp.impl;

import com.settleflow.psp.EmbeddedPspEngine;
import com.settleflow.psp.PspClient;
import com.settleflow.transaction.Transaction;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Self-contained PSP Client connecting to the in-process EmbeddedPspEngine
 * wrapped with Resilience4j Circuit Breaker state machine protection.
 */
public class EmbeddedPspClient implements PspClient {

    private static final Logger log = LoggerFactory.getLogger(EmbeddedPspClient.class);

    private final String id;
    private final String name;
    private final EmbeddedPspEngine engine;
    private final CircuitBreaker circuitBreaker;

    public EmbeddedPspClient(String id, String name, EmbeddedPspEngine engine, CircuitBreaker circuitBreaker) {
        this.id = id;
        this.name = name;
        this.engine = engine;
        this.circuitBreaker = circuitBreaker;
    }

    @Override
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public CircuitBreaker getCircuitBreaker() {
        return circuitBreaker;
    }

    @Override
    public boolean attempt(Transaction transaction) {
        try {
            return circuitBreaker.executeSupplier(() -> engine.processPayment(id, transaction));
        } catch (CallNotPermittedException e) {
            log.warn("[{}] ⛔ Circuit breaker is OPEN. Fast-failing transaction {}", id, transaction.getId());
            return false;
        } catch (Exception e) {
            log.warn("[{}] Payment attempt rejected for transaction {}: {}", id, transaction.getId(), e.getMessage());
            return false;
        }
    }
}
