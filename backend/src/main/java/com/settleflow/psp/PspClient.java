package com.settleflow.psp;

import com.settleflow.transaction.Transaction;

/**
 * Every mock PSP (and, eventually, a real one) implements this. The
 * orchestrator's state machine and routing logic never need to know which
 * concrete PSP they're talking to — only that it can attempt a transaction
 * and report success or failure.
 */
public interface PspClient {

    /** A short unique identifier, e.g. "psp-a", used in routing decisions and stored on the transaction. */
    String getId();

    /** Attempts to process the transaction. Returns true on success, false on failure. */
    boolean attempt(Transaction transaction);
}
