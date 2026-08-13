import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { store } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms of Service | The High Life Dispensary",
  description:
    "The terms for using thehighlifeny.com and reserving products for in-store pickup. 21+ only.",
};

/** Change this whenever the terms are edited. */
const UPDATED = "August 13, 2026";

const LEAD =
  `These Terms govern your use of ${"thehighlifeny.com"}, operated by Hydro Phonics, LLC ` +
  `(“The High Life,” “we,” “us”). By using this website, you agree to these Terms. This site is ` +
  `intended only for adults 21 and older.`;

type Block = string | { list: string[] };
type Section = { h: string; blocks: Block[] };

const sections: Section[] = [
  {
    h: "Eligibility — 21+",
    blocks: [
      "You must be 21 years of age or older to use this website or to reserve products. A valid, government-issued photo ID proving you are 21 or older is required at pickup. We may refuse service and cancel any order that cannot be verified.",
    ],
  },
  {
    h: "What this website is",
    blocks: [
      "This website provides information about our store and products and, where enabled, lets you reserve products for in-store pickup. Product information, availability, and pricing come from our live point-of-sale system and can change at any time. Nothing on this site is medical advice.",
    ],
  },
  {
    h: "Pickup reservations",
    blocks: [
      {
        list: [
          "A reservation is a request to hold items for you. It is not a completed purchase and does not guarantee availability.",
          "No payment is taken online. You pay in store at the register when you pick up.",
          "Any total shown online is an estimate. The final price is set at the register, where applicable coupons and discounts are applied — so you may pay a different amount.",
          "You must present a valid 21+ ID at pickup. Reservations that are not picked up may be released back into inventory.",
          "We may limit, cancel, or refuse any reservation — for example, if an item sells out, a listed price is clearly wrong, or eligibility cannot be verified.",
        ],
      },
    ],
  },
  {
    h: "Purchase limits and lawful use",
    blocks: [
      "All sales are subject to New York State purchase limits and cannabis regulations. Products are for personal use by adults 21 and older only. Reselling our products, or purchasing on behalf of anyone under 21, is prohibited.",
    ],
  },
  {
    h: "Health and safety",
    blocks: [
      "Cannabis products may be habit forming and can impair concentration, coordination, and judgment. Do not operate a vehicle or machinery while under the influence of cannabis. For use only by adults 21 and older. Keep out of the reach of children and pets. Cannabis has not been analyzed or approved by the FDA, and there may be health risks associated with its use, including for those who are pregnant or breastfeeding. Please consult a physician before use.",
    ],
  },
  {
    h: "Pricing, coupons, and menu accuracy",
    blocks: [
      "We work to keep prices and availability accurate, but errors and changes happen. Online figures are estimates only; the register is the source of truth. Coupons and promotions are subject to their own terms, available inventory, and applicable law, and are applied in store.",
    ],
  },
  {
    h: "Intellectual property",
    blocks: [
      "The High Life™ is a trademark of Hydro Phonics, LLC. The content on this website — including text, graphics, logos, and design — is owned by us or our licensors and is protected by law. You may not copy, scrape, or reuse it without our written permission.",
    ],
  },
  {
    h: "Third-party links",
    blocks: [
      "This site may link to third-party services, such as maps. We are not responsible for the content or practices of those services.",
    ],
  },
  {
    h: "Disclaimers",
    blocks: [
      "The website is provided “as is” and “as available,” without warranties of any kind, express or implied, to the fullest extent permitted by law. We do not warrant that the site will be uninterrupted or error-free, or that menu information is complete or current.",
    ],
  },
  {
    h: "Limitation of liability",
    blocks: [
      "To the fullest extent permitted by law, Hydro Phonics, LLC and its owners, employees, and agents will not be liable for any indirect, incidental, or consequential damages arising from your use of this website or any reservation made through it.",
    ],
  },
  {
    h: "Governing law",
    blocks: [
      "These Terms are governed by the laws of the State of New York, without regard to its conflict-of-laws rules. Any dispute will be handled in the state or federal courts located in New York.",
    ],
  },
  {
    h: "Changes to these Terms",
    blocks: [
      "We may update these Terms from time to time. The “Last updated” date above shows when. By continuing to use the site after changes are posted, you accept the updated Terms.",
    ],
  },
];

export default function TermsPage() {
  const addr = `${store.addressLine1}, ${store.addressLine2}`;
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            Legal <span>/ terms</span>
          </div>
          <h2>Terms of Service</h2>

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
