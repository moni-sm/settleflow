package com.settleflow.psp.impl;

import com.settleflow.psp.PspClient;
import com.settleflow.transaction.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Built-in in-memory PSP Client for zero-dependency standalone local execution.
 */
public class SimulatedPspClient implements PspClient {

    private static final Logger log = LoggerFactory.getLogger(SimulatedPspClient.class);

    private final String id;
    private final double failRate;

    public SimulatedPspClient(String id, double failRate) {
        this.id = id;
        this.failRate = failRate;
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    public boolean attempt(Transaction transaction) {
        boolean failed = Math.random() < failRate;
        if (failed) {
            log.warn("[{}] Simulated payment declined for transaction {}", id, transaction.getId());
            return false;
        }
        log.info("[{}] Simulated payment approved for transaction {}", id, transaction.getId());
        return true;
    }
}
