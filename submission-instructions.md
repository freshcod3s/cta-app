# EAS Submit -- placeholder reference

`eas.json` ships with `submit.production` and `submit.preview` profiles
populated by `REPLACE_WITH_*` placeholder strings so any premature
`eas submit` invocation fails loudly. Real credentials NEVER land in
this file -- they go in EAS env vars (or local-only files referenced
by path) at submission time.

## iOS (App Store Connect / TestFlight)

| Placeholder | Real value |
| --- | --- |
| `REPLACE_WITH_APP_STORE_CONNECT_APP_ID` | The numeric App ID from App Store Connect -> My Apps -> (your app) -> App Information -> Apple ID. Looks like `1234567890`. |
| `REPLACE_WITH_APPLE_ID_EMAIL` | The Apple ID email address tied to the Apple Developer Program account. |
| `REPLACE_WITH_APPLE_TEAM_ID` | The 10-character Team ID from developer.apple.com -> Membership -> Team ID. |

App Store Connect API key (recommended over Apple ID password) is
provided to EAS at submit time via:

```
eas submit -p ios --profile production --asc-api-key-id <KEY_ID> \
  --asc-api-key-issuer-id <ISSUER_ID> --asc-api-key-path ./AuthKey_<KEY_ID>.p8
```

The `.p8` file MUST be gitignored (already covered by `*.p8` in
`.gitignore`).

## Android (Google Play Console)

| Placeholder | Real value |
| --- | --- |
| `REPLACE_WITH_SERVICE_ACCOUNT_KEY.json` | Path (relative to repo root) to the Google Play service account JSON. Generate at console.cloud.google.com -> IAM -> Service Accounts -> Keys -> Add Key -> JSON. |

The service-account JSON MUST be gitignored. Add a name-specific entry
to `.gitignore` once the file is created (e.g. `play-service-account.json`).

`track` controls the release lane:

- `internal` -- Internal testing track (preview profile)
- `production` -- Production track (production profile)
- `alpha` / `beta` -- Closed/Open testing if configured in Play Console

## Pre-flight before any `eas submit`

1. Apple Developer Program enrollment complete.
2. Google Play Console developer account complete + app created with
   `com.congresstradealerts.cta` package.
3. App Store Connect app shell created with bundle id
   `com.congresstradealerts.cta`.
4. Real values substituted into `eas.json` (or passed as CLI flags so
   the file stays placeholder-only).
5. Service-account JSON path resolves and the file is gitignored.
6. Build artifact (`.ipa` for iOS, `.aab` for Android) referenced in the
   submit invocation matches the latest production EAS build.
