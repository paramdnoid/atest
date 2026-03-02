"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetchApi("/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/dashboard/billing" }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Portal konnte nicht geöffnet werden.");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="mr-2 h-4 w-4" />
      )}
      {loading ? "Öffne Portal…" : "Abo verwalten"}
    </Button>
  );
}
