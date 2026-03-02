"use client";

import { fetchApi } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function WorkspaceSettingsForm({
  initialName,
  initialSlug,
}: {
  initialName: string;
  initialSlug: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);

  const isDirty = name !== initialName || slug !== initialSlug;
  const isValid = name.trim().length > 0 && slug.trim().length >= 2;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || !isValid) return;
    setSaving(true);
    try {
      const res = await fetchApi("/v1/workspace/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Speichern fehlgeschlagen.");
        return;
      }
      toast.success("Einstellungen wurden gespeichert.");
      router.refresh();
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace-Einstellungen</CardTitle>
        <CardDescription>
          Grundlegende Konfiguration deines Workspace.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace-Name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mein Unternehmen"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Der Name wird im Dashboard und in E-Mails angezeigt.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-slug">URL-Slug</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground shrink-0">zunftgewerk.de/</span>
                <Input
                  id="ws-slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="mein-workspace"
                  maxLength={50}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nur Kleinbuchstaben, Zahlen und Bindestriche (min. 2 Zeichen).
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || !isValid || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Speichere…" : "Änderungen speichern"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
