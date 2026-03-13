'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ShieldCheck, UserCircle2, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { expectRecord, optionalArray, optionalString } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';

type Member = {
  userId: string;
  email: string;
  name?: string;
  role: string;
  joinedAt?: string;
};

function parseTeamMembersResponse(payload: unknown): { members: Member[] } {
  const record = expectRecord(payload, 'Team-Mitglieder');
  const members = optionalArray(record.members, (entry) => {
    const member = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : null;
    if (!member) return null;
    const userId = optionalString(member.userId);
    const email = optionalString(member.email);
    const role = optionalString(member.role);
    if (!userId || !email || !role) return null;
    return {
      userId,
      email,
      role,
      name: optionalString(member.name),
      joinedAt: optionalString(member.joinedAt),
    };
  });
  return { members };
}

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'outline',
  member: 'secondary',
};

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      router.push('/signin');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ members: Member[] }>({
        path: '/v1/team/members',
        token,
        validate: parseTeamMembersResponse,
      });
      setMembers(data.members ?? []);
    } catch {
      setError('Team-Mitglieder konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ModulePageTemplate
      title="Team & Lizenzen"
      description="Verwalte Teammitglieder und Zugänge für deinen Workspace."
      actions={
        <Button variant="outline" size="sm" onClick={fetchMembers} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      }
      kpis={[]}
      mainContent={
        <ModuleTableCard
          icon={Users}
          label="Team"
          title="Mitgliederübersicht"
          hasData={members.length > 0}
          errorMessage={error || undefined}
          emptyState={{
            icon: <Users className="h-8 w-8" />,
            title: 'Noch keine Team-Mitglieder',
            description: 'Team-Mitglieder erscheinen hier nach dem Einladen.',
          }}
        >
          <Table>
            <TableHeader className="bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Mitglied</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Rolle</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Mitglied seit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{member.name ?? member.email}</p>
                        {member.name && <p className="text-xs text-muted-foreground">{member.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={roleVariant[member.role] ?? 'secondary'} className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('de-DE') : '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ModuleTableCard>
      }
      sideContent={
        <ModuleTableCard icon={ShieldCheck} label="Rollen" title="Verteilung" hasData>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Owner: {members.filter((member) => member.role === 'owner').length}</p>
            <p>Admin: {members.filter((member) => member.role === 'admin').length}</p>
            <p>Member: {members.filter((member) => member.role === 'member').length}</p>
          </div>
        </ModuleTableCard>
      }
    />
  );
}
