/**
 * Guided Insights — front-end logic.
 * Live data: AlQuran Cloud API (api.alquran.cloud) — Uthmani Arabic text
 * paired with the Saheeh International English translation.
 * Falls back to a small local dataset (data.js) if the API is unreachable.
 */

const API_BASE = "https://api.alquran.cloud/v1";
const TOTAL_AYAHS = 6236;
const FETCH_TIMEOUT_MS = 8000;

const els = {
  greg: document.getElementById("gregorian-date"),
  hijri: document.getElementById("hijri-date"),
  loading: document.getElementById("verse-loading"),
  content: document.getElementById("verse-content"),
  arabic: document.getElementById("verse-arabic"),
  translation: document.getElementById("verse-translation"),
  reference: document.getElementById("verse-reference"),
  sourceNote: document.getElementById("source-note"),
  refreshBtn: document.getElementById("refresh-verse"),
  card: document.getElementById("verse-card"),
  prompt: document.getElementById("reflection-prompt"),
  newPromptBtn: document.getElementById("new-prompt"),
  reflectionText: document.getElementById("reflection-text"),
  saveBtn: document.getElementById("save-reflection"),
  saveStatus: document.getElementById("save-status"),
  journalList: document.getElementById("journal-list"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  searchResults: document.getElementById("search-results"),
  themeLight: document.getElementById("theme-light"),
  themeDark: document.getElementById("theme-dark"),
  favoriteBtn: document.getElementById("favorite-btn"),
  copyBtn: document.getElementById("copy-btn"),
  textSizeGroup: document.querySelector(".text-size-group"),
  savedVersesList: document.getElementById("saved-verses-list"),
  streakBadge: document.getElementById("streak-badge"),
  installBtn: document.getElementById("install-btn"),
  iosHint: document.getElementById("ios-install-hint"),
  iosHintDismiss: document.getElementById("ios-install-dismiss"),
};

let currentVerse = null; // { surahName, surahNumber, ayahNumber, arabic, translation, isOffline }

/* ---------------- Tabs ---------------- */

let activateTab = null; // set by initTabs; lets other code (e.g. search) switch tabs

function initTabs() {
  const tabs = Array.from(document.querySelectorAll(".tab-button"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  function activate(tab) {
    tabs.forEach(t => {
      const selected = t === tab;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(p => {
      p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
  }

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      }
    });
  });

  activateTab = (panelId) => {
    const tab = tabs.find(t => t.getAttribute("aria-controls") === panelId);
    if (tab) activate(tab);
  };
}

/* ---------------- Theme ---------------- */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  els.themeLight.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  els.themeDark.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  localStorage.setItem("gi_theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("gi_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
  els.themeLight.addEventListener("click", () => applyTheme("light"));
  els.themeDark.addEventListener("click", () => applyTheme("dark"));
}

/* ---------------- Dates ---------------- */

function renderDates() {
  const now = new Date();
  els.greg.textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  try {
    const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric"
    }).format(now);
    els.hijri.textContent = hijri + " AH";
  } catch (e) {
    els.hijri.hidden = true;
  }
}

/* ---------------- Fetch helper ---------------- */

