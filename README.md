# At Home – vocabulary app (server + photo tool)
Spanish setup guide: see LEEME.md.

## What is inside
- public/index.html: the student app. public/signup.html: parent sign-up page. public/admin.html: approve students, assign usernames, change expiry dates (asks for ADMIN_CODE). public/teacher.html: student progress table. public/review.html: photo review tool.
- server.js + accounts.js + db.js: the server. Storage is Supabase when SUPABASE_URL and SUPABASE_SERVICE_KEY are set (see supabase/schema.sql), otherwise local files for testing.
- enrich.js: photo tool. Reads PIXABAY_API_KEY (or PEXELS_API_KEY) from the environment or from a local .env file.

## Environment variables (see .env.example)
ADMIN_CODE, SUPABASE_URL, SUPABASE_SERVICE_KEY, PIXABAY_API_KEY, and optionally RESEND_API_KEY + MAIL_FROM for automatic approval emails.

## Photos
`PHOTOS_ONLY=1 node enrich.js` downloads one photo per word into public/photos. Then `node server.js` and open /review.html to approve or swap them. Commit public/photos to GitHub.

## Notes
- Students log in with username only; only approved, non-expired accounts can enter. Progress is saved with a private token.
- Demo usernames work only in the preview or on localhost, never on your real domain.
- Parent sign-up: nothing is created until you approve. Approving shows the username with WhatsApp, Email and Copy buttons; set RESEND_API_KEY to also email automatically.
