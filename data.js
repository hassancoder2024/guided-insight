/**
 * Offline fallback data for Guided Insights.
 *
 * This is only used if the AlQuran Cloud API cannot be reached.
 * It deliberately contains a small set of very short, universally
 * recited verses (the kind repeated in the five daily prayers) to
 * keep the offline copy as reliable as possible.
 */

const FALLBACK_VERSES = [
  {
    surahName: "Al-Fatihah",
    surahNumber: 1,
    ayahNumber: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    theme: "beginnings, mercy"
  },
  {
    surahName: "Al-Fatihah",
    surahNumber: 1,
    ayahNumber: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "[All] praise is [due] to Allah, Lord of the worlds.",
    theme: "gratitude"
  },
  {
    surahName: "Ash-Sharh",
    surahNumber: 94,
    ayahNumber: 5,
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship [will be] ease.",
    theme: "hardship, hope"
  },
  {
    surahName: "Ash-Sharh",
    surahNumber: 94,
    ayahNumber: 6,
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship [will be] ease.",
    theme: "hardship, hope"
  },
  {
    surahName: "Al-Asr",
    surahNumber: 103,
    ayahNumber: 1,
    arabic: "وَالْعَصْرِ",
    translation: "By time,",
    theme: "time"
  },
  {
    surahName: "Al-Asr",
    surahNumber: 103,
    ayahNumber: 2,
    arabic: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",
    translation: "Indeed, mankind is in loss,",
    theme: "reflection on the self"
  },
  {
    surahName: "Al-Asr",
    surahNumber: 103,
    ayahNumber: 3,
    arabic: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
    translation: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.",
    theme: "faith, patience, community"
  },
  {
    surahName: "Al-Kawthar",
    surahNumber: 108,
    ayahNumber: 1,
    arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    translation: "Indeed, We have granted you, [O Muhammad], al-Kawthar.",
    theme: "abundance"
  },
  {
    surahName: "Al-Kawthar",
    surahNumber: 108,
    ayahNumber: 2,
    arabic: "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    translation: "So pray to your Lord and sacrifice [to Him alone].",
    theme: "worship, gratitude"
  },
  {
    surahName: "Al-Ikhlas",
    surahNumber: 112,
    ayahNumber: 1,
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    translation: "Say, \"He is Allah, [who is] One,\"",
    theme: "oneness"
  },
  {
    surahName: "Al-Ikhlas",
    surahNumber: 112,
    ayahNumber: 2,
    arabic: "اللَّهُ الصَّمَدُ",
    translation: "Allah, the Eternal Refuge.",
    theme: "reliance"
  },
  {
    surahName: "Al-Ikhlas",
    surahNumber: 112,
    ayahNumber: 3,
    arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    translation: "He neither begets nor is born,",
    theme: "oneness"
  },
  {
    surahName: "Al-Ikhlas",
    surahNumber: 112,
    ayahNumber: 4,
    arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    translation: "Nor is there to Him any equivalent.",
    theme: "oneness"
  },
  {
    surahName: "Al-Falaq",
    surahNumber: 113,
    ayahNumber: 1,
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    translation: "Say, \"I seek refuge in the Lord of daybreak\"",
    theme: "protection"
  },
  {
    surahName: "An-Nas",
    surahNumber: 114,
    ayahNumber: 1,
    arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    translation: "Say, \"I seek refuge in the Lord of mankind,\"",
    theme: "protection"
  }
];

// Standard transliterated surah names, indexed by surah number (1-114).
const SURAH_NAMES = [
  null, "Al-Fatihah","Al-Baqarah","Aali Imran","An-Nisa","Al-Maidah","Al-Anam","Al-Araf",
  "Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Rad","Ibrahim","Al-Hijr","An-Nahl",
  "Al-Isra","Al-Kahf","Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Muminun","An-Nur",
  "Al-Furqan","Ash-Shuara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajda",
  "Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat",
  "Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath",
  "Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqiah",
  "Al-Hadid","Al-Mujadila","Al-Hashr","Al-Mumtahanah","As-Saff","Al-Jumuah","Al-Munafiqun",
  "At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haaqqa","Al-Maarij","Nuh",
  "Al-Jinn","Al-Muzzammil","Al-Muddathir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba",
  "An-Naziat","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj",
  "At-Tariq","Al-Ala","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Lail","Ad-Duha",
  "Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat",
  "Al-Qariah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraish","Al-Maun","Al-Kawthar",
  "Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"
];

const REFLECTION_PROMPTS = [
  "What is one practical step you could take today that reflects this verse?",
  "How does this verse change the way you see a challenge you're facing right now?",
  "Who in your life might need to hear this verse today?",
  "Sit with this verse in silence for a moment. What feeling rises first?",
  "Where do you already see this verse showing up in your life?",
  "If you read only this verse today, what would you want to remember by tonight?",
  "What would it look like to live out this verse for the next hour?",
  "Is there something you're holding onto that this verse invites you to let go of?",
  "How might gratitude show up differently in your day because of this verse?",
  "What question would you ask if you could discuss this verse with someone you trust?",
  "Where have you experienced something close to what this verse describes?",
  "What is one word from this verse that stays with you, and why?"
];
