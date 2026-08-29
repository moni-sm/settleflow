package com.settleflow.routing;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "routing_rules")
public class RoutingRule {

    @Id
    private String id;
    private String name;
    private String currency;
    private String preferredPsp;
    private String fallbackPsp;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private int trafficWeight; // percentage (0-100)
    private boolean enabled;

    public RoutingRule() {}

    public RoutingRule(String id, String name, String currency, String preferredPsp, String fallbackPsp,
                       BigDecimal minAmount, BigDecimal maxAmount, int trafficWeight, boolean enabled) {
        this.id = id;
        this.name = name;
        this.currency = currency;
        this.preferredPsp = preferredPsp;
        this.fallbackPsp = fallbackPsp;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.trafficWeight = trafficWeight;
        this.enabled = enabled;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPreferredPsp() { return preferredPsp; }
    public void setPreferredPsp(String preferredPsp) { this.preferredPsp = preferredPsp; }

    public String getFallbackPsp() { return fallbackPsp; }
    public void setFallbackPsp(String fallbackPsp) { this.fallbackPsp = fallbackPsp; }

    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }

    public BigDecimal getMaxAmount() { return maxAmount; }
    public void setMaxAmount(BigDecimal maxAmount) { this.maxAmount = maxAmount; }

    public int getTrafficWeight() { return trafficWeight; }
    public void setTrafficWeight(int trafficWeight) { this.trafficWeight = trafficWeight; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
