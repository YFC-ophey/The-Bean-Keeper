# The Bean Keeper user flow

## First sign-in

1. Open The Bean Keeper and choose **Connect with Notion**.
2. Sign in through Supabase's Notion provider and grant access to the intended Notion page.
3. The backend links the verified Supabase user to their Notion connection and finds or creates their coffee database.
4. A guest may browse the configured owner collection without signing in; writing an entry requires a linked account.

## Add a coffee

1. Open **Add Coffee** and select a front bag photo. A back photo is optional. Selecting photos does not start an AI scan.
2. If photo scanning is configured, click **Scan with Gemini**. The selected photos are sent to the authenticated backend and then to Google's `gemini-3.5-flash-lite` model. The scan can take time or fail; users can continue with manual entry.
3. Review Gemini's suggested coffee details, apply useful values, and correct any errors. Existing manual edits are preserved.
4. Review or edit the coffee details, then save the entry.
5. The backend saves the entry in Notion first and mirrors it to Supabase. The Notion page is the canonical entry. Mirror errors are logged for repair.

```text
Select front photo (+ optional back)
               │
               ▼
      Click Scan with Gemini ───────────────┐
               │                            │
               ▼                            │
  Gemini suggests coffee fields             │
               │                            │
               ▼                            │
   Review and apply suggestions             │
               │                            │
               └──────────────┬─────────────┘
                              ▼
                   Edit form manually
                              │
                              ▼
                        Save entry
                              │
                              ▼
                      Notion page first
                              │
                              ▼
                     Supabase mirror
```

Manual entry follows the right-hand path without sending photos to Gemini. The **Scan with Gemini** control is unavailable if the server has no `GEMINI_API_KEY`. The key stays on the server and is never placed in browser variables.

## Privacy and limits

- Clicking **Scan with Gemini** sends the selected front and optional back photo to Google for analysis. Google says free-tier Gemini API data may be used to improve its products. The form explains this before scanning.
- The scan requires a signed-in user. It accepts JPEG, PNG, WebP, HEIC, and HEIF; each photo is limited to 10 MB and the pair to 12 MB for the inline image request.
- Coffee entries are saved to the user's linked Notion database, then mirrored in Supabase for recovery and analytics. Persistent production photo uploads require configured photo storage.
- Suggested details can be wrong. Review them against the bag before saving, especially origin, process, roast date, and tasting notes.

For configuration and API details, see [GEMINI_NOTION_SETUP.md](GEMINI_NOTION_SETUP.md), [SUPABASE_SETUP.md](SUPABASE_SETUP.md), and [DEPLOYMENT.md](DEPLOYMENT.md).
