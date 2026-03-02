import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
