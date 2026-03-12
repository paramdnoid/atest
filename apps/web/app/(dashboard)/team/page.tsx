'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, UserCircle2, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
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
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/cards';
import { EmptyState, ErrorBanner } from '@/components/dashboard/states';

type Member = {
  userId: string;
  email: string;
  name?: string;
  role: string;
  joinedAt?: string;
};

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
      const data = await apiRequest<{ members: Member[] }>({ path: '/v1/team/members', token });
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
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & Lizenzen"
        description="Verwalte Teammitglieder und Zugänge für deinen Workspace."
      >
        <Button variant="outline" size="sm" onClick={fetchMembers} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="premium-divider" />

      {members.length > 0 ? (
        <DashboardCard className="overflow-hidden">
          <DashboardCardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3">Mitglied</TableHead>
                  <TableHead className="px-4 py-3">Rolle</TableHead>
                  <TableHead className="px-4 py-3">Mitglied seit</TableHead>
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
          </DashboardCardContent>
        </DashboardCard>
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Noch keine Team-Mitglieder"
          description="Team-Mitglieder erscheinen hier nach dem Einladen."
        />
      )}
    </div>
  );
}
