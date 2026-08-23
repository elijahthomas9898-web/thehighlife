import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { store } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy | The High Life Dispensary",
  description:
    "How The High Life collects, uses, shares, and protects your information. Adults 21+ only, New York.",
};

/** Change this whenever the policy is edited. */
const UPDATED = "August 14, 2026";
const PHONE = "(631) 270-4989";
const PHONE_TEL = "+16312704989";

const LEAD =
  "This Privacy Policy explains how The High Life (“The High Life,” “Company,” “we,” “our,” or “us”) " +
  "collects, uses, shares, and protects information when you use our website, online ordering tools, " +
  "loyalty and marketing programs, mobile communications, and related services. This website is for " +
  "adults 21 and older. By using it, you agree to this Policy.";

type Block = string | { list: string[] };
type Section = { h: string; blocks: Block[] };

const sections: Section[] = [
  {
    h: "Who this applies to (21+)",
    blocks: [
      "Our website and services are intended solely for adults 21 years of age or older. We do not knowingly collect information from anyone under 21. If you are not 21, please do not use this site or provide any information.",
    ],
  },
  {
    h: "Information we collect",
    blocks: [
      "Information you provide to us:",
      {
        list: [
          "Contact details — your name, phone number, email address, and (for delivery) a delivery address.",
          "Order information — the products you reserve or order, pickup/delivery preferences, and related notes.",
          "Account information — if you create an account, your login details and profile information.",
          "Age & identity verification — confirmation that you are 21+, and, where required (for example, certain delivery or pickup orders), a government-issued ID or a photo of it.",
          "Communications preferences — your opt-ins for email or SMS marketing and loyalty programs.",
        ],
      },
      "Information collected automatically:",
      {
        list: [
          "Device and usage data — such as IP address, browser type, pages viewed, and interactions, collected through cookies and similar technologies.",
          "Cookies and local storage — used to remember your age confirmation, your cart, your preferences, and to measure and improve the site.",
        ],
      },
      "Information from other sources:",
      {
        list: [
          "Our point-of-sale / online-ordering provider, which processes your orders and accounts.",
          "Payment processors, which handle any online payment you choose to make (we do not store full payment card or bank-account numbers).",
        ],
      },
    ],
  },
  {
    h: "How we use your information",
    blocks: [
      {
        list: [
          "To process, prepare, and fulfill your orders, and to hold pickup reservations.",
          "To verify that you are 21 or older and to confirm your identity where required by law.",
          "To create and manage your account, loyalty rewards, and store credit.",
          "To contact you about your orders and respond to your questions.",
          "To send marketing and promotional messages where you have opted in (see “Text messages” and “Your choices”).",
          "To operate, secure, analyze, and improve our website and services, and to prevent fraud.",
          "To comply with New York State cannabis laws and other legal obligations.",
        ],
      },
    ],
  },
  {
    h: "Text messages (SMS)",
    blocks: [
      "If you opt in, we may send you SMS messages such as order notifications, loyalty updates, and marketing offers. Consent to marketing texts is not a condition of any purchase. Message frequency may vary, and message and data rates may apply.",
      "You can opt out of marketing texts at any time by replying STOP, or reply HELP for assistance. Opting out of marketing does not stop transactional messages about an order you have placed.",
    ],
  },
  {
    h: "Cookies, analytics & tracking",
    blocks: [
      "We and our service providers use cookies, local storage, and similar technologies to run the site, remember your age confirmation and cart, understand how the site is used, and improve it. Most browsers let you control or block cookies, though some features may not work without them.",
      "We do not sell your personal information. Where analytics or advertising technologies are used, we aim to configure them in a privacy-conscious way, and we will update this Policy if our practices change.",
    ],
  },
  {
    h: "How we share your information",
    blocks: [
      "We do not sell your personal information. We share it only as needed to run the business:",
      {
        list: [
          "Service providers — including our online-ordering / point-of-sale provider, payment processors, and our email, SMS, CRM, analytics, and hosting providers, who process information on our behalf.",
          "Legal and regulatory — the New York State Office of Cannabis Management or other authorities where required by law, and to protect our rights, safety, and property.",
          "Business transfers — in connection with a merger, acquisition, or sale of assets, subject to this Policy.",
        ],
      },
    ],
  },
  {
    h: "Age & identity verification data",
    blocks: [
      "Where we collect a government-issued ID or a photo of it to verify age or identity, that information is used only for verification and legal-compliance purposes, is handled through our secure ordering and point-of-sale systems, and is retained only as long as needed for those purposes or as required by law.",
    ],
  },
  {
    h: "How long we keep your information",
    blocks: [
      "We keep personal information for as long as needed to provide our services and for legitimate business purposes, and longer where cannabis record-keeping or other laws require it. When it is no longer needed, we take reasonable steps to delete or de-identify it.",
    ],
  },
  {
    h: "How we protect your information",
    blocks: [
      {
        list: [
          "Connections to the site are encrypted (HTTPS).",
          "The keys and credentials that connect the site to our ordering and point-of-sale systems are kept on our servers and are not exposed in your browser.",
          "No method of transmission or storage is perfectly secure, but we take reasonable measures to protect your information.",
        ],
      },
    ],
  },
  {
    h: "Your privacy choices & rights",
    blocks: [
      "You can ask what information we hold about you, or ask us to correct or delete it, by emailing or calling us (see “Contact”). You can opt out of marketing emails via the unsubscribe link, and marketing texts by replying STOP.",
      "Depending on where you live, you may have additional rights — such as to access, correct, delete, or restrict the use of your personal information, or to opt out of certain sharing. To exercise any right, contact us using the details below; we may need to verify your identity, and some records may be retained where the law requires.",
    ],
  },
  {
    h: "Children",
    blocks: [
      "Our products and this website are strictly for adults 21 and older. We do not knowingly collect information from anyone under 21. If you believe a minor has provided us information, contact us and we will delete it.",
    ],
  },
  {
    h: "Third-party links & services",
    blocks: [
      "Our website may link to or integrate third-party services (such as maps, our ordering/menu provider, payment processors, and email/SMS tools). We are not responsible for the privacy practices of those third parties; please review their policies.",
    ],
  },
  {
    h: "Changes to this policy",
    blocks: [
      "We may update this Privacy Policy from time to time. When we do, we will change the “Last updated” date above, and material changes will be reflected here before they take effect.",
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
              <h3>Contact</h3>
              <p>
                The High Life
                <br />
                {addr}
                <br />
                Email: <a href={`mailto:${store.email}`}>{store.email}</a>
                <br />
                Phone: <a href={`tel:${PHONE_TEL}`}>{PHONE}</a>
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