async function fetchJSON(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/* ---------------- Verse loading ---------------- */

function dayOfYearSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

async function loadAyahByGlobalNumber(globalNumber) {
  const data = await fetchJSON(`${API_BASE}/ayah/${globalNumber}/editions/quran-uthmani,en.sahih`);
  const [arabicEd, englishEd] = data.data;
  return {
    surahName: arabicEd.surah.englishName,
    surahArabicName: arabicEd.surah.name,
    surahNumber: arabicEd.surah.number,
    ayahNumber: arabicEd.numberInSurah,
    arabic: arabicEd.text,
    translation: englishEd.text,
    isOffline: false
  };
}

async function loadAyahByReference(surahNumber, ayahNumber) {
  const data = await fetchJSON(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,en.sahih`);
  const [arabicEd, englishEd] = data.data;
  return {
    surahName: arabicEd.surah.englishName,
    surahArabicName: arabicEd.surah.name,
    surahNumber: arabicEd.surah.number,
    ayahNumber: arabicEd.numberInSurah,
    arabic: arabicEd.text,
    translation: englishEd.text,
    isOffline: false
  };
}

function offlineVerse(index) {
  const v = FALLBACK_VERSES[((index % FALLBACK_VERSES.length) + FALLBACK_VERSES.length) % FALLBACK_VERSES.length];
  return {
    surahName: v.surahName,
    surahArabicName: "",
    surahNumber: v.surahNumber,
    ayahNumber: v.ayahNumber,
    arabic: v.arabic,
    translation: v.translation,
    isOffline: true
  };
}

function setLoadingState() {
  els.loading.hidden = false;
  els.loading.textContent = "Opening today's page…";
  els.content.hidden = true;
}

function renderVerse(verse) {
  currentVerse = verse;
  els.arabic.textContent = verse.arabic;
  els.translation.textContent = `"${verse.translation}"`;
  const ref = `${verse.surahName} · Ayah ${verse.ayahNumber}${verse.surahArabicName ? " · " + verse.surahArabicName : ""}`;
  els.reference.textContent = ref;

  els.loading.hidden = true;
  els.content.hidden = false;

  els.sourceNote.textContent = verse.isOffline
    ? "Shown from the offline collection — couldn't reach the live Qur'an API just now."
    : "Live from the Qur'an Uthmani text & Saheeh International translation.";

  animateCardIn();
  setNewPrompt();
  loadSavedReflectionForCurrentVerse();
  updateFavoriteButtonState();
}

function animateCardIn() {
  els.card.classList.remove("card-in");
  // force reflow so the animation can re-trigger
  void els.card.offsetWidth;
  els.card.classList.add("card-in");
}

async function loadDailyVerse() {
  setLoadingState();
  const seed = (dayOfYearSeed() % TOTAL_AYAHS) + 1;
  try {
    const verse = await loadAyahByGlobalNumber(seed);
    renderVerse(verse);
  } catch (err) {
    renderVerse(offlineVerse(dayOfYearSeed()));
  }
}

async function loadRandomVerse() {
  setLoadingState();
  const randomNumber = Math.floor(Math.random() * TOTAL_AYAHS) + 1;
  try {
    const verse = await loadAyahByGlobalNumber(randomNumber);
    renderVerse(verse);
  } catch (err) {
    renderVerse(offlineVerse(Math.floor(Math.random() * FALLBACK_VERSES.length)));
  }
}

async function loadSpecificVerse(surahNumber, ayahNumber) {
  setLoadingState();
  if (activateTab) activateTab("panel-verse");
  els.card.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const verse = await loadAyahByReference(surahNumber, ayahNumber);
    renderVerse(verse);
  } catch (err) {
    const fallbackMatch = FALLBACK_VERSES.find(
      v => v.surahNumber === surahNumber && v.ayahNumber === ayahNumber
    );
    if (fallbackMatch) {
      renderVerse({ ...fallbackMatch, surahArabicName: "", isOffline: true });
    } else {
      els.loading.hidden = false;
      els.content.hidden = true;
      els.loading.textContent = "Couldn't load that verse. Check your connection and try again.";
    }
  }
}

/* ---------------- Reflection ---------------- */

function setNewPrompt() {
  const p = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
  els.prompt.textContent = p;
}

function reflectionKey() {
  if (!currentVerse) return null;
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${dateStr}__${currentVerse.surahNumber}:${currentVerse.ayahNumber}`;
}

function getAllReflections() {
  try {
    return JSON.parse(localStorage.getItem("gi_reflections") || "[]");
  } catch (e) {
    return [];
  }
}

function saveAllReflections(list) {
  localStorage.setItem("gi_reflections", JSON.stringify(list));
}

function loadSavedReflectionForCurrentVerse() {
  const key = reflectionKey();
  const all = getAllReflections();
  const existing = all.find(r => r.key === key);
  els.reflectionText.value = existing ? existing.text : "";
}

function saveReflection() {
  const text = els.reflectionText.value.trim();
  const key = reflectionKey();
  if (!key) return;
  let all = getAllReflections();
  all = all.filter(r => r.key !== key);
  if (text) {
    all.unshift({
      key,
      text,
      ref: `${currentVerse.surahName} ${currentVerse.surahNumber}:${currentVerse.ayahNumber}`,
      arabic: currentVerse.arabic,
      savedAt: new Date().toISOString()
    });
  }
  saveAllReflections(all);
  renderJournal();
  renderStreak();
  flashSaveStatus(text ? "Saved ✓" : "Cleared");
}

function flashSaveStatus(msg) {
  els.saveStatus.textContent = msg;
  setTimeout(() => { els.saveStatus.textContent = ""; }, 2200);
}

function renderJournal() {
  const all = getAllReflections();
  if (all.length === 0) {
    els.journalList.innerHTML = `<p class="journal-empty">Your saved reflections will appear here.</p>`;
    return;
  }
  els.journalList.innerHTML = "";
  all.slice(0, 20).forEach(entry => {
    const item = document.createElement("div");
    item.className = "journal-item";
    const date = entry.key.split("__")[0];
    item.innerHTML = `
      <div class="journal-item-head">
        <span class="journal-item-ref">${escapeHTML(entry.ref)}</span>
        <span class="journal-item-date">${escapeHTML(date)}</span>
      </div>
      <p class="journal-item-text"></p>
      <button class="journal-delete" type="button" aria-label="Delete this reflection">Remove</button>
    `;
    item.querySelector(".journal-item-text").textContent = entry.text;
    item.querySelector(".journal-delete").addEventListener("click", () => {
      const updated = getAllReflections().filter(r => r.key !== entry.key);
      saveAllReflections(updated);
      renderJournal();
      if (entry.key === reflectionKey()) els.reflectionText.value = "";
    });
    els.journalList.appendChild(item);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- Search ---------------- */

function parseSearchInput(raw) {
  const trimmed = raw.trim();
  const refMatch = trimmed.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (refMatch) {
    return { type: "reference", surah: parseInt(refMatch[1], 10), ayah: parseInt(refMatch[2], 10) };
  }
  const numMatch = trimmed.match(/^(\d{1,3})$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1 && n <= 114) return { type: "surah", surah: n };
  }
  const normalize = (s) => s.toLowerCase().replace(/[\s-]/g, "");
  const inputNorm = normalize(trimmed);
  const surahIndex = SURAH_NAMES.findIndex(name => name && normalize(name) === inputNorm);
  if (surahIndex > -1) {
    return { type: "surah", surah: surahIndex };
  }
  return { type: "keyword", keyword: trimmed };
}

async function runSearch(raw) {
  if (!raw.trim()) return;
  els.searchResults.innerHTML = `<p class="search-status">Searching…</p>`;
  const parsed = parseSearchInput(raw);

  if (parsed.type === "reference") {
    els.searchResults.innerHTML = `<p class="search-status">Opening ${parsed.surah}:${parsed.ayah} above…</p>`;
    await loadSpecificVerse(parsed.surah, parsed.ayah);
    return;
  }

  if (parsed.type === "surah") {
    const name = SURAH_NAMES[parsed.surah] || `Surah ${parsed.surah}`;
    els.searchResults.innerHTML = `<p class="search-status">Opening ${escapeHTML(name)}, Ayah 1 above…</p>`;
    await loadSpecificVerse(parsed.surah, 1);
    return;
  }

  // keyword search
  try {
    const data = await fetchJSON(`${API_BASE}/search/${encodeURIComponent(parsed.keyword)}/all/en`);
    const matches = (data.data && data.data.matches) || [];
    if (matches.length === 0) {
      els.searchResults.innerHTML = `<p class="search-status">No results for "${escapeHTML(parsed.keyword)}". Try a Surah:Ayah like 2:255, a surah name, or a different word.</p>`;
      return;
    }
    renderSearchResults(matches.slice(0, 6));
  } catch (err) {
    offlineKeywordSearch(parsed.keyword);
  }
}

function offlineKeywordSearch(keyword) {
  const lower = keyword.toLowerCase();
  const matches = FALLBACK_VERSES.filter(
    v => v.translation.toLowerCase().includes(lower) || v.theme.toLowerCase().includes(lower)
  );
  if (matches.length === 0) {
    els.searchResults.innerHTML = `<p class="search-status">Search needs a connection to look up "${escapeHTML(keyword)}" right now. Try a Surah:Ayah like 1:1 instead, which works offline.</p>`;
    return;
  }
  els.searchResults.innerHTML = "";
  matches.forEach(v => {
    const card = buildResultCard(`${v.surahName}`, v.ayahNumber, v.translation, v.surahNumber);
    els.searchResults.appendChild(card);
  });
}

function renderSearchResults(matches) {
  els.searchResults.innerHTML = "";
  matches.forEach(m => {
    const card = buildResultCard(m.surah.englishName, m.numberInSurah, m.text, m.surah.number);
    els.searchResults.appendChild(card);
  });
}

function buildResultCard(surahName, ayahNumber, snippet, surahNumber) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "result-card";
  card.innerHTML = `
    <span class="result-ref">${escapeHTML(surahName)} · Ayah ${ayahNumber}</span>
    <span class="result-snippet"></span>
  `;
  card.querySelector(".result-snippet").textContent = snippet;
  card.addEventListener("click", () => loadSpecificVerse(surahNumber, ayahNumber));
  return card;
}

/* ---------------- Arabic text size ---------------- */

const ARABIC_SIZES = {
  small: "clamp(1.3rem, 4vw, 1.9rem)",
  medium: "clamp(1.6rem, 5vw, 2.5rem)",
  large: "clamp(1.9rem, 6vw, 3.1rem)",
};

function applyArabicSize(size) {
  document.documentElement.style.setProperty("--arabic-size", ARABIC_SIZES[size] || ARABIC_SIZES.medium);
  els.textSizeGroup.querySelectorAll("button").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.size === size ? "true" : "false");
  });
  localStorage.setItem("gi_arabic_size", size);
}

