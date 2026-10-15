# Vocabulary builder (definitions, sentences, photos)

## Put it on Replit
1. Replit -> Create Repl -> Node.js. Upload every file in this folder (keep data/ and public/).
2. Tools -> Secrets: add PIXABAY_API_KEY (pixabay.com/api/docs) or PEXELS_API_KEY (pexels.com/api). No Anthropic key is needed: the definitions and sentences are in data/words.csv.
3. Shell: `node enrich.js` fetches one photo per word (Spanish words are searched in Spanish). Pixabay allows about 100 requests per minute; Pexels about 200/hour (the script waits 18 sec per photo). You can stop and run it again any time; it continues where it stopped.
   Test small first: `LIMIT=30 node enrich.js`. One grade only: `GRADE=1 node enrich.js`.
4. `node server.js` opens the review screen. Fix text, pick other photos, press Approve. "Download sheet" gives the finished words-final.csv.
Do not run enrich.js and server.js at the same time. Keep the "Photos provided by Pexels" link wherever Pexels photos are shown. Pixabay's rules: download the photos (this tool does) and do not link to their web addresses directly from the app.

The student app (index.html) lives in public/ and opens at your Repl address. The review screen is at /review.html.
hola klk

## Student progress and passwords
The app saves each student's progress (words correct, weeks done, streak, badges, gems, last rounds) in the browser AND sends it to this server (data/progress.json), so it follows the student to any device. Teacher view: /teacher.html (table + Download CSV).
Add a secret ADMIN_PASSWORD in Secrets: the review screen, photo tools and teacher view then ask for a password (user name: anything, password: ADMIN_PASSWORD). Do this before sharing the address with anyone.
Important: a file on disk is fine while you test with Run. A published (deployed) Repl may reset its files, so for real students the progress needs Replit's database - that is the next step.

## GitHub + Hostinger (Node.js web app)
1. Do the photo step on your own computer (needs Node.js from nodejs.org): put your Pixabay key in the command, run `node enrich.js`, then `node server.js` and review at http://localhost:3000/review.html. Never upload keys to GitHub.
2. Push this folder to a PRIVATE GitHub repo (GitHub Desktop is easiest for thousands of photos).
3. Hostinger hPanel -> Websites -> Add Website -> Node.js web app -> connect GitHub -> pick the repo. Start file: server.js. Node 20 or 22.
4. Environment variables on Hostinger: ADMIN_PASSWORD (any password you choose) and DATA_DIR (a folder OUTSIDE the app folder, so redeploys do not erase student progress, for example /home/YOURUSER/student-data).
5. Student app = your domain. Teacher view = /teacher.html, review screen = /review.html (both ask for ADMIN_PASSWORD).

## Parent sign-up and approval (new)
- Parents open /signup.html (English and Spanish). They enter their name, an email or WhatsApp number, the child's first name, grade and school. Nothing is created yet: the request waits as "pending" and the parent gets a request code.
- You open /admin.html (asks for ADMIN_PASSWORD). Pending requests show first; ones older than 24 hours turn orange. Choose Approve or Reject (you can fix the grade or school first).
- Approving makes a username (child's name plus 4 digits), a 4-digit PIN and a one-year expiry. The parent can see them on /signup.html with "Check my request", and you get an Email button, a WhatsApp button and a Copy message button on the admin page. If the request said "still waiting", the parent is told to come back later (up to 24 hours).
- Optional automatic email on approval: add RESEND_API_KEY and MAIL_FROM in the environment (a free Resend account works). Without them nothing breaks: you just use the Email or WhatsApp buttons.
- The app login now asks for username + PIN and checks them on the server (expired or unapproved accounts cannot log in). Progress is saved only with the student's private token.
- Before launch set DEMO to false at the top of index.html so the demo usernames stop working.
- Accounts are saved in DATA_DIR/accounts.json. Keep DATA_DIR outside the app folder. Login requires the 4-digit PIN (checked on the server, rate limited). PINs are stored as plain text so parents can look them up; hashing them would need a "reset PIN" flow instead.
