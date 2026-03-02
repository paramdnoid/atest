package com.zunftgewerk.api.modules.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import com.zunftgewerk.api.modules.sync.model.PushResult;
import com.zunftgewerk.api.modules.sync.repository.ChangeLogRepository;
import com.zunftgewerk.api.modules.sync.repository.ClientOperationRepository;
import com.zunftgewerk.api.modules.sync.repository.EntitySyncStateRepository;
import com.zunftgewerk.api.modules.sync.service.SyncEngineService;
import com.zunftgewerk.api.proto.v1.ClientOperation;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SyncEngineServiceTest {

    @Test
    void shouldAcceptNewOperationAndWriteChangeLog() {
        ChangeLogRepository changeLogRepository = mock(ChangeLogRepository.class);
        ClientOperationRepository clientOperationRepository = mock(ClientOperationRepository.class);
        EntitySyncStateRepository entitySyncStateRepository = mock(EntitySyncStateRepository.class);

        when(clientOperationRepository.findById("op_1")).thenReturn(Optional.empty());
        when(entitySyncStateRepository.findById(any())).thenReturn(Optional.empty());

        SyncEngineService service = new SyncEngineService(
            changeLogRepository,
            clientOperationRepository,
            entitySyncStateRepository,
            new ObjectMapper()
        );

        ClientOperation operation = ClientOperation.newBuilder()
            .setClientOpId("op_1")
            .setEntityType("ticket")
            .setEntityId("t_1")
            .setOperation("update")
            .setPayloadDeltaJson("{\"title\":\"x\"}")
            .setBaseVersion(3)
            .build();

        PushResult result = service.pushChanges(UUID.randomUUID(), "device_1", List.of(operation), List.of());

        assertThat(result.getAcceptedOperationIds()).containsExactly("op_1");
        assertThat(result.getConflicts()).isEmpty();

        ArgumentCaptor<ChangeLogEntity> captor = ArgumentCaptor.forClass(ChangeLogEntity.class);
        verify(changeLogRepository).save(captor.capture());
        assertThat(captor.getValue().getServerVersion()).isEqualTo(1);

        verify(clientOperationRepository).save(any());
    }
}
