// FAQ content -- ported verbatim from the web FAQ (congress-trade-alerts
// dashboard.html #faq-section), em-dashes normalized to ASCII "--" per the
// repo's ASCII-only rule. Static content; no API.
export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Where does this data come from?",
    a: "All trades are sourced from official congressional disclosures: the U.S. House Clerk's Financial Disclosure portal and the Senate Office of Public Records' Electronic Filing system. Filings are mandated by the STOCK Act of 2012. We pull, normalize, and enrich the same public data anyone can download. We check the House portal about every 30 minutes and the Senate portal about every six hours; the feed in this app shows filings once they are at least 24 hours old.",
  },
  {
    q: "How fast are the alerts?",
    a: "Our pipeline checks the House portal about every 30 minutes and the Senate portal about every six hours. When a check turns up a new filing, an alert for it goes out on that cycle. The trade feed inside the app is separate: it shows filings once they are at least 24 hours old, the same for everyone. So an alert can reach you before that trade is browsable in the feed. None of this is instant -- the STOCK Act itself allows members up to 45 days to file, so the disclosure you see was usually made weeks after the trade.",
  },
  {
    q: "Is this even legal? Aren't politicians banned from trading?",
    a: "The data is 100% public -- that's the whole point of the STOCK Act. Congress is required to disclose personal trades within 45 days, but is not currently banned from trading individual stocks. Bills like the PELOSI Act and the ETHICS Act have proposed a ban, but none have passed. Until they do, the disclosures themselves remain the most powerful accountability tool we have.",
  },
  {
    q: "Does this app cost anything?",
    a: "No. Every feature in this app is free: the trade feed, member and ticker pages, committee overlap flags, late-filing flags, and push alerts. There are no in-app purchases, no subscription, no ads, and no tracking. The app is open source under the AGPL-3.0 license.",
  },
  {
    q: "Do I need an account?",
    a: "No. There is no sign-in, no registration, and no email address to hand over -- every screen works on first launch. If you turn push alerts on, the app stores an anonymous device token plus the members and tickers you follow, and nothing that identifies you personally. Turn notifications off in Settings to delete all of it.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Congress Trade Alerts is an information service, not an investment advisor. Politicians lose money on trades all the time. Past performance does not predict future results. Use this data for transparency and your own research -- make your own decisions.",
  },
];
