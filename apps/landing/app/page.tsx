import { Header } from "@/components/header";
import { CtaSection } from "@/components/sections/cta-section";
import { FeaturesSection } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { TradesSection } from "@/components/sections/trades-section";
import { faqs } from "@/content/faqs";

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZunftGewerk",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android, Windows, macOS, Linux",
  description:
    "Die All-in-One Handwerkersoftware für Kaminfeger, Maler und SHK-Betriebe.",
  url: "https://zunftgewerk.de",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "49",
    highPrice: "99",
    offerCount: 2,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header revealDelayMs={1400} />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <TradesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CtaSection />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
