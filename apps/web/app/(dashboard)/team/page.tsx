'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, UserCircle2, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Member = {
  userId: string;
  email: string;
  name?: string;
  role: string;
  joinedAt?: string;
};

const roleBadge: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  admin: 'bg-blue-50 text-blue-700',
  member: 'bg-zinc-100 text-zinc-600',
};

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('zg_access_token');
    if (!token) {
      router.push('/signin');
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
      <div className="px-6 py-12">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">{members.length} Mitglieder in diesem Workspace</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMembers} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {members.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Mitglied</th>
                <th className="px-4 py-3 font-medium">Rolle</th>
                <th className="px-4 py-3 font-medium">Mitglied seit</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{m.name ?? m.email}</p>
                        {m.name && <p className="text-xs text-muted-foreground">{m.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[m.role] ?? 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('de-DE') : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium">Noch keine Team-Mitglieder</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Team-Mitglieder erscheinen hier nach dem Einladen.
          </p>
        </div>
      )}
    </div>
  );
}
