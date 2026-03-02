import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  size?: "xs" | "sm" | "md";
  showTagline?: boolean;
  fontWeight?: "bold" | "extrabold";
  priority?: boolean;
  className?: string;
};

export function BrandLogo({
  size = "md",
  showTagline = true,
  fontWeight = "bold",
  priority = false,
  className,
}: BrandLogoProps) {
  const imgSize = size === "xs" ? 28 : size === "sm" ? 36 : 40;
  const isExtrabold = fontWeight === "extrabold";

  return (
    <Link
      href="/"
      className={className ?? "group flex items-center gap-3"}
      aria-label="ZunftGewerk — Zur Startseite"
    >
      <Image
        src="/logo.png"
        alt=""
        role="presentation"
        width={imgSize}
        height={imgSize}
        priority={priority}
        className="object-contain"
      />
      <div className="flex flex-col leading-none">
        <span
          className={[
            "font-display tracking-tight",
            size === "xs" ? "text-sm" : "text-lg",
            isExtrabold ? "font-extrabold" : size === "xs" ? "font-bold" : "font-bold sm:text-xl",
          ].join(" ")}
        >
          Zunft
          <span
            className={[
              "text-foreground/70",
              isExtrabold ? "font-extrabold" : "font-bold",
            ].join(" ")}
          >
            Gewerk
          </span>
        </span>
        {showTagline && (
          <span
            className={[
              "text-muted-foreground font-medium uppercase",
              isExtrabold
                ? "text-[11px] tracking-[0.15em]"
                : "hidden text-[10px] tracking-[0.22em] sm:block",
            ].join(" ")}
          >
            Handwerk. Digital.
          </span>
        )}
      </div>
    </Link>
  );
}
