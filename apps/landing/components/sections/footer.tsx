import { Separator } from "@/components/ui/separator";
import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { FadeIn } from "@/components/fade-in";
import { FaqDialog } from "@/components/faq-dialog";
import { SectionContainer } from "@/components/section-container";

const socialLinks = [
  {
    href: "https://github.com/zunftgewerk",
    label: "GitHub",
    icon: Github,
  },
  {
    href: "https://linkedin.com/company/zunftgewerk",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "https://twitter.com/zunftgewerk",
    label: "Twitter",
    icon: Twitter,
  },
] as const;

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Preise" },
  { href: "#trades", label: "Branchenlösungen" },
] as const;

const supportLinks = [
  { href: "mailto:support@zunftgewerk.de", label: "Kontakt" },
] as const;

const legalLinks = [
  { href: "/legal/imprint", label: "Impressum" },
  { href: "/legal/terms", label: "AGB" },
  { href: "/legal/privacy", label: "Datenschutz" },
] as const;

export function Footer() {
  // Evaluated at request/build time. Acceptable: the page is regenerated on
  // each new deployment, so the year will always be current in production.
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-muted/30" aria-label="Fußbereich">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/40 to-transparent" />
      <SectionContainer className="py-12 md:py-16">
        <FadeIn>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <BrandLogo
                size="sm"
                fontWeight="extrabold"
                className="mb-4 inline-flex items-center gap-3"
              />
              <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                Die All-in-One Software für Kaminfeger, Maler und SHK-Betriebe.
                DSGVO-konform und made in Germany.
              </p>
              <div className="mt-5 flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200"
                    aria-label={`${social.label} (öffnet in neuem Tab)`}
                  >
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <nav aria-label="Produkt-Links" className="lg:text-right">
              <h3 className="mb-4 text-sm font-semibold">Produkt</h3>
              <ul className="text-muted-foreground space-y-3 text-sm">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="hover-underline hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <FaqDialog>
                    <button
                      type="button"
                      className="hover-underline hover:text-foreground transition-colors"
                    >
                      FAQ
                    </button>
                  </FaqDialog>
                </li>
              </ul>
            </nav>

            <nav aria-label="Support-Links" className="lg:text-right">
              <h3 className="mb-4 text-sm font-semibold">Support</h3>
              <ul className="text-muted-foreground space-y-3 text-sm">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="hover-underline hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Rechtliches" className="lg:text-right">
              <h3 className="mb-4 text-sm font-semibold">Rechtliches</h3>
              <ul className="text-muted-foreground space-y-3 text-sm">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover-underline hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Separator className="my-8 opacity-50" />

          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-center text-sm sm:flex-row sm:text-left">
            <p>&copy; {currentYear} ZunftGewerk GmbH. Alle Rechte vorbehalten.</p>
            <p className="flex items-center gap-1.5">
              Made with Sorgfalt in Deutschland
              <span aria-label="Deutsche Flagge" role="img" className="text-xs">
                &#x1F1E9;&#x1F1EA;
              </span>
            </p>
          </div>
        </FadeIn>
      </SectionContainer>
    </footer>
  );
}
