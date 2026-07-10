"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { trackConversion, withCurrentUtm } from "@/lib/analytics";

type ConversionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  location: string;
  ariaLabel?: string;
};

export function ConversionLink({ href, children, className, location, ariaLabel }: ConversionLinkProps) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    trackConversion("cta_click", { location, destination: href });
    const preservedHref = withCurrentUtm(href);
    if (preservedHref !== href) {
      event.preventDefault();
      window.location.assign(preservedHref);
    }
  }

  return (
    <Link href={href} onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}
