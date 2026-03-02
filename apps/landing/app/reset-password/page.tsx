import { ShieldCheck } from "lucide-react";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = {
  title: "Neues Passwort setzen",
};

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      badgeIcon={ShieldCheck}
      badgeLabel="Sicherheit"
      heading="Neues Passwort setzen."
      subtitle="Gib den Code aus deiner E-Mail und dein neues Passwort ein."
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