function initArabicSize() {
  const saved = localStorage.getItem("gi_arabic_size") || "medium";
  applyArabicSize(saved);
  els.textSizeGroup.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => applyArabicSize(btn.dataset.size));
  });
}

/* ---------------- Favorites ---------------- */

function favoriteKey(verse) {
  return `${verse.surahNumber}:${verse.ayahNumber}`;
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("gi_favorites") || "[]");
  } catch (e) {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem("gi_favorites", JSON.stringify(list));
}

function isFavorited(verse) {
  if (!verse) return false;
  return getFavorites().some(f => f.key === favoriteKey(verse));
}

function updateFavoriteButtonState() {
  const active = isFavorited(currentVerse);
  els.favoriteBtn.setAttribute("aria-pressed", active ? "true" : "false");
  els.favoriteBtn.querySelector("span").textContent = active ? "Favorited" : "Favorite";
}

function toggleFavorite() {
  if (!currentVerse) return;
  const key = favoriteKey(currentVerse);
  let favs = getFavorites();
  if (favs.some(f => f.key === key)) {
    favs = favs.filter(f => f.key !== key);
  } else {
    favs.unshift({
      key,
      surahName: currentVerse.surahName,
      surahNumber: currentVerse.surahNumber,
      ayahNumber: currentVerse.ayahNumber,
      arabic: currentVerse.arabic,
      translation: currentVerse.translation,
    });
  }
  saveFavorites(favs);
  updateFavoriteButtonState();
  renderFavorites();
}

