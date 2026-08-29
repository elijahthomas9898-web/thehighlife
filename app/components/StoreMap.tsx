import { store } from "@/data/site";

/**
 * A real Google map of the shop, replacing the decorative grid-and-dot placeholder
 * that looked like a map but showed nothing.
 *
 * The address comes from `store` in data/site.ts — the same source the
 * "Get Directions" buttons already use — so the map, the buttons and the printed
 * address can never drift apart. (They had: /visit once carried its own hardcoded
 * copy of the address and was still sending people to the old one.)
 *
 * No API key: `maps?q=<address>&output=embed` is Google's keyless embed. And no
 * CSP change was needed — next.config.ts only sets `frame-ancestors`, which
 * governs who may embed US, not what we embed.
 *
 * Lazy-loaded on purpose: it sits below the fold on both pages, and Google's embed
 * pulls in their script and cookies. Visitors who never scroll that far pay
 * nothing for it. The map is for orientation only — the Get Directions button
 * beside it is what opens the visitor's own Maps app with navigation.
 */
export default function StoreMap({
  className = "map",
  height,
}: {
  className?: string;
  height?: number;
}) {
  const address = `${store.addressLine1}, ${store.addressLine2}`;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className={className} style={height ? { height } : undefined}>
      <iframe
        src={src}
        title={`Map showing ${store.name} at ${address}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
