import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';

export default function KundenDetailNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<SearchX className="h-8 w-8" />}
        title="Kunde nicht gefunden"
        description="Der Datensatz existiert nicht oder ist nicht mehr verfuegbar."
      />
      <Button asChild variant="outline">
        <Link href="/kunden">Zurueck zur Kundenliste</Link>
      </Button>
    </div>
  );
}
