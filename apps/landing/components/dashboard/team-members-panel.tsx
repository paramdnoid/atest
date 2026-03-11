"use client";

import { KeyRound, ShieldOff, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TeamMember = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  joinedAt: string;
  seatStatus?: "ACTIVE" | "NONE";
};

function RoleBadge({ role }: { role: string }) {
  if (role === "owner") {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        Inhaber
      </Badge>
    );
  }
  if (role === "admin") {
    return (
      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
        Admin
      </Badge>
    );
  }
  return <Badge variant="secondary">Mitglied</Badge>;
}

export function TeamMembersPanel({
  members,
  error,
  isAdmin,
  seatSummary,
}: {
  members: TeamMember[];
  error?: boolean;
  isAdmin: boolean;
  seatSummary: {
    includedSeats: number;
    usedSeats: number;
    availableSeats: number;
    overLimit: boolean;
  };
}) {
  const [localMembers, setLocalMembers] = useState(members);
  const [summary, setSummary] = useState(seatSummary);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const membersWithSeat = useMemo(
    () => localMembers.filter((m) => m.seatStatus === "ACTIVE").length,
    [localMembers],
  );

  function mapSeatErrorMessage(error: unknown, fallback: string) {
    const payload = (error ?? {}) as { code?: string; error?: string };
    if (payload.code === "OWNER_SEAT_PROTECTED") {
      return "Die Benutzerlizenz des Inhabers kann nicht entzogen werden.";
    }
    if (payload.code === "NO_AVAILABLE_SEAT") {
      return "Keine freie Benutzerlizenz verfügbar. Bitte Plan upgraden oder Sitz freigeben.";
    }
    return payload.error ?? fallback;
  }

  async function assignSeat(member: TeamMember) {
    setLoadingUserId(member.userId);
    try {
      const res = await fetchApi("/v1/licenses/seats/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(mapSeatErrorMessage(body, "Benutzerlizenz konnte nicht vergeben werden."));
        return;
      }
      setLocalMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, seatStatus: "ACTIVE" } : m)),
      );
      setSummary((prev) => ({
        ...prev,
        usedSeats: prev.usedSeats + 1,
        availableSeats: Math.max(0, prev.availableSeats - 1),
        overLimit: false,
      }));
      toast.success(`Benutzerlizenz für „${member.name ?? member.email}“ vergeben.`);
    } catch {
      toast.error("Netzwerkfehler beim Vergeben der Benutzerlizenz.");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function revokeSeat(member: TeamMember) {
    setLoadingUserId(member.userId);
    try {
      const res = await fetchApi("/v1/licenses/seats/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(mapSeatErrorMessage(body, "Benutzerlizenz konnte nicht entzogen werden."));
        return;
      }
      setLocalMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, seatStatus: "NONE" } : m)),
      );
      setSummary((prev) => ({
        ...prev,
        usedSeats: Math.max(0, prev.usedSeats - 1),
        availableSeats: prev.availableSeats + 1,
      }));
      toast.success(`Benutzerlizenz für „${member.name ?? member.email}“ entzogen.`);
    } catch {
      toast.error("Netzwerkfehler beim Entziehen der Benutzerlizenz.");
    } finally {
      setLoadingUserId(null);
    }
  }

  const atLimit = summary.availableSeats <= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Teammitglieder</CardTitle>
            <CardDescription>
              {error
                ? "Mitglieder konnten nicht geladen werden."
                : localMembers.length === 0
                  ? "Noch keine Mitglieder im Workspace."
                  : `${localMembers.length} Mitglied${localMembers.length !== 1 ? "er" : ""} im Workspace`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={summary.overLimit ? "destructive" : "outline"}
              className="tabular-nums"
            >
              {summary.usedSeats} / {summary.includedSeats} Benutzerlizenzen
            </Badge>
            <Badge variant="secondary" className="tabular-nums">
              {summary.availableSeats} frei
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!isAdmin && (
          <div className="border-b px-6 py-3 text-xs text-muted-foreground">
            Benutzerlizenzen können nur von Admins oder Inhabern vergeben und entzogen werden.
          </div>
        )}
        {error ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            Mitgliederdaten konnten nicht geladen werden. Bitte die Seite neu laden.
          </div>
        ) : localMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Keine Mitglieder</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lade Teammitglieder ein, um gemeinsam zu arbeiten.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Benutzerlizenz</TableHead>
                <TableHead>Beigetreten</TableHead>
                {isAdmin && <TableHead className="w-40">Aktionen</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="pl-6 font-medium">
                    {member.name ?? "–"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell>
                    {member.seatStatus === "ACTIVE" ? (
                      <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nicht zugewiesen</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {new Date(member.joinedAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {member.seatStatus === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          disabled={loadingUserId === member.userId}
                          onClick={() => revokeSeat(member)}
                        >
                          <ShieldOff className="mr-1 h-3 w-3" />
                          Entziehen
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          disabled={loadingUserId === member.userId || atLimit}
                          onClick={() => assignSeat(member)}
                          title={atLimit ? "Planlimit erreicht" : undefined}
                        >
                          <KeyRound className="mr-1 h-3 w-3" />
                          Zuweisen
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!error && localMembers.length > 0 && (
          <div className="border-t px-6 py-3 text-xs text-muted-foreground">
            {membersWithSeat} von {localMembers.length} Mitgliedern haben aktuell eine aktive
            Benutzerlizenz.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
