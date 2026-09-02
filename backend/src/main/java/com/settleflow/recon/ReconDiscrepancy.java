package com.settleflow.recon;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "recon_discrepancies")
public class ReconDiscrepancy {

    @Id
    private String id;
    private String runId;
    private String type; // MISSING_IN_DB, MISSING_IN_PSP, AMOUNT_MISMATCH, STATUS_MISMATCH
    private String reference;
    private String playerId;
    private String psp;
    private BigDecimal internalAmount;
    private BigDecimal pspAmount;
    private String currency;
    private String internalStatus;
    private String pspStatus;
    private String status; // OPEN, RESOLVED, OVERRIDDEN
    private String justificationNotes;
    private String resolvedBy;
    private String resolvedAt;

    public ReconDiscrepancy() {}

    public ReconDiscrepancy(String id, String runId, String type, String reference, String playerId, String psp,
                            BigDecimal internalAmount, BigDecimal pspAmount, String currency,
                            String internalStatus, String pspStatus, String status) {
        this.id = id;
        this.runId = runId;
        this.type = type;
        this.reference = reference;
        this.playerId = playerId;
        this.psp = psp;
        this.internalAmount = internalAmount;
        this.pspAmount = pspAmount;
        this.currency = currency;
        this.internalStatus = internalStatus;
        this.pspStatus = pspStatus;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRunId() { return runId; }
    public void setRunId(String runId) { this.runId = runId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPsp() { return psp; }
    public void setPsp(String psp) { this.psp = psp; }

    public BigDecimal getInternalAmount() { return internalAmount; }
    public void setInternalAmount(BigDecimal internalAmount) { this.internalAmount = internalAmount; }

    public BigDecimal getPspAmount() { return pspAmount; }
    public void setPspAmount(BigDecimal pspAmount) { this.pspAmount = pspAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getInternalStatus() { return internalStatus; }
    public void setInternalStatus(String internalStatus) { this.internalStatus = internalStatus; }

    public String getPspStatus() { return pspStatus; }
    public void setPspStatus(String pspStatus) { this.pspStatus = pspStatus; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getJustificationNotes() { return justificationNotes; }
    public void setJustificationNotes(String justificationNotes) { this.justificationNotes = justificationNotes; }

    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }

    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }
}
