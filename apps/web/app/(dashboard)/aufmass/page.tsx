'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Ruler } from 'lucide-react';

import {
  AufmassListCommandBar,
  type AufmassListFilterState,
} from '@/components/aufmass/aufmass-list-command-bar';
import { AufmassListTable } from '@/components/aufmass/aufmass-list-table';
import { AufmassOperationalSnapshot } from '@/components/aufmass/aufmass-operational-snapshot';
import { AufmassRowContextRail } from '@/components/aufmass/aufmass-row-context-rail';
import {
  ModuleListHeaderControls,
  type ModuleListFilterToken,
} from '@/components/dashboard/module-list-header-controls';
import { PageHeader } from '@/components/dashboard/page-header';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { listAufmassRecordsSync } from '@/lib/aufmass/data-adapter';
import { matchesAufmassQuery } from '@/lib/aufmass/selectors';
import { getTransitionBlockers } from '@/lib/aufmass/state-machine';
import type { AufmassRecord } from '@/lib/aufmass/types';

export default function AufmassPage() {
  const searchParams = useSearchParams();
  const records = useMemo<AufmassRecord[]>(() => listAufmassRecordsSync(), []);
  const [filters, setFilters] = useState<AufmassListFilterState>({
    query: '',
    status: 'ALL',
    blockedOnly: false,
    dueOnly: false,
    versionAtLeast2: false,
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const handoffFrom = searchParams.get('handoffFrom');
  const handoffSuggestionId = searchParams.get('handoffSuggestionId') ?? undefined;
  const handoffQuery = [
    searchParams.get('handoffCustomer'),
    searchParams.get('handoffProject'),
    searchParams.get('handoffSite'),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');

  useEffect(() => {
    if (!handoffFrom || handoffQuery.trim().length === 0) return;
    setFilters((prev) => (prev.query === handoffQuery ? prev : { ...prev, query: handoffQuery }));
  }, [handoffFrom, handoffQuery]);

  const blockedRecordIds = useMemo(() => {
    const blockedIds = new Set<string>();
    for (const record of records) {
      const isBlocked =
        record.status === 'IN_REVIEW' && getTransitionBlockers(record, 'APPROVED').length > 0;
      if (isBlocked) blockedIds.add(record.id);
    }
    return blockedIds;
  }, [records]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
        const queryMatches = matchesAufmassQuery(record, filters.query);
        const blockedMatches = filters.blockedOnly ? blockedRecordIds.has(record.id) : true;
        const dueMatches = filters.dueOnly ? Boolean(record.dueDate) : true;
        const versionMatches = filters.versionAtLeast2 ? record.version >= 2 : true;
        return statusMatches && queryMatches && blockedMatches && dueMatches && versionMatches;
      }),
    [blockedRecordIds, filters.blockedOnly, filters.dueOnly, filters.query, filters.status, filters.versionAtLeast2, records],
  );
  const displayRecords = useMemo(() => {
    if (!handoffSuggestionId) return filteredRecords;
    return [...filteredRecords].sort((left, right) => {
      if (left.id === handoffSuggestionId) return -1;
      if (right.id === handoffSuggestionId) return 1;
      return 0;
    });
  }, [filteredRecords, handoffSuggestionId]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(handoffSuggestionId);
  const selectedRecord = useMemo(
    () => displayRecords.find((entry) => entry.id === selectedRecordId) ?? displayRecords[0],
    [displayRecords, selectedRecordId],
  );

  useEffect(() => {
    if (selectedRecordId && displayRecords.some((entry) => entry.id === selectedRecordId)) return;
    setSelectedRecordId(displayRecords[0]?.id);
  }, [displayRecords, selectedRecordId]);

  const reviewCount = records.filter((entry) => entry.status === 'IN_REVIEW').length;
  const openDrafts = records.filter((entry) => entry.status === 'DRAFT').length;
  const billedCount = records.filter((entry) => entry.status === 'BILLED').length;
  const blockedCount = useMemo(
    () => records.filter((entry) => blockedRecordIds.has(entry.id)).length,
    [blockedRecordIds, records],
  );
  const resetFilters = () =>
    setFilters({
      query: handoffFrom && handoffQuery ? handoffQuery : '',
      status: 'ALL',
      blockedOnly: false,
      dueOnly: false,
      versionAtLeast2: false,
    });

  const activeFilterTokens: ModuleListFilterToken[] = [
    filters.query.trim().length > 0
      ? {
          key: 'query',
          label: `Suche: ${filters.query}`,
          clear: () => setFilters((prev) => ({ ...prev, query: handoffFrom && handoffQuery ? handoffQuery : '' })),
        }
      : null,
    filters.blockedOnly
      ? {
          key: 'blockedOnly',
          label: 'Nur blockiert',
          clear: () => setFilters((prev) => ({ ...prev, blockedOnly: false })),
        }
      : null,
    filters.status !== 'ALL'
      ? {
          key: 'status',
          label: `Status: ${filters.status}`,
          clear: () => setFilters((prev) => ({ ...prev, status: 'ALL' })),
        }
      : null,
    filters.dueOnly
      ? {
          key: 'dueOnly',
          label: 'Nur mit Fälligkeit',
          clear: () => setFilters((prev) => ({ ...prev, dueOnly: false })),
        }
      : null,
    filters.versionAtLeast2
      ? {
          key: 'versionAtLeast2',
          label: 'Version >= 2',
          clear: () => setFilters((prev) => ({ ...prev, versionAtLeast2: false })),
        }
      : null,
  ].filter((token): token is { key: string; label: string; clear: () => void } => token !== null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aufmaß"
        titleClassName="text-lg"
        descriptionClassName="-mt-0.5"
        description="Operativer Arbeitsbereich für Erfassung, Prüfung und Abrechnung."
      >
        <Button size="sm" disabled title="Wird im nächsten Ausbauschritt aktiviert.">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden md:inline ml-2">Neues Aufmaß (folgt)</span>
          <span className="hidden sm:inline md:hidden ml-2">Neu (folgt)</span>
        </Button>
      </PageHeader>

      <AufmassOperationalSnapshot
        counts={{
          draft: openDrafts,
          inReview: reviewCount,
          blocked: blockedCount,
          billed: billedCount,
        }}
      />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <ModuleTableCard
          icon={Ruler}
          label="Aufmaßakte"
          title="Tabellenansicht"
          titleClassName="text-[13px]"
          action={
            <ModuleListHeaderControls
              query={filters.query}
              onQueryChange={(next) => setFilters((prev) => ({ ...prev, query: next }))}
              queryPlaceholder="Suche nach Nummer, Kunde, Projekt ..."
              queryAriaLabel="Aufmaßsuche"
              showTokens={false}
              inlineControl={
                <AufmassListCommandBar
                  filters={filters}
                  onChange={setFilters}
                  advancedOpen={advancedOpen}
                  onAdvancedOpenChange={setAdvancedOpen}
                  onReset={resetFilters}
                  handoffFrom={handoffFrom}
                  compact
                  hideSearch
                  asDropdown
                  chromeless
                  iconOnlyTrigger
                />
              }
            />
          }
          headerBottomContent={
            <ModuleListHeaderControls
              query={filters.query}
              onQueryChange={(next) => setFilters((prev) => ({ ...prev, query: next }))}
              queryPlaceholder="Suche nach Nummer, Kunde, Projekt ..."
              queryAriaLabel="Aufmaßsuche"
              showSearch={false}
              tokens={activeFilterTokens}
              onResetAll={resetFilters}
            />
          }
          hasData={displayRecords.length > 0}
          emptyState={{
            icon: <Ruler className="h-8 w-8" />,
            title: 'Keine Aufmaßdaten gefunden',
            description: 'Passe Filter an oder lege ein neues Aufmaß an.',
          }}
        >
          <AufmassListTable
            records={displayRecords}
            highlightedId={handoffSuggestionId}
            selectedId={selectedRecord?.id}
            onSelect={setSelectedRecordId}
          />
        </ModuleTableCard>
        <AufmassRowContextRail record={selectedRecord} />
      </section>
    </div>
  );
}
