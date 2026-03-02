import { FadeIn, StaggerChildren, StaggerItem } from "@/components/fade-in";
import { GradientText } from "@/components/gradient-text";
import { SectionContainer } from "@/components/section-container";
import { steps } from "@/content/steps";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32" aria-labelledby="how-it-works-heading">
      <SectionContainer>
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
          <p className="text-primary mb-4 text-xs font-bold tracking-[0.15em] uppercase">So funktioniert&apos;s</p>
          <h2
            id="how-it-works-heading"
            className="hero-text-gloss font-display mb-4 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl"
          >
            In 3 Schritten zum <GradientText>digitalen Betrieb</GradientText>
          </h2>
          <p className="text-muted-foreground text-lg">
            Starten Sie in wenigen Minuten — ohne technisches Vorwissen.
          </p>
        </FadeIn>

        <StaggerChildren
          className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3 md:gap-6 lg:gap-12"
          staggerDelay={0.15}
        >
          {steps.map((item, index) => (
            <StaggerItem key={item.step}>
              <div className="group relative text-center">
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute top-12 left-[calc(50%+3.5rem)] hidden h-px w-[calc(100%-7rem)] md:block"
                  >
                    <div className="from-primary/30 via-primary/15 h-full w-full bg-linear-to-r to-primary/30" />
                    <div className="from-primary/0 via-primary/40 to-primary/0 absolute inset-0 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                )}
                <div className="from-primary/10 shadow-card ring-primary/10 group-hover:shadow-card-hover group-hover:ring-primary/20 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br to-primary/5 ring-1 ring-inset transition-all duration-500">
                  <span
                    className="animate-gradient-x from-primary bg-linear-to-r to-amber-500 bg-clip-text text-3xl font-extrabold text-transparent"
                    aria-label={`Schritt ${item.step}`}
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display mb-3 text-lg font-bold">{item.title}</h3>
                <p className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </SectionContainer>
    </section>
  );
}
