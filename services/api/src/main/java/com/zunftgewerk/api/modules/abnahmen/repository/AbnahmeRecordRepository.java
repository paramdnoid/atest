package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeRecordRepository extends JpaRepository<AbnahmeRecordEntity, UUID> {
    List<AbnahmeRecordEntity> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    Optional<AbnahmeRecordEntity> findByTenantIdAndId(UUID tenantId, UUID id);
    boolean existsByTenantIdAndNumber(UUID tenantId, String number);
    @Query("""
        select e.status, count(e)
        from AbnahmeRecordEntity e
        where e.tenantId = :tenantId and e.deletedAt is null
        group by e.status
        """)
    List<Object[]> countActiveByStatus(@Param("tenantId") UUID tenantId);
}
