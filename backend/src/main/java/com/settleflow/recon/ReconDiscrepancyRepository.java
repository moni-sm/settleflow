package com.settleflow.recon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconDiscrepancyRepository extends JpaRepository<ReconDiscrepancy, String> {
    List<ReconDiscrepancy> findByRunId(String runId);
}
