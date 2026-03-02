export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="hero-text-gloss-accent animate-gradient-x from-primary via-amber-500 to-primary bg-linear-to-r bg-clip-text text-transparent">
      {children}
    </span>
  );
}
