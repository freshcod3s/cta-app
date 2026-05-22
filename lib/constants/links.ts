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
