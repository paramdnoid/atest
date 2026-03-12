import { LogIn } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { LoginForm } from '@/components/login-form';

export const metadata = {
  title: 'Anmelden',
};

export default function SignInPage() {
  return (
    <AuthPageShell
      badgeIcon={LogIn}
      badgeLabel="Anmelden"
      heading="Willkommen zurück."
      subtitle="Melde dich mit deinem ZunftGewerk-Konto an."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
