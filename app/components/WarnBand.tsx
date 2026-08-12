"use client";

import { usePathname } from "next/navigation";
import { WARNING_TEXT } from "@/data/site";

/** Required NY compliance warning. Shown on every page EXCEPT full-screen
 *  signage (/signage carries its own compact compliance strip instead). */
export default function WarnBand() {
  const path = usePathname();
  if (path?.startsWith("/signage")) return null;

  return (
    <aside className="warnband">
      <div className="inner">
        <p>
          <b>WARNING</b>: {WARNING_TEXT}
        </p>
      </div>
    </aside>
  );
}
