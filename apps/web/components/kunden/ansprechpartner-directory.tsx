import { Contact } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import type { Ansprechpartner, KundenRolle } from '@/lib/kunden/types';
import { getContactDisplay } from '@/lib/kunden/privacy-policy';

type AnsprechpartnerDirectoryProps = {
  contacts: Ansprechpartner[];
  viewerRole: KundenRolle;
};

export function AnsprechpartnerDirectory({ contacts, viewerRole }: AnsprechpartnerDirectoryProps) {
  return (
    <ModuleTableCard
      icon={Contact}
      label="Ansprechpartner"
      title="Kontaktverzeichnis"
      hasData={contacts.length > 0}
      emptyState={{
        icon: <Contact className="h-8 w-8" />,
        title: 'Keine Ansprechpartner vorhanden',
        description: 'Mindestens ein Kontakt ist fuer Folgeauftraege empfohlen.',
      }}
    >
      <div className="space-y-2">
        {contacts.map((contact) => {
          const display = getContactDisplay(contact, viewerRole);
          return (
            <div key={contact.id} className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
              <p className="font-medium">
                {display.name}
                {contact.primary ? ' · Primaer' : ''}
              </p>
              <p className="text-muted-foreground">{display.rolle}</p>
              <p className="text-xs text-muted-foreground">
                {display.email} · {display.telefon}
              </p>
            </div>
          );
        })}
      </div>
    </ModuleTableCard>
  );
}
