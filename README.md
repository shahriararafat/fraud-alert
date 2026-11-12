# Fraud Alert

A small website for checking a bKash or Nagad number, a shop name, or a link before sending money. Someone who was scammed can file a report with screenshots. A human admin verifies it. Only approved reports are public. The more approved reports an entity has, the higher its severity.

Signed-in people can file a report and see their own list. An admin reviews the queue. Search results and appeals come later.

## Run it locally

You need Node.js, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
supabase start
```

`supabase status` prints the API URL and keys. Copy `.env.example` to `.env.local` and paste the URL and the publishable (or anon) key.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

Magic-link emails are not delivered to a real inbox. Open Mailpit, printed as `MAILPIT_URL` (usually http://127.0.0.1:54324), and click the link in the message. Studio is usually http://127.0.0.1:54323.

## Environment

See `.env.example`. Nothing in that file is a real secret.

| Variable | Where it goes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server. Local value is `http://127.0.0.1:54321`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server. From `supabase status`. |
| `SUPABASE_SECRET_KEY` | Server only, later. Never prefix it with `NEXT_PUBLIC_`. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google Cloud web client. Read by `supabase start`, not by Next.js. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Same. Do not commit it. |

On a hosted Supabase project, set the URL and publishable key for the deployment, and turn on Google under Authentication → Providers. The redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback` (local: `http://127.0.0.1:54321/auth/v1/callback`). Export the client id and secret before `supabase start`. The local config skips Google's nonce check, which the local stack needs once those credentials exist.

The magic-link email must send people to this app. Local development already uses `supabase/templates/magic-link.html`. On the hosted project, paste that HTML into Authentication → Emails → Magic Link, and set the site URL to the app.

## Make a user an admin

Sign in once so the profile row exists. In the SQL editor (local Studio, or the hosted SQL editor):

```sql
update public.profiles
set role = 'admin'
where id = '<user uuid from Authentication → Users>';
```

That SQL runs as the database owner, which is allowed to change `role`. A signed-in user cannot change their own role.

## How the data fits together

- `profiles` — one row per signed-in user. `role` is `user` or `admin`.
- `scam_entities` — the thing being reported: a phone, shop name, URL, or social link. Phones are stored only as `01XXXXXXXXX`. `lib/phone.ts` is the function that produces that form (`017…`, `+88017…`, and `88017…` match). The database rejects any other phone shape.
- `reports` — what happened, the day it happened, an optional amount lost, and a status: `pending`, `approved`, `rejected`, or `needs_info`. `reviewed_by` and `reviewed_at` record the admin who last reviewed it. One person can file 5 reports per Asia/Dhaka day.
- `report_entities` — which entities a report is about. One report can name a number and a shop.
- `evidence_files` — path of a screenshot in the private `evidence` storage bucket, for a report or an appeal.
- `appeals` — a person asks for a listed entity to be reviewed.
- `entity_approved_counts` — how many **approved** reports each entity has. Severity is not a column. `lib/severity.ts` maps that count: 1–2 low, 3–4 medium, 5–8 high, 9+ critical.

`upsert_entity` finds or creates an entity without letting visitors browse unapproved numbers. `submit_report` writes the report, the entities it names, and the screenshot rows in one step. `my_reports` lists the signed-in person's reports, including admin notes. `report_private` returns the reporter id and admin notes only to the reporter and to admins. `admin_review_queue` lists pending and needs-info reports for an admin, oldest first. `admin_report_detail` returns one report to an admin, including who filed it. `review_report` approves, rejects, asks for more information, or unpublishes. A normal user cannot call those three. Severity is still derived in `lib/severity.ts` from the approved-report count.

## File a report

Sign in, then open **Report a scam**. If you are signed out, that link sends you to sign in and brings you back. Add at least one of: a bKash or Nagad number, a shop or page name, a website, or a social link. Describe what happened and when. The amount lost, in taka, is optional. Attach 1 to 3 screenshots (JPEG, PNG, or WebP, up to 5 MB each). The report stays **pending** until an admin reviews it.

**My reports** shows only that person's reports and any admin note. Another signed-in person cannot read the report or open the screenshot. The form checks the daily limit, and a database trigger rejects a sixth report the same day.

Visitors can read approved reports and the entities those reports name. They cannot read who filed a report, admin notes, appeals, or screenshots. A user can read and create their own reports. An admin can update and delete the rows.

## Review a report

Make yourself an admin (see above), sign in, and open **Review**. The queue is pending and needs-info reports, oldest first, with a count of each. Open a report to read every identifier, what happened, the amount, the date, and the screenshots. Screenshot links expire after a few minutes. The page also shows how many other reports that person has filed, how many approved reports each entity already has, the severity of that count, and the severity if you approve this one.

Approve, reject, or ask for more information. Each action needs a note. The reporter sees that note and the new status on **My reports**. Approving makes the report public, so each entity it names gains one approved report.

**Unpublish** is for a listing that should not be public. It sets that approved report back to rejected, stores the note, and the entity's approved count goes back down. Rejected reports are not public and do not count.

## Checks

```bash
npm test          # phone normalization, severity, and report validation
npm run typecheck
npm run lint
npm run test:rls  # needs `supabase start`
```
