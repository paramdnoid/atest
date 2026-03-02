package com.zunftgewerk.api.modules.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import com.zunftgewerk.api.modules.sync.entity.ClientOperationEntity;
import com.zunftgewerk.api.modules.sync.entity.EntitySyncStateEntity;
import com.zunftgewerk.api.modules.sync.model.PushResult;
import com.zunftgewerk.api.modules.sync.repository.ChangeLogRepository;
import com.zunftgewerk.api.modules.sync.repository.ClientOperationRepository;
import com.zunftgewerk.api.modules.sync.repository.EntitySyncStateRepository;
import com.zunftgewerk.api.modules.sync.service.SyncEngineService;
import com.zunftgewerk.api.proto.v1.ClientOperation;
import com.zunftgewerk.api.proto.v1.VectorClockEntry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SyncEngineConflictTest {

    @Test
    void shouldReturnConflictForStaleVector() {
        ChangeLogRepository changeLogRepository = mock(ChangeLogRepository.class);
        ClientOperationRepository clientOperationRepository = mock(ClientOperationRepository.class);
        EntitySyncStateRepository entitySyncStateRepository = mock(EntitySyncStateRepository.class);

        when(clientOperationRepository.findById("op_conflict")).thenReturn(Optional.empty());

        EntitySyncStateEntity state = new EntitySyncStateEntity();
        state.setTenantId(UUID.randomUUID());
        state.setEntityType("ticket");
        state.setEntityId("t1");
        state.setServerVersion(5);
        state.setVectorClockJson("{\"deviceA\":5}");
        state.setDeleted(false);
        state.setUpdatedAt(OffsetDateTime.now());
        when(entitySyncStateRepository.findById(any())).thenReturn(Optional.of(state));

        ChangeLogEntity latest = new ChangeLogEntity();
        latest.setPayloadDelta("{\"title\":\"server\"}");
        when(changeLogRepository.findTopByTenantIdAndEntityTypeAndEntityIdOrderByIdDesc(any(), any(), any()))
            .thenReturn(Optional.of(latest));

        SyncEngineService service = new SyncEngineService(
            changeLogRepository,
            clientOperationRepository,
            entitySyncStateRepository,
            new ObjectMapper()
        );

        ClientOperation operation = ClientOperation.newBuilder()
            .setClientOpId("op_conflict")
            .setEntityType("ticket")
            .setEntityId("t1")
            .setOperation("update")
            .setPayloadDeltaJson("{\"title\":\"client\"}")
            .addVectorClock(VectorClockEntry.newBuilder().setNode("deviceA").setCounter(3).build())
            .setOccurredAt(OffsetDateTime.now().toString())
            .build();

        PushResult result = service.pushChanges(UUID.randomUUID(), "deviceB", List.of(operation), List.of());

        assertThat(result.getAcceptedOperationIds()).isEmpty();
        assertThat(result.getConflicts()).hasSize(1);
        assertThat(result.getConflicts().get(0).reason()).isEqualTo("STALE_VECTOR");

        ArgumentCaptor<ClientOperationEntity> captor = ArgumentCaptor.forClass(ClientOperationEntity.class);
        verify(clientOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getAppliedStatus()).isEqualTo("CONFLICT");
    }

    @Test
    void shouldReplayStoredConflictForDuplicateClientOperation() {
        ChangeLogRepository changeLogRepository = mock(ChangeLogRepository.class);
        ClientOperationRepository clientOperationRepository = mock(ClientOperationRepository.class);
        EntitySyncStateRepository entitySyncStateRepository = mock(EntitySyncStateRepository.class);

        ClientOperationEntity replayed = new ClientOperationEntity();
        replayed.setClientOpId("op_conflict_replay");
        replayed.setAppliedStatus("CONFLICT");
        replayed.setResolution("SERVER_PATCH");
        replayed.setConflictType("STALE_VECTOR");
        replayed.setResolvedPayloadJson("{\"title\":\"server\"}");
        replayed.setServerVectorJson("{\"deviceA\":9}");
        replayed.setServerVersion(5L);
        when(clientOperationRepository.findById("op_conflict_replay")).thenReturn(Optional.of(replayed));

        SyncEngineService service = new SyncEngineService(
            changeLogRepository,
            clientOperationRepository,
            entitySyncStateRepository,
            new ObjectMapper()
        );

        ClientOperation operation = ClientOperation.newBuilder()
            .setClientOpId("op_conflict_replay")
            .setEntityType("ticket")
            .setEntityId("t1")
            .setOperation("update")
            .setPayloadDeltaJson("{\"title\":\"client\"}")
            .build();

        PushResult result = service.pushChanges(UUID.randomUUID(), "deviceB", List.of(operation), List.of());

        assertThat(result.getAcceptedOperationIds()).isEmpty();
        assertThat(result.getConflicts()).hasSize(1);
        assertThat(result.getConflicts().get(0).reason()).isEqualTo("STALE_VECTOR");
        assertThat(result.getConflicts().get(0).resolvedPayloadJson()).isEqualTo("{\"title\":\"server\"}");
        assertThat(result.getConflicts().get(0).serverVersion()).isEqualTo(5L);
        verify(changeLogRepository, never()).save(any());
    }
}
