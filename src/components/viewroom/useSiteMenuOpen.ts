"use client";

import { useEffect, useState } from "react";

/**
 * Read-only bridge to the site header's menu (`#site-menu[data-open]`, kept mounted by the Farmio
 * Header). Lets the viewer yield keyboard/pointer input while the menu is open without coupling
 * the viewer to the header. If the menu element is not in the DOM yet, waits for it to appear.
 */
export function useSiteMenuOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let attrs: MutationObserver | null = null;
    let waiting: MutationObserver | null = null;

    const attach = (el: HTMLElement) => {
      const read = () => setOpen(el.getAttribute("data-open") === "true");
      read();
      attrs = new MutationObserver(read);
      attrs.observe(el, { attributes: true, attributeFilter: ["data-open"] });
    };

    const el = document.getElementById("site-menu");
    if (el) attach(el);
    else {
      waiting = new MutationObserver(() => {
        const found = document.getElementById("site-menu");
        if (!found) return;
        waiting?.disconnect();
        waiting = null;
        attach(found);
      });
      waiting.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      attrs?.disconnect();
      waiting?.disconnect();
    };
  }, []);
  return open;
}
