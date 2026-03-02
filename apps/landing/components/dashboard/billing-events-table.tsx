"use client";

import { fetchApi } from "@/lib/api-client";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

type BillingEvent = {
  id: string;
  type: string;
  occurredAt: string;
};

const PAGE_SIZE = 10;

type EventMeta = { label: string; variant: "default" | "secondary" | "destructive" | "outline" };

const eventMeta: Record<string, EventMeta> = {
  "customer.subscription.created": { label: "Abo erstellt", variant: "default" },
  "customer.subscription.updated": { label: "Abo aktualisiert", variant: "secondary" },
  "customer.subscription.deleted": { label: "Abo gekündigt", variant: "destructive" },
  "invoice.paid": { label: "Rechnung bezahlt", variant: "default" },
  "invoice.payment_failed": { label: "Zahlung fehlgeschlagen", variant: "destructive" },
  "checkout.session.completed": { label: "Checkout abgeschlossen", variant: "default" },
};

function getEventMeta(type: string): EventMeta {
  return eventMeta[type] ?? { label: type.replace(/\./g, " › "), variant: "outline" };
}

export function BillingEventsTable() {
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchApi(
          `/v1/billing/events?limit=${PAGE_SIZE + 1}&offset=${offset}`,
        );
        if (!res.ok) {
          toast.error("Ereignisse konnten nicht geladen werden.");
          return;
        }
        const data: BillingEvent[] = await res.json();
        setHasMore(data.length > PAGE_SIZE);
        setEvents(data.slice(0, PAGE_SIZE));
      } catch {
        toast.error("Netzwerkfehler.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [offset]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abrechnungsereignisse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0 && offset === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abrechnungsereignisse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Keine Abrechnungsereignisse vorhanden.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Abrechnungsereignisse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ereignis</TableHead>
              <TableHead className="text-right">Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const meta = getEventMeta(event.type);
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(event.occurredAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Zurück
          </Button>
          <span className="text-xs text-muted-foreground">
            Seite {Math.floor(offset / PAGE_SIZE) + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Weiter
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
