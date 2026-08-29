package com.settleflow.recon;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "recon_runs")
public class ReconRun {

    @Id
    private String id;
    private String runDate;
    private String status; // COMPLETED, DISCREPANCIES_FOUND, IN_PROGRESS
    private int totalTransactions;
    private BigDecimal totalVolumeEur;
    private int matchedCount;
    private int discrepancyCount;
    private int durationSeconds;
    private String triggeredBy;
    private Instant createdAt;

    public ReconRun() {}

    public ReconRun(String id, String runDate, String status, int totalTransactions, BigDecimal totalVolumeEur,
                    int matchedCount, int discrepancyCount, int durationSeconds, String triggeredBy) {
        this.id = id;
        this.runDate = runDate;
        this.status = status;
        this.totalTransactions = totalTransactions;
        this.totalVolumeEur = totalVolumeEur;
        this.matchedCount = matchedCount;
        this.discrepancyCount = discrepancyCount;
        this.durationSeconds = durationSeconds;
        this.triggeredBy = triggeredBy;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRunDate() { return runDate; }
    public void setRunDate(String runDate) { this.runDate = runDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(int totalTransactions) { this.totalTransactions = totalTransactions; }

    public BigDecimal getTotalVolumeEur() { return totalVolumeEur; }
    public void setTotalVolumeEur(BigDecimal totalVolumeEur) { this.totalVolumeEur = totalVolumeEur; }

    public int getMatchedCount() { return matchedCount; }
    public void setMatchedCount(int matchedCount) { this.matchedCount = matchedCount; }

    public int getDiscrepancyCount() { return discrepancyCount; }
    public void setDiscrepancyCount(int discrepancyCount) { this.discrepancyCount = discrepancyCount; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }

    public Instant getCreatedAt() { return createdAt; }
}
