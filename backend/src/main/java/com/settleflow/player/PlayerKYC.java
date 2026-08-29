package com.settleflow.player;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "players_kyc")
public class PlayerKYC {

    @Id
    private String playerId;
    private String fullName;
    private String email;
    private String country;
    private String tier; // TIER_1_BASIC, TIER_2_VERIFIED, TIER_3_EDD, SUSPENDED
    private int riskScore;
    private String documentStatus; // VERIFIED, PENDING_REVIEW, NOT_SUBMITTED, REJECTED
    private BigDecimal totalDepositedEur;
    private BigDecimal dailyLimitEur;
    private BigDecimal dailySpentEur;
    private String lastActivity;

    public PlayerKYC() {}

    public PlayerKYC(String playerId, String fullName, String email, String country, String tier,
                     int riskScore, String documentStatus, BigDecimal totalDepositedEur,
                     BigDecimal dailyLimitEur, BigDecimal dailySpentEur, String lastActivity) {
        this.playerId = playerId;
        this.fullName = fullName;
        this.email = email;
        this.country = country;
        this.tier = tier;
        this.riskScore = riskScore;
        this.documentStatus = documentStatus;
        this.totalDepositedEur = totalDepositedEur;
        this.dailyLimitEur = dailyLimitEur;
        this.dailySpentEur = dailySpentEur;
        this.lastActivity = lastActivity;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getDocumentStatus() { return documentStatus; }
    public void setDocumentStatus(String documentStatus) { this.documentStatus = documentStatus; }

    public BigDecimal getTotalDepositedEur() { return totalDepositedEur; }
    public void setTotalDepositedEur(BigDecimal totalDepositedEur) { this.totalDepositedEur = totalDepositedEur; }

    public BigDecimal getDailyLimitEur() { return dailyLimitEur; }
    public void setDailyLimitEur(BigDecimal dailyLimitEur) { this.dailyLimitEur = dailyLimitEur; }

    public BigDecimal getDailySpentEur() { return dailySpentEur; }
    public void setDailySpentEur(BigDecimal dailySpentEur) { this.dailySpentEur = dailySpentEur; }

    public String getLastActivity() { return lastActivity; }
    public void setLastActivity(String lastActivity) { this.lastActivity = lastActivity; }
}
