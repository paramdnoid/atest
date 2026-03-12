import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';

export default function AufmassDetailNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<SearchX className="h-8 w-8" />}
        title="Aufmaß nicht gefunden"
        description="Der Datensatz existiert nicht oder ist nicht mehr verfügbar."
      />
      <Button asChild variant="outline">
        <Link href="/aufmass">Zurück zur Aufmaßliste</Link>
      </Button>
    </div>
  );
}
