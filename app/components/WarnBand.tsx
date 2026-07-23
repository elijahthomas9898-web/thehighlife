import { WARNING_TEXT } from "@/data/site";

/** Required NY compliance warning. Shown on every page. */
export default function WarnBand() {
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
