"use client";

import { useEffect } from "react";

/**
 * Repairs mojibake in JSCart's own text.
 *
 * Proteus's widget source is double-encoded: it literally contains "â€”" where an
 * em dash belongs, so the bonus-item picker reads "You've earned a bonus item â€"
 * pick the one you'd like". Their file is served correctly as UTF-8 — the bad
 * characters are baked into it — so this can't be fixed with headers, and we can't
 * edit their file. Patching the rendered text is the only lever on our side.
 *
 * This is THEIR bug and worth reporting; this is a stopgap so customers don't see
 * it meanwhile.
 *
 * Only these four sequences are touched. They can't legitimately appear in real
 * copy, so a blanket replace is safe — and we skip the box-drawing run (â”€, 179
 * hits) because that only occurs in their code comments, never on screen.
 */
const FIXES: [RegExp, string][] = [
  [/â€”/g, "—"], // em dash — the visible one, 62 hits
  [/â€“/g, "–"], // en dash
  [/â†’/g, "→"], // right arrow
  [/â€¦/g, "…"], // ellipsis
  [/â€™/g, "’"], // right single quote
  [/Â·/g, "·"], // middle dot
  [/Â /g, " "], // non-breaking space
];

function repair(text: string): string {
  let out = text;
  for (const [pattern, replacement] of FIXES) out = out.replace(pattern, replacement);
  return out;
}

/** Walks text nodes under `root` and rewrites only the ones that actually change. */
function fixTree(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pending: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    pending.push(node as Text);
    node = walker.nextNode();
  }
  for (const textNode of pending) {
    const value = textNode.nodeValue;
    // Cheap gate: every broken sequence starts with one of these two characters.
    if (!value || (!value.includes("â") && !value.includes("Â"))) continue;
    const fixed = repair(value);
    // Only write on a real change, otherwise the observer would re-fire forever.
    if (fixed !== value) textNode.nodeValue = fixed;
  }
}

export default function ProteusTextFix() {
  useEffect(() => {
    fixTree(document.body);

    let queued = false;
    const observer = new MutationObserver((records) => {
      if (queued) return;
      queued = true;
      // Coalesce bursts — the widget rerenders whole views at once.
      requestAnimationFrame(() => {
        queued = false;
        for (const record of records) {
          record.addedNodes.forEach((n) => fixTree(n));
          if (record.type === "characterData" && record.target) fixTree(record.target);
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
