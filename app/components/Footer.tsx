import { store } from "@/data/site";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-title reveal">
          <span className="a">Live The</span>
          <span className="b">High Life</span>
        </div>
        <div className="footmeta">
          <span>
            {store.addressLine1}, {store.addressLine2}
          </span>
          <span>
            <a href={`mailto:${store.email}`}>{store.email}</a>
          </span>
          <span>
            <a href="#top">Back to top ↑</a>
          </span>
        </div>
        <div className="footlinks" role="navigation" aria-label="Legal">
          <a href="/about">About</a>
          <a href="/visit">Visit</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
        <p
          style={{
            marginTop: 28,
            color: "var(--muted)",
            fontSize: 12,
            maxWidth: "70ch",
            marginLeft: "auto",
            marginRight: "auto",
            fontFamily: "var(--mono)",
            lineHeight: 1.7,
          }}
        >
          {store.legal}
        </p>
      </div>
    </footer>
  );
}
