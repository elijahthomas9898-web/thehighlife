import { store } from "@/data/site";
import Hours from "./Hours";

export default function Visit() {
  return (
    <section className="visit" id="visit">
      <div className="wrap">
        <h2 className="reveal">Visit The Shop</h2>
        <div className="visit-grid">
          <Hours />
          <div className="addr reveal">
            <div className="big">
              {store.addressLine1}
              <br />
              {store.addressLine2}
            </div>
            <p>
              Look for the green neon leaf. Come as you are — just bring a valid,
              government-issued 21+ ID every visit. No medical card required for adult-use.
              <br />
              <br />
              Questions?{" "}
              <a href={`mailto:${store.email}`} style={{ color: "var(--green)" }}>
                {store.email}
              </a>
            </p>
            <div className="map">
              <div className="pin" />
            </div>
            <a
              className="btn ghost"
              style={{ alignSelf: "flex-start" }}
              href={`https://maps.google.com/?q=${encodeURIComponent(
                `${store.addressLine1}, ${store.addressLine2}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
