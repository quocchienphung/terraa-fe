"use client";

import { useEffect, useState } from "react";

/**
 * Read-only bridge to the site's existing menu overlay (`#site-menu[data-open]`, set by Header).
 * Lets the viewer yield keyboard/pointer input while the menu is open without changing Header.
 */
export function useSiteMenuOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = document.getElementById("site-menu");
    if (!el) return;
    const read = () => setOpen(el.getAttribute("data-open") === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-open"] });
    return () => mo.disconnect();
  }, []);
  return open;
}