function renderFavorites() {
  const favs = getFavorites();
  if (favs.length === 0) {
    els.savedVersesList.innerHTML = `<p class="journal-empty">Verses you favorite will appear here.</p>`;
    return;
  }
  els.savedVersesList.innerHTML = "";
  favs.forEach(f => {
    const card = buildResultCard(f.surahName, f.ayahNumber, f.translation, f.surahNumber);
    els.savedVersesList.appendChild(card);
  });
}

/* ---------------- Copy / share ---------------- */

async function copyCurrentVerse() {
  if (!currentVerse) return;
  const text = `${currentVerse.arabic}\n"${currentVerse.translation}"\n— ${currentVerse.surahName}, Ayah ${currentVerse.ayahNumber}`;
  try {
    await navigator.clipboard.writeText(text);
    flashCopyStatus("Copied ✓");
  } catch (e) {
    flashCopyStatus("Couldn't copy");
  }
}

function flashCopyStatus(msg) {
  const span = els.copyBtn.querySelector("span");
  const original = span.textContent;
  span.textContent = msg;
  setTimeout(() => { span.textContent = original; }, 1800);
}

/* ---------------- Reflection streak ---------------- */

function renderStreak() {
  const all = getAllReflections();
  if (all.length === 0) {
    els.streakBadge.hidden = true;
    return;
  }
  const days = new Set(all.map(r => r.key.split("__")[0]));
  let streak = 0;
  const cursor = new Date();
  // Today doesn't break the streak if it's simply not written yet —
  // start counting from today, and if today's missing, try from yesterday.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (streak === 0) {
    els.streakBadge.hidden = true;
    return;
  }
  els.streakBadge.hidden = false;
  els.streakBadge.innerHTML = `<strong>${streak}</strong> day${streak === 1 ? "" : "s"} of reflection in a row`;
}



/* ---------------- Install as app (PWA) ---------------- */

let deferredInstallPrompt = null;

function initInstall() {
  // Chrome/Edge/Android: capture the native install prompt and show our button.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    els.installBtn.hidden = false;
  });

  els.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    els.installBtn.hidden = true;
    els.iosHint.hidden = true;
  });

  // Already running as an installed app — nothing to prompt.
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  if (isStandalone) return;

  // iOS Safari has no beforeinstallprompt — show manual instructions instead,
  // unless the person has dismissed it before.
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|crios|fxios|android).)*safari/i.test(navigator.userAgent);
  if (isIOS && isSafari && !localStorage.getItem("gi_ios_hint_dismissed")) {
    els.iosHint.hidden = false;
  }
  els.iosHintDismiss.addEventListener("click", () => {
    els.iosHint.hidden = true;
    localStorage.setItem("gi_ios_hint_dismissed", "1");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Offline shell just won't be cached; the live app still works fine.
    });
  }
}

/* ---------------- Wire up ---------------- */

els.refreshBtn.addEventListener("click", loadRandomVerse);
els.newPromptBtn.addEventListener("click", setNewPrompt);
els.saveBtn.addEventListener("click", saveReflection);
els.favoriteBtn.addEventListener("click", toggleFavorite);
els.copyBtn.addEventListener("click", copyCurrentVerse);
els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch(els.searchInput.value);
});

initTabs();
initTheme();
initArabicSize();
initInstall();
registerServiceWorker();
renderDates();
renderJournal();
renderFavorites();
renderStreak();
loadDailyVerse();
