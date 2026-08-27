import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The browser tab / home-screen icon: the wordmark centred on the brand black,
 * generated at build time so there's no binary to hand-edit.
 *
 * A `favicon.ico` can't be generated (Next only allows `icon` for that), which is
 * why the old app/favicon.ico was removed — leaving both would emit two <link
 * rel="icon"> tags and browsers would keep showing the stale one.
 *
 * 512px so it stays crisp when a phone saves the site to its home screen; the
 * browser scales it down for the tab. The logo is embedded as a data URI because
 * Satori (what renders this) can't fetch a relative path at build time.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// 924x398 source, drawn at 416 wide inside 48px padding — keeps its aspect ratio
// exactly, so the lettering never stretches.
const LOGO_W = 416;
const LOGO_H = 179;

export default function Icon() {
  const logo = readFileSync(join(process.cwd(), "public", "images", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={LOGO_W} height={LOGO_H} alt="" />
      </div>
    ),
    { ...size },
  );
}
