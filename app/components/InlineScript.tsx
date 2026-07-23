/**
 * Renders an inline <script> that runs synchronously during HTML parsing,
 * before first paint.
 *
 * The `type` swap is the documented Next.js workaround (see
 * node_modules/next/dist/docs → "Preventing flash before hydration"):
 * React warns whenever rendering produces a <script> tag, because scripts
 * inserted via DOM updates never execute. Emitting `text/javascript` on the
 * server and `text/plain` on the client silences that warning while keeping
 * the real script in the server HTML, where it actually runs.
 *
 * `suppressHydrationWarning` covers the resulting type mismatch.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
