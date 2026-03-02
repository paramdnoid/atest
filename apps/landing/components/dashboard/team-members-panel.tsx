import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
}: {
  members: TeamMember[];
  error?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Teammitglieder</CardTitle>
            <CardDescription>
              {error
                ? "Mitglieder konnten nicht geladen werden."
                : members.length === 0
                  ? "Noch keine Mitglieder im Workspace."
                  : `${members.length} Mitglied${members.length !== 1 ? "er" : ""} im Workspace`}
            </CardDescription>
          </div>
          <Badge variant="outline" className="tabular-nums">
            {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            Mitgliederdaten konnten nicht geladen werden. Bitte die Seite neu laden.
          </div>
        ) : members.length === 0 ? (
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
                <TableHead>Beigetreten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
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
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {new Date(member.joinedAt).toLocaleDateString("de-DE")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
