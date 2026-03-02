import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-3xl font-semibold">Pilot-Registrierung</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenant-Erstellung mit Passkey/MFA-Setup erfolgt ueber die Auth-API.</p>
        <form className="mt-6 space-y-3">
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Firma" />
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="E-Mail" type="email" />
          <Button className="w-full" type="submit">
            Registrieren
          </Button>
        </form>
      </div>
    </main>
  );
}
