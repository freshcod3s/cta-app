// FAQ content -- ported verbatim from the web FAQ (congress-trade-alerts
// dashboard.html #faq-section), em-dashes normalized to ASCII "--" per the
// repo's ASCII-only rule. Static content; no API.
export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Where does this data come from?",
    a: "All trades are sourced from official congressional disclosures: the U.S. House Clerk's Financial Disclosure portal and the Senate Office of Public Records' Electronic Filing system. Filings are mandated by the STOCK Act of 2012. We pull, normalize, and enrich the same public data anyone can download -- we just do it every 30 minutes and push it to you.",
  },
  {
    q: "How fast are the alerts?",
    a: "Our pipeline scrapes the source feeds every 30 minutes. Once a new filing is detected, your personal alert is dispatched within seconds. Free users see trades on a 24-hour delay; Pro subscribers see them in real time as soon as they hit the disclosure portal.",
  },
  {
    q: "Is this even legal? Aren't politicians banned from trading?",
    a: "The data is 100% public -- that's the whole point of the STOCK Act. Congress is required to disclose personal trades within 45 days, but is not currently banned from trading individual stocks. Bills like the PELOSI Act and the ETHICS Act have proposed a ban, but none have passed. Until they do, the disclosures themselves remain the most powerful accountability tool we have.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "The full dashboard, leaderboards, watchlist, basic search, and a 24-hour-delayed trade feed are free during early access. Tiered options for real-time alerts, higher API throughput, and bulk export are coming -- join the waitlist to hear when they launch.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes -- one click in the Stripe billing portal we link from your welcome email. Cancellation is immediate and you keep access through the end of the period you've already paid for. We don't auto-bill silently and we don't make you email support to cancel.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Congress Trade Alerts is an information service, not an investment advisor. Politicians lose money on trades all the time. Past performance does not predict future results. Use this data for transparency and your own research -- make your own decisions.",
  },
];
