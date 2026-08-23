import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms of Use | The High Life Dispensary",
  description:
    "The terms of use for The High Life website, online ordering, and communications. Adults 21+ only, New York.",
};

/** Change this whenever the terms are edited. */
const UPDATED = "August 14, 2026";

const LEAD =
  "Welcome to The High Life (“The High Life,” “Company,” “we,” “our,” or “us”). These Terms of " +
  "Service govern your use of our website, digital properties, online ordering tools, mobile " +
  "communications, and related services. By accessing or using this website, you agree to these Terms.";

type Block = string | { list: string[] };
type Section = { h: string; blocks: Block[] };

const sections: Section[] = [
  {
    h: "Eligibility",
    blocks: [
      "This website is intended solely for adults 21 years of age or older. By using this website, you represent that:",
      {
        list: [
          "You are at least 21 years old",
          "You are legally permitted to access cannabis-related information under applicable law",
          "Any information you submit is accurate and truthful",
        ],
      },
      "We reserve the right to restrict access or terminate use for violations.",
    ],
  },
  {
    h: "Products & Availability",
    blocks: [
      "All cannabis products displayed are:",
      {
        list: [
          "Subject to availability",
          "Subject to New York State adult-use cannabis regulations",
          "Available only where legally permitted",
        ],
      },
      "Product descriptions, potency, pricing, imagery, and availability may change without notice. The High Life does not guarantee availability of any specific product.",
    ],
  },
  {
    h: "Pricing",
    blocks: [
      {
        list: [
          "Pricing displayed may change without notice.",
          "Taxes, fees, and applicable charges may not be reflected until checkout.",
          "Errors in pricing, product descriptions, or availability may be corrected at any time.",
        ],
      },
    ],
  },
  {
    h: "Best Price Guarantee",
    blocks: [
      "The High Life may offer a Best Price Guarantee subject to separate promotional terms. Eligibility may require:",
      {
        list: [
          "Matching identical product",
          "Same brand",
          "Same package size",
          "Same potency where applicable",
          "Competitor licensed in New York",
          "Publicly advertised and verifiable pricing",
        ],
      },
      "We reserve the right to modify or discontinue promotional offers.",
    ],
  },
  {
    h: "Orders",
    blocks: [
      "Submitting an online order does not guarantee acceptance. Orders may be declined, modified, delayed, or canceled due to:",
      {
        list: [
          "Inventory limitations",
          "Compliance requirements",
          "Identification verification issues",
          "Suspected fraud",
          "Operational constraints",
        ],
      },
    ],
  },
  {
    h: "Payments",
    blocks: [
      "Accepted payment methods may vary. Due to cannabis industry banking limitations, some forms of payment may be unavailable.",
    ],
  },
  {
    h: "Marketing Communications",
    blocks: [
      "By submitting your information through our website, checkout, loyalty signup, event registration, promotional forms, or SMS opt-in tools, you may consent to receive:",
      {
        list: [
          "Marketing emails",
          "Promotional offers",
          "Product updates",
          "Loyalty communications",
          "Order notifications",
          "SMS marketing messages",
        ],
      },
      "Consent is not a condition of purchase. Message frequency may vary. Message and data rates may apply.",
      "You may unsubscribe:",
      {
        list: [
          "Email via unsubscribe links",
          "SMS by replying STOP",
          "HELP for assistance",
        ],
      },
    ],
  },
  {
    h: "Intellectual Property",
    blocks: [
      "All website content including branding, logos, copy, graphics, menus, design, and photography is owned by The High Life or used under permission. Unauthorized reproduction prohibited.",
    ],
  },
  {
    h: "Third Party Services",
    blocks: [
      "Our website may integrate third-party platforms including ecommerce/menu providers, payment processors, analytics tools, CRM systems, and email/SMS providers. We are not responsible for third-party policies or services.",
    ],
  },
  {
    h: "Disclaimer",
    blocks: [
      {
        list: [
          "Cannabis products are intended only for lawful adult use",
          "Statements on this website have not been evaluated by the FDA",
          "Cannabis products are not intended to diagnose, treat, cure, or prevent disease",
          "Do not drive or operate machinery while impaired",
          "Keep products away from children and pets",
        ],
      },
    ],
  },
  {
    h: "Limitation of Liability",
    blocks: [
      "To the maximum extent permitted by law, The High Life shall not be liable for indirect damages, incidental damages, lost profits, service interruptions, inaccuracies, or unauthorized access.",
    ],
  },
  {
    h: "Governing Law",
    blocks: ["Governed by the laws of the State of New York. Venue shall be Suffolk County, New York."],
  },
];

export default function TermsPage() {
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            Legal <span>/ terms of use</span>
          </div>
          <h2>Terms of Use</h2>

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
              <h3>Contact</h3>
              <p>
                The High Life
                <br />
                1300 Wellwood Ave, West Babylon, NY 11704
                <br />
                Email: <a href="mailto:info@thehighlife.shop">info@thehighlife.shop</a>
                <br />
                Phone: <a href="tel:+16312704989">(631) 270-4989</a>
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
