import Link from 'next/link';
import { FileSearch } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';

export default function AngebotNotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<FileSearch className="h-8 w-8" />}
        title="Angebot nicht gefunden"
        description="Der Datensatz existiert nicht oder ist nicht mehr verfuegbar."
      />
      <Button asChild variant="outline">
        <Link href="/angebote">Zur Angebotsliste</Link>
      </Button>
    </div>
  );
}
