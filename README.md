# Vocabulary builder (definitions, sentences, photos)

## Put it on Replit
1. Replit -> Create Repl -> Node.js. Upload every file in this folder (keep data/ and public/).
2. Tools -> Secrets: add ANTHROPIC_API_KEY and PEXELS_API_KEY (free key: pexels.com/api).
3. Shell: `node enrich.js` writes the definitions and sentences first (minutes), then fetches photos (about 18 sec each; Pexels allows 200/hour). You can stop and run it again any time; it continues where it stopped.
   Test small first: `LIMIT=30 node enrich.js`. One grade only: `GRADE=1 node enrich.js`. Text only, no photos: `PHOTOS=0 node enrich.js`.
4. `node server.js` opens the review screen. Fix text, pick other photos, press Approve. "Download sheet" gives the finished words-final.csv.
Do not run enrich.js and server.js at the same time. Keep the "Photos provided by Pexels" link wherever photos are shown.

## No Anthropic key? Photos only (free)
The definitions and sentences are already in data/words.csv. To add photos only, get a free key from Pixabay (pixabay.com/api/docs) or Pexels, add it as PIXABAY_API_KEY (or PEXELS_API_KEY) in Secrets, then run:
`PHOTOS_ONLY=1 node enrich.js` - it searches each word (Spanish words are searched in Spanish) and saves the photos. Pixabay allows about 100 requests per minute, so thousands of words take under an hour. Then `node server.js` to review. Pixabay's rules: download the photos (this tool does) and do not link to their web addresses directly from the app.

The student app (index.html) lives in public/ and opens at your Repl address. The review screen is at /review.html.
