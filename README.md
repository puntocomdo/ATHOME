# At Home – vocabulary app (server + photo tool)
Spanish setup guide: see LEEME.md.

## What is inside
- public/index.html: the student app. public/signup.html: parent sign-up page. public/admin.html: approve students, assign usernames, change expiry dates (asks for ADMIN_CODE). public/words.html: add, edit, import and export the words (stored in the Supabase `words` table; the student app reads them through /api/my-words). public/teacher.html: student progress table. public/review.html: photo review tool.
- server.js + accounts.js + db.js: the server. Storage is Supabase when SUPABASE_URL and SUPABASE_SERVICE_KEY are set (see supabase/schema.sql), otherwise local files for testing.
- enrich.js: photo tool. Reads PIXABAY_API_KEY (or PEXELS_API_KEY) from the environment or from a local .env file.

## Hosting
Vercel: static files in public/ + one serverless function (api/handler.js, routes in routes.js). Database: Supabase (tables already created; see supabase/schema.sql). The photo tool and review screen (tools/review.html) run only on your own computer with `node server.js`.

## Environment variables (see .env.example)
ADMIN_CODE, SUPABASE_URL, SUPABASE_SERVICE_KEY, PIXABAY_API_KEY, and optionally RESEND_API_KEY + MAIL_FROM for automatic approval emails.

## Photos
`PHOTOS_ONLY=1 node enrich.js` downloads one photo per word into public/photos. Then `node server.js` and open /review.html to approve or swap them. Commit public/photos to GitHub.

## Notes
- Students log in with username only; only approved, non-expired accounts can enter. Progress is saved with a private token.
- Demo usernames work only in the preview or on localhost, never on your real domain.
- Parent sign-up: nothing is created until you approve. Approving shows the username with WhatsApp, Email and Copy buttons; set RESEND_API_KEY to also email automatically.
