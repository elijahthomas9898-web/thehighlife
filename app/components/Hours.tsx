import { hours } from "@/data/site";

/**
 * Server-rendered. "Today" is highlighted purely by CSS, matched against the
 * `data-today` attribute the boot script sets on <html> using the STORE's
 * timezone. No client JS, no hydration mismatch, no flash.
 */
export default function Hours() {
  return (
    <div className="hours reveal">
      {hours.map((h) => (
        <div className="hr" key={h.day}>
          <span className="d">{h.day}</span>
          <span>{h.label}</span>
        </div>
      ))}
    </div>
  );
}
