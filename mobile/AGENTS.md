# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

---

## Analytics — Mixpanel

**SDK:** `mixpanel-react-native` v3.x (direct, no CDP)  
**Platform:** React Native (iOS + Android)  
**Token location:** hardcoded in `utils/analytics.ts` (`MIXPANEL_TOKEN`)  
**Consent:** conservative gate — SDK never initialises until user taps "Accept" in `ConsentBanner`

### Tracking plan

| Event | Where fired | Key properties |
|---|---|---|
| `sign_up_completed` | `AppContext.grantAnalyticsConsent()` | `plan`, `currency` |
| `transaction_added` | `AppContext.addTransaction()` | `type`, `category`, `is_auto_debit` |

Super properties set on every event: `platform` (ios/android)

### Identity files

| Action | File | Call |
|---|---|---|
| Consent granted | `context/AppContext.tsx → grantAnalyticsConsent` | `identifyUser(userProfile)` |
| Sign in | `context/AppContext.tsx → signIn` | `identifyUser(userProfile)` |
| App re-open (returning user) | `context/AppContext.tsx → load useEffect` | `identifyUser(userProfile)` |
| Sign out | `context/AppContext.tsx → signOut` | `resetAnalytics()` |

Anonymous user ID stored in AsyncStorage under key `kachingo_analytics_uid`.

### Adding new events

Import `trackEvent` from `utils/analytics.ts` and call it directly — it is a no-op if the user has not consented. Always use `snake_case` event and property names. Never send numeric values as quoted strings. Omit properties that do not apply (no `null` / `""`).
