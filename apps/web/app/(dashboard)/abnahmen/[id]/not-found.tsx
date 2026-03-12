import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';

export default function AbnahmeDetailNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<SearchX className="h-8 w-8" />}
        title="Abnahme nicht gefunden"
        description="Der Datensatz existiert nicht oder ist nicht mehr verfügbar."
      />
      <Button asChild variant="outline">
        <Link href="/abnahmen">Zurück zur Abnahmeliste</Link>
      </Button>
    </div>
  );
}
