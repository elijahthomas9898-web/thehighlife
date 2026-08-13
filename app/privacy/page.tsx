import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { store } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy | The High Life Dispensary",
  description:
    "How The High Life Dispensary handles your information. A licensed New York adult-use cannabis retailer. 21+.",
};

/** Change this whenever the policy is edited. */
const UPDATED = "August 13, 2026";

const LEAD =
  `This Privacy Policy explains how The High Life Dispensary, operated by Hydro Phonics, LLC ` +
  `(“The High Life,” “we,” “us”), handles information when you use ${"thehighlifeny.com"}. We are a ` +
  `licensed New York State adult-use cannabis retailer, and this website is intended only for adults ` +
  `21 and older.`;

type Block = string | { list: string[] };
type Section = { h: string; blocks: Block[] };

const sections: Section[] = [
  {
    h: "Who this applies to (21+)",
    blocks: [
      "This website and our services are for adults 21 and older. We do not knowingly collect information from anyone under 21. If you are not 21, please do not use this site or give us any information.",
    ],
  },
  {
    h: "Information we collect",
    blocks: [
      "We try to collect as little as possible. In practice that means:",
      {
        list: [
          "Reservation details — if you reserve products for in-store pickup, we collect your first name, last name, phone number, an optional email address, and the items you select.",
          "Age confirmation — when you confirm you are 21 or older, your browser stores a simple flag so we do not have to keep asking. We do not store your date of birth.",
          "Your cart — the items you add are saved locally in your own browser and stay on your device. They are only sent to us if you place a reservation.",
          "Basic technical data — like any website, our hosting provider may briefly log standard request information (such as IP address and browser type) to keep the site running and secure.",
        ],
      },
      "What we do NOT collect on this website today: we do not take online payments, and we do not collect a photo of your government ID online. If we add delivery, online payment, or online ID verification in the future, we will update this policy before turning those on.",
    ],
  },
  {
    h: "How we use your information",
    blocks: [
      {
        list: [
          "To prepare and hold your pickup reservation.",
          "To contact you about that reservation — for example, to confirm it is ready or to let you know an item is unavailable.",
          "To operate, secure, and improve the website.",
          "To meet our obligations under New York State cannabis laws and regulations.",
        ],
      },
    ],
  },
  {
    h: "How your information is shared",
    blocks: [
      "We do not sell your personal information. We share it only as needed to run the business:",
      {
        list: [
          "Proteus 420 — our point-of-sale system. Reservation details are sent here to create and manage your order. Proteus is our system of record.",
          "Service providers — such as our website host, and, in the future, a payment processor if you choose to pay online.",
          "Legal and regulatory — the New York State Office of Cannabis Management or other authorities where required by law, and to protect our rights and safety.",
        ],
      },
    ],
  },
  {
    h: "Where your information is kept",
    blocks: [
      "This website does not keep its own separate customer database. The reservation details you submit are stored in our point-of-sale system (Proteus 420) and kept in line with our record-keeping obligations under New York law. The cart on your device stays in your browser until you clear it or complete a reservation.",
    ],
  },
  {
    h: "Text messages and email",
    blocks: [
      "If you give us your phone number or email for a reservation, we may use them to contact you about that order. Message and data rates may apply. You can ask us to stop sending you marketing messages at any time by replying STOP to a text or by emailing us.",
    ],
  },
  {
    h: "Cookies and local storage",
    blocks: [
      "We use only the storage needed to make the site work — such as remembering your age confirmation and your cart. We do not use third-party advertising cookies. If this ever changes, we will update this policy.",
    ],
  },
  {
    h: "How we protect your information",
    blocks: [
      {
        list: [
          "Connections to the site are encrypted (HTTPS).",
          "The keys that connect the site to our point-of-sale system are kept on our servers only and are never exposed in your browser.",
          "No method of transmission or storage is perfectly secure, but we take reasonable steps to protect your information.",
        ],
      },
    ],
  },
  {
    h: "Your choices and rights",
    blocks: [
      "You can ask what reservation information we have about you, or ask us to correct or delete it, by emailing us. Because your order information lives in our point-of-sale system, some records may be kept where the law requires us to retain them.",
    ],
  },
  {
    h: "Children",
    blocks: [
      "Our products and this website are strictly for adults 21 and older. We do not knowingly collect information from anyone under 21.",
    ],
  },
  {
    h: "Changes to this policy",
    blocks: [
      "We may update this Privacy Policy from time to time. When we do, we will change the “Last updated” date above, and meaningful changes will be reflected here before they take effect.",
    ],
  },
];

export default function PrivacyPage() {
  const addr = `${store.addressLine1}, ${store.addressLine2}`;
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            Legal <span>/ privacy</span>
          </div>
          <h2>Privacy Policy</h2>

          <div className="legal-doc">
            <p className="updated">Last updated: {UPDATED}</p>
            <p className="legal-lead">{LEAD}</p>

            {sections.map((s, i) => (
              <section key={i}>
                <h3>{s.h}</h3>
                {s.blocks.map((b, j) =>
                  typeof b === "string" ? (
                    <p key={j}>{b}</p>
                  ) : (
                    <ul key={j}>
                      {b.list.map((li, k) => (
                        <li key={k}>{li}</li>
                      ))}
                    </ul>
                  )
                )}
              </section>
            ))}

            <section>
              <h3>Contact us</h3>
              <p>
                The High Life Dispensary / Hydro Phonics, LLC
                <br />
                {addr}
                <br />
                Email: <a href={`mailto:${store.email}`}>{store.email}</a>
                <br />
                NYS OCM License #{store.license}
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
