"use client";

import { type MouseEvent, useCallback, useEffect } from "react";

/**
 * Provides smooth anchor scrolling with configurable offsets.
 * Handles initial page-load hash scrolling and nav link click interception.
 */
export function useAnchorScroll(getOffset: (href: string, isDesktop: boolean) => number) {
  const scrollToAnchor = useCallback(
    (
      href: string,
      options?: {
        behavior?: ScrollBehavior;
        updateHash?: boolean;
      },
    ) => {
      if (!href.startsWith("#")) return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const headerOffset = getOffset(href, isDesktop);
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: options?.behavior ?? "smooth" });
      if ((options?.updateHash ?? true) && window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
    },
    [getOffset],
  );

  // Scroll to hash on initial load
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;

    let timeoutId = 0;
    let attempts = 0;
    const maxAttempts = 60;

    const tryScroll = () => {
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        scrollToAnchor(hash, { behavior: "auto", updateHash: false });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        timeoutId = window.setTimeout(tryScroll, 50);
      }
    };

    tryScroll();
    return () => window.clearTimeout(timeoutId);
  }, [scrollToAnchor]);

  const handleNavLinkClick = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      href: string,
      options?: { onBeforeScroll?: () => void },
    ) => {
      if (!href.startsWith("#")) return;
      event.preventDefault();

      if (options?.onBeforeScroll) {
        options.onBeforeScroll();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToAnchor(href);
          });
        });
        return;
      }

      scrollToAnchor(href);
    },
    [scrollToAnchor],
  );

  return { scrollToAnchor, handleNavLinkClick };
}
