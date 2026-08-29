package com.settleflow.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin_audit_logs")
public class AuditLog {

    @Id
    private String id;
    private String timestamp;
    private String adminName;
    private String adminRole;
    private String action;
    private String targetCategory;
    private String details;
    private String ipAddress;

    public AuditLog() {}

    public AuditLog(String id, String timestamp, String adminName, String adminRole, String action, String targetCategory, String details, String ipAddress) {
        this.id = id;
        this.timestamp = timestamp;
        this.adminName = adminName;
        this.adminRole = adminRole;
        this.action = action;
        this.targetCategory = targetCategory;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getAdminRole() { return adminRole; }
    public void setAdminRole(String adminRole) { this.adminRole = adminRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTargetCategory() { return targetCategory; }
    public void setTargetCategory(String targetCategory) { this.targetCategory = targetCategory; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
