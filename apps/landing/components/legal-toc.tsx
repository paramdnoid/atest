"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type TocEntry = { id: string; text: string };

export function LegalTableOfContents() {
  const [headings, setHeadings] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState("");
  const pathname = usePathname();

  // Scan h2 headings — re-run when pathname changes (tab switch)
  useEffect(() => {
    // Small delay to ensure content is rendered after navigation
    const timer = setTimeout(() => {
      const article = document.querySelector("[data-legal-article]");
      if (!article) return;

      const h2s = article.querySelectorAll("h2");
      const entries: TocEntry[] = [];

      h2s.forEach((h2, i) => {
        if (!h2.id) h2.id = `section-${i}`;
        entries.push({ id: h2.id, text: h2.textContent ?? "" });
      });

      setHeadings(entries);
      // Set first heading as initially active
      if (entries.length > 0) setActiveId(entries[0].id);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Scroll spy via IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Track which headings are currently visible
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Inhaltsverzeichnis" className="hidden xl:block">
      <div className="sticky top-28">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Inhalt
        </p>
        <ul className="space-y-0.5 border-l border-border">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) {
                    const y =
                      el.getBoundingClientRect().top + window.scrollY - 96;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 pl-4 text-[13px] leading-snug transition-colors",
                  activeId === h.id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
