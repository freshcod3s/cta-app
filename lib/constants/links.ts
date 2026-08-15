// External URL constants. Centralized so a single rename (custom domain
// flip, GitHub handle change, etc.) updates every screen at once.
//
// PRIVACY_URL + TERMS_URL point at the canonical legal documents
// shipped by the CTA Worker (CTA-34, commit adbdec1). Treat them as
// the authoritative surfaces; mobile About has a user-friendly
// privacy summary, but the legal documents are the worker routes.
export const WEB_URL = "https://congresstradealerts.com";
export const PRIVACY_URL = "https://congresstradealerts.com/privacy";
export const TERMS_URL = "https://congresstradealerts.com/terms";
export const GITHUB_URL = "https://github.com/freshcod3s/cta-app";

// Upgrade -> the website's existing Stripe Checkout flow, opened in the
// system browser via expo-web-browser (Product Invariant #1: subscription
// billing is ALWAYS external web Stripe Checkout -- never IAP, never
// in-WebView, never a custom in-app payment UI). ?upgrade=1 auto-opens the
// site's upgrade modal (dashboard.html maybeAutoOpenUpgrade) so the user
// lands on tier selection + Stripe Checkout. Mobile has no email/auth in v1,
// so it cannot POST /api/subscribe directly (that endpoint requires an
// email); the web flow collects email + tier, then redirects to Stripe.
export const UPGRADE_URL = `${WEB_URL}/?upgrade=1`;

// Press / media kit -- the website's full press page, opened in the system
// browser (expo-web-browser). The mobile Press screen surfaces a thin
// summary + contact and links out here for the full kit.
export const PRESS_URL = `${WEB_URL}/press`;
