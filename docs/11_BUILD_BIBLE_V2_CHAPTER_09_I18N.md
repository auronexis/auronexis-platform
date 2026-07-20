# Auroranexis Build Bible V2 — Chapter 9: Enterprise I18N, L10N & Regionalization

**Status:** Implemented  
**Version:** 2.0 Chapter 9  
**Priority:** After Chapter 8 SEO

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch9-i18n.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Currencies | `src/lib/i18n/currency.ts` (+ DB check migration) |
| Regional settings | `src/lib/i18n/regional.ts`, org columns, organization settings form |
| Locale resolution | `src/lib/i18n/resolve-locale.ts` |
| Money / billing formatters | `src/lib/i18n/format.ts` |
| Dates / timezones | `src/lib/i18n/date.ts` |
| Numbers / percents | `src/lib/i18n/number.ts` |
| Message catalog scaffold | `src/lib/i18n/messages.ts` |
| Client formatters | `src/components/workspace/workspace-money-provider.tsx` |
| User display overrides | Profile regional preferences (timezone/date/time) |

## Organization regional settings

Stored on `organizations`:

- `language`, `currency`, `timezone`, `date_format`, `time_format`, `week_start`, `measurement_system`

User preferences may override timezone / date / time display in the workspace UI.

## Non-negotiables

- Do not change auth, RBAC, RLS, Paddle billing, API contracts, or business rules
- Storage remains UTC / ISO / numeric — formatting is presentation only
- Never hardcode currency symbols (`$`, `€`, …) in UI
- Future currencies: update `APP_CURRENCIES` + DB check only

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:workspace-currency`, `npm run test:build-bible-ch9`.

Do not commit, push, or deploy in Chapter 9 — Release chapters own shipping.
