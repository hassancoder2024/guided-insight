# Guided Insights — Daily Qur'anic Reflection

A small static site: a daily verse (Arabic + Saheeh International translation),
a personal reflection journal (saved in your browser), favorited verses, a
light/dark theme, and a search bar to look up any surah, ayah, or English
keyword. Verse data comes live from the
[AlQuran Cloud API](https://alquran.cloud/api), with a small offline fallback
set built in.

## Features
- **Daily verse** — a new verse each day, with a "Show another" shuffle.
- **Light / dark theme** — toggle in the header; remembers your choice and
  defaults to your system preference on first visit.
- **Adjustable Arabic text size** — three sizes (ا / ا / ا) for comfortable
  reading on any screen.
- **Favorites** — star any verse to save it to a running list, shown in a
  "Favorited verses" panel.
- **Copy verse** — one click copies the Arabic, translation, and reference to
  your clipboard for sharing.
- **Reflection journal** — write a few lines on today's verse; past entries
  are listed and deletable.
- **Reflection streak** — a small counter tracks consecutive days you've
  written a reflection.
- **Search** — by surah name (e.g. "Yasin"), reference (e.g. 2:255), or
  English keyword (e.g. "patience").

## Files
- `index.html` — page structure
- `styles.css` — styling
- `data.js` — offline fallback verses, surah name list, reflection prompts
- `script.js` — app logic (fetching, search, reflections, favorites, theme, dates)

No build step, no dependencies — it's plain HTML/CSS/JS.

## Run it locally
Open `index.html` directly in a browser, or serve the folder:
```
python3 -m http.server 8000
```
then visit `http://localhost:8000`.

## Deploy to Vercel

I can't push to your Vercel account on your behalf (I don't have access to
your credentials), but either of these takes about a minute:

### Option A — Vercel CLI (fastest)
```
npm install -g vercel
cd guided-insights
vercel login
vercel --prod
```
Accept the defaults — it's a static site, so no build command or output
directory is needed.

### Option B — Dashboard, no GitHub needed
1. Go to vercel.com and sign in.
2. Click **Add New → Project**.
3. Choose **Deploy without Git** and drag the `guided-insights` folder
   (or a zip of it) into the upload area.
4. Click **Deploy**.

### Option C — Connect a GitHub repo (best for future edits)
1. Push this folder to a new GitHub repo.
2. On vercel.com, click **Add New → Project** and import that repo.
3. Framework preset: **Other**. Leave build/output settings blank.
4. Click **Deploy**. Future pushes redeploy automatically.

## Notes
- Reflections, favorites, theme choice, and text-size preference are all
  saved in the browser's local storage (per device/browser, not synced
  across devices).
- If the live API is unreachable, the page automatically falls back to a
  small offline set of well-known short verses.
