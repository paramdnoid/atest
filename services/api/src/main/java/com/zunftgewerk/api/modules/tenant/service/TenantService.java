package com.zunftgewerk.api.modules.tenant.service;

import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.entity.TenantEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final MembershipRepository membershipRepository;

    public TenantService(TenantRepository tenantRepository, MembershipRepository membershipRepository) {
        this.tenantRepository = tenantRepository;
        this.membershipRepository = membershipRepository;
    }

    public UUID createTenant(String name, UUID ownerUserId) {
        return createTenant(name, ownerUserId, null, null);
    }

    public UUID createTenant(String name, UUID ownerUserId, String tradeSlug, String addressJson) {
        TenantEntity tenant = new TenantEntity();
        tenant.setId(UUID.randomUUID());
        tenant.setName(name);
        tenant.setTradeSlug(tradeSlug);
        tenant.setAddressJson(addressJson);
        tenant.setCreatedAt(OffsetDateTime.now());
        tenantRepository.save(tenant);

        MembershipEntity ownerMembership = new MembershipEntity();
        ownerMembership.setId(UUID.randomUUID());
        ownerMembership.setTenantId(tenant.getId());
        ownerMembership.setUserId(ownerUserId);
        ownerMembership.setRoleKey("owner");
        ownerMembership.setCreatedAt(OffsetDateTime.now());
        membershipRepository.save(ownerMembership);

        return tenant.getId();
    }

    public UUID inviteMember(UUID tenantId, String email) {
        // Placeholder invitation ID. Replace with invitation aggregate and notification delivery.
        return UUID.nameUUIDFromBytes((tenantId.toString() + ":" + email).getBytes());
    }

    public boolean assignRole(UUID tenantId, UUID userId, String roleKey) {
        MembershipEntity membership = new MembershipEntity();
        membership.setId(UUID.randomUUID());
        membership.setTenantId(tenantId);
        membership.setUserId(userId);
        membership.setRoleKey(roleKey);
        membership.setCreatedAt(OffsetDateTime.now());
        membershipRepository.save(membership);
        return true;
    }

    public List<MembershipEntity> listMembers(UUID tenantId) {
        return membershipRepository.findByTenantId(tenantId);
    }
}
