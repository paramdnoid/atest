import { KeyRound } from "lucide-react";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Passwort vergessen",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      badgeIcon={KeyRound}
      badgeLabel="Passwort zurücksetzen"
      heading="Passwort vergessen?"
      subtitle="Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
