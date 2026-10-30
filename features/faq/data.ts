// FAQ content -- ported verbatim from the web FAQ (congress-trade-alerts
// dashboard.html #faq-section), em-dashes normalized to ASCII "--" per the
// repo's ASCII-only rule. Static content; no API.
export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Where does this data come from?",
    a: "Current filing records originate in the U.S. House Clerk and Senate public disclosure systems. Some historical records came through Capitol Trades and may lack a direct original-filing link. Member and committee information, company details, and related news use additional providers. Open Methodology from the menu for the full source list, clickable official references, coverage limits, and our calculated indicators. We check for House filings about every 30 minutes and Senate filings about every six hours; the feed shows filings once they are at least 24 hours old.",
  },
  {
    q: "How fast are the alerts?",
    a: "Our pipeline checks for House filings about every 30 minutes and Senate filings about every six hours. Alerts follow collection cycles, subject to source availability and collection limits; we cannot promise an alert for every filing. The main trade feed shows filings once they are at least 24 hours old. Trade details opened from an alert and other views may show them earlier. Alerts report disclosures, not trades as they execute; reporting deadlines are explained in Methodology.",
  },
  {
    q: "What do the disclosure rules require?",
    a: "Reportable transactions generally must be disclosed by the earlier of 30 days after notification or 45 days after the transaction. The app's late flag only checks whether the recorded disclosure date is more than 45 days after the trade date; it is not an official violation finding. Methodology links to the House and Senate ethics guidance for the requirements, exceptions, and current rules.",
  },
  {
    q: "Does this app cost anything?",
    a: "No. Every feature in this app is free: the trade feed, member and ticker pages, committee overlap flags, late-filing flags, and push alerts. There are no in-app purchases, no subscription, no ads, and no tracking. The app is open source under the AGPL-3.0 license.",
  },
  {
    q: "Do I need an account?",
    a: "No. There is no sign-in or email registration. Saved trades stay on your device. If you enable push notifications, the server stores your device push token, platform, and selected notification preferences to deliver alerts. Turn notifications off in Settings to remove that registration.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Congress Trade Alerts is an information service, not an investment advisor. Politicians lose money on trades all the time. Past performance does not predict future results. Use this data for transparency and your own research -- make your own decisions.",
  },
];
