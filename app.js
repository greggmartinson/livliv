const DEFAULTS = {
  city: "Roseville, Minnesota",
  latitude: 45.00608,
  longitude: -93.15661,
  duration: 24,
  category: "mix",
};

const FALLBACK_QUESTIONS = [
  { category: "Books", question: "Which novel begins with the line ‘Call me Ishmael’?", answer: "Moby-Dick, by Herman Melville" },
  { category: "Science", question: "What is the only planet in our solar system that rotates on its side?", answer: "Uranus" },
  { category: "History", question: "Which ancient civilization built the city of Machu Picchu?", answer: "The Inca civilization" },
  { category: "Geography", question: "What is the largest desert on Earth?", answer: "Antarctica — a polar desert" },
  { category: "Animals", question: "Which mammal has the longest migration route?", answer: "The gray whale" },
  { category: "General Knowledge", question: "What color is found on roughly three-quarters of the world’s national flags?", answer: "Red" },
];

const DISTRICT_PHOTOS = [
  { title: "Pack the Pantry: A Community Success", alt: "Photos of food and supply donations to the Roseville Area Schools Community Pantry", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1793114629/isd623org/r6av13kegwjzslcyyuxj/102726DCPackthePantry.png" },
  { title: "Science in Action", alt: "Students working together with circuits at Brimhall Elementary School", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1793123593/isd623org/ecxe55vio8ytfganbjzj/DistrictHomepageSliderTemplate1920x1000px3.png" },
  { title: "Homecoming Energy", alt: "Highlights from the Roseville Area High School Homecoming Pep Fest", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1792779654/isd623org/odooqd9uoebuwschamkw/102326RAHSPepFest.png" },
  { title: "Honoring the People We Admire", alt: "Roseville Area High School students sharing stories through the Admiration Project", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1792784378/isd623org/eagillk6jvnx5jjafqst/102326RAHSAdmirationProject.png" },
  { title: "Raiders Advance to State", alt: "Roseville Area High School tennis doubles partners celebrating their section win", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1792440249/isd623org/kuzckkik2l5xdsi518wf/101926RAHSTennisChamps.png" },
  { title: "Science Friday Excitement", alt: "Early childhood students and their teacher making colorful lava lamps", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1791334728/isd623org/anhuwh3xitgnppr6gioy/100626ECLavaLamps.png" },
  { title: "A 26-Year Tradition", alt: "Roseville Area High School cross country students volunteering together", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1791299814/isd623org/hz76zazcyehwn55rpqt4/100726RAHSCrossCountry.jpg" },
  { title: "Community Care in Action", alt: "Roseville community members supporting the district community pantry", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1790909696/isd623org/zerdt5wllquymwtbrk8o/100126RAHSPoliceDonation.png" },
  { title: "Mystery Engineer at SPARK", alt: "Central Park Elementary students working on engineering projects", url: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_5/v1790644694/isd623org/flzjktwoctvyidytwgps/092826CPMysteryEngineer.png" },
];

const state = {
  settings: loadSettings(),
  activeSlide: 0,
  slideTimer: null,
  revealTimer: null,
  currentQuestion: null,
};

const slides = [...document.querySelectorAll(".slide")];
const progressBar = document.querySelector("#progress-bar");
const answerShell = document.querySelector("#answer-shell");
const tickerCopy = document.querySelector("#ticker-copy");
let lastNewsUpdate = 0;
let lastMinnesotaUpdate = 0;

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("mediaCenterSettings") || "{}");
    const usedOldDefault = stored.city === "Chicago, Illinois" && Number(stored.latitude) === 41.8781;
    return usedOldDefault
      ? { ...DEFAULTS, duration: stored.duration || DEFAULTS.duration, category: stored.category || DEFAULTS.category }
      : { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

function decodeHTML(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function updateClock() {
  const now = new Date();
  document.querySelector("#clock").textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function resetProgress() {
  progressBar.classList.remove("is-running");
  void progressBar.offsetWidth;
  progressBar.classList.add("is-running");
}

function scheduleSlide() {
  clearTimeout(state.slideTimer);
  clearTimeout(state.revealTimer);
  document.documentElement.style.setProperty("--duration", `${state.settings.duration}s`);
  resetProgress();

  const slideType = slides[state.activeSlide].dataset.slide;
  if (slideType === "trivia") {
    answerShell.classList.remove("is-visible");
    tickerCopy.textContent = "Think it through — the answer appears in a moment.";
    const revealAt = Math.max(6, Math.round(state.settings.duration * 0.58)) * 1000;
    state.revealTimer = setTimeout(() => {
      answerShell.classList.add("is-visible");
      tickerCopy.textContent = "How did you do? A fresh question arrives next time around.";
    }, revealAt);
  } else if (slideType === "weather") {
    tickerCopy.textContent = `Live conditions for ${state.settings.city} · Updates every 15 minutes`;
  } else if (slideType === "news") {
    tickerCopy.textContent = "A leading current-affairs headline · Refreshes every 30 minutes";
  } else if (slideType === "minnesota") {
    tickerCopy.textContent = "A leading Minnesota headline from MinnPost · Refreshes every 30 minutes";
  } else if (slideType === "district") {
    tickerCopy.textContent = "Daily district photo from isd623.org · A new highlight appears each day";
  } else if (slideType === "rooms") {
    tickerCopy.textContent = "Today’s media center room schedule · Refreshed from Google Slides at 8:00 AM";
  } else {
    tickerCopy.textContent = "Today’s media center events · Refreshed from Google Slides at 8:00 AM";
  }

  state.slideTimer = setTimeout(nextSlide, state.settings.duration * 1000);
}

async function nextSlide() {
  slides[state.activeSlide].classList.remove("is-active");
  state.activeSlide = (state.activeSlide + 1) % slides.length;
  slides[state.activeSlide].classList.add("is-active");
  document.querySelector("#slide-number").textContent = String(state.activeSlide + 1).padStart(2, "0");
  if (slides[state.activeSlide].dataset.slide === "trivia") await loadTrivia();
  if (slides[state.activeSlide].dataset.slide === "news" && Date.now() - lastNewsUpdate > 30 * 60 * 1000) await loadNews();
  if (slides[state.activeSlide].dataset.slide === "minnesota" && Date.now() - lastMinnesotaUpdate > 30 * 60 * 1000) await loadMinnesotaNews();
  scheduleSlide();
}

async function loadTrivia() {
  const categoryPool = [9, 10, 17, 22, 23, 27];
  const category = state.settings.category === "mix"
    ? categoryPool[Math.floor(Math.random() * categoryPool.length)]
    : state.settings.category;

  try {
    const response = await fetch(`https://opentdb.com/api.php?amount=1&type=multiple&category=${category}`);
    if (!response.ok) throw new Error("Trivia service unavailable");
    const payload = await response.json();
    if (!payload.results?.length) throw new Error("No trivia returned");
    const item = payload.results[0];
    state.currentQuestion = {
      category: decodeHTML(item.category),
      question: decodeHTML(item.question),
      answer: decodeHTML(item.correct_answer),
    };
  } catch {
    state.currentQuestion = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  }

  document.querySelector("#trivia-category").textContent = state.currentQuestion.category.toUpperCase();
  document.querySelector("#trivia-title").textContent = state.currentQuestion.question;
  document.querySelector("#trivia-answer").textContent = state.currentQuestion.answer;
}

const WEATHER_CODES = {
  0: ["Clear skies", "☼"], 1: ["Mostly clear", "☼"], 2: ["Partly cloudy", "◒"], 3: ["Overcast", "☁"],
  45: ["Foggy", "≋"], 48: ["Icy fog", "≋"], 51: ["Light drizzle", "⋰"], 53: ["Drizzle", "⋰"],
  55: ["Heavy drizzle", "⋰"], 61: ["Light rain", "☂"], 63: ["Rain", "☂"], 65: ["Heavy rain", "☂"],
  71: ["Light snow", "✦"], 73: ["Snow", "✦"], 75: ["Heavy snow", "✦"], 80: ["Rain showers", "☂"],
  81: ["Rain showers", "☂"], 82: ["Heavy showers", "☂"], 95: ["Thunderstorms", "ϟ"], 96: ["Storms with hail", "ϟ"], 99: ["Storms with hail", "ϟ"],
};

function conditionFor(code) { return WEATHER_CODES[code] || ["Changing conditions", "◌"]; }

async function geocodeCity(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location search failed");
  const data = await response.json();
  if (!data.results?.length) throw new Error("Location not found");
  const place = data.results[0];
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    city: [place.name, place.admin1].filter(Boolean).join(", "),
  };
}

async function loadWeather() {
  const { latitude, longitude } = state.settings;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "5");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Forecast service unavailable");
    const weather = await response.json();
    const [condition, icon] = conditionFor(weather.current.weather_code);
    document.querySelector("#location-name").textContent = state.settings.city;
    document.querySelector("#temperature").textContent = `${Math.round(weather.current.temperature_2m)}°`;
    document.querySelector("#feels-like").textContent = `${Math.round(weather.current.apparent_temperature)}°`;
    document.querySelector("#wind").textContent = `${Math.round(weather.current.wind_speed_10m)} mph`;
    document.querySelector("#precip").textContent = `${weather.daily.precipitation_probability_max[0] ?? 0}%`;
    document.querySelector("#weather-icon").textContent = icon;
    document.querySelector("#weather-title").textContent = condition;
    document.querySelector("#weather-updated").textContent = "LIVE FORECAST";
    document.querySelector("#weather-note").textContent = "Local time";

    const formatter = new Intl.DateTimeFormat([], { weekday: "long" });
    document.querySelector("#forecast-list").innerHTML = weather.daily.time.slice(1, 5).map((date, index) => {
      const dayIndex = index + 1;
      const [dayCondition] = conditionFor(weather.daily.weather_code[dayIndex]);
      const dayName = formatter.format(new Date(`${date}T12:00:00`));
      return `<div class="forecast-row">
        <span class="forecast-day">${dayName}</span>
        <span class="forecast-condition">${dayCondition}</span>
        <span class="forecast-temps">${Math.round(weather.daily.temperature_2m_max[dayIndex])}°<em>${Math.round(weather.daily.temperature_2m_min[dayIndex])}°</em></span>
      </div>`;
    }).join("");
  } catch {
    document.querySelector("#weather-title").textContent = "Forecast temporarily unavailable";
    document.querySelector("#weather-updated").textContent = "RETRYING SOON";
    document.querySelector("#weather-note").textContent = "Check connection";
  }
}

async function loadNews() {
  const endpoint = new URL("https://en.wikipedia.org/w/api.php");
  endpoint.searchParams.set("action", "parse");
  endpoint.searchParams.set("page", "Template:In the news");
  endpoint.searchParams.set("prop", "text");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("origin", "*");

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("News service unavailable");
    const payload = await response.json();
    const documentFragment = new DOMParser().parseFromString(payload.parse.text["*"], "text/html");
    const items = [...documentFragment.querySelectorAll(".mw-parser-output > ul > li")];
    if (!items.length) throw new Error("No headlines returned");

    const sensitiveTerms = /\b(killed|shooting|bombing|massacre|graphic|hostage|dead|death toll)\b/i;
    const item = items.find((candidate) => !sensitiveTerms.test(candidate.textContent)) || items[0];
    const storyLink = item.querySelector("b a") || item.querySelector("a");
    const headline = item.textContent.replace(/\s+/g, " ").trim();
    const storyUrl = storyLink?.getAttribute("href")?.startsWith("/wiki/")
      ? new URL(storyLink.getAttribute("href"), "https://en.wikipedia.org").href
      : "https://en.wikipedia.org/wiki/Portal:Current_events";

    document.querySelector("#news-headline").textContent = headline;
    document.querySelector("#news-link").href = storyUrl;
    document.querySelector("#news-updated").textContent = `UPDATED ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    lastNewsUpdate = Date.now();
  } catch {
    document.querySelector("#news-headline").textContent = "The live news feed is taking a short break. Check back soon.";
    document.querySelector("#news-updated").textContent = "RETRYING SOON";
  }
}

function updateNewsDate() {
  const now = new Date();
  document.querySelector("#news-month").textContent = new Intl.DateTimeFormat([], { month: "short" }).format(now).toUpperCase();
  document.querySelector("#news-day").textContent = new Intl.DateTimeFormat([], { day: "2-digit" }).format(now);
}

async function loadMinnesotaNews() {
  const endpoint = new URL("https://www.minnpost.com/wp-json/wp/v2/posts");
  endpoint.searchParams.set("per_page", "8");
  endpoint.searchParams.set("_fields", "link,title,date");

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Minnesota news service unavailable");
    const stories = await response.json();
    if (!stories.length) throw new Error("No Minnesota headlines returned");

    const sensitiveTerms = /\b(killed|shooting|bombing|massacre|graphic|hostage|dead|death toll|fatal)\b/i;
    const story = stories.find((candidate) =>
      !candidate.link.includes("/national/") && !sensitiveTerms.test(decodeHTML(candidate.title.rendered))
    ) || stories.find((candidate) => !candidate.link.includes("/national/")) || stories[0];

    document.querySelector("#minnesota-headline").textContent = decodeHTML(story.title.rendered);
    document.querySelector("#minnesota-link").href = story.link;
    document.querySelector("#minnesota-updated").textContent = `UPDATED ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    lastMinnesotaUpdate = Date.now();
  } catch {
    document.querySelector("#minnesota-headline").textContent = "The Minnesota news feed is taking a short break. Check back soon.";
    document.querySelector("#minnesota-updated").textContent = "RETRYING SOON";
  }
}

function centralTimeParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function centralDateKey() {
  const parts = centralTimeParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function updateDistrictPhoto() {
  const dateKey = centralDateKey();
  const dayNumber = Number(dateKey.replaceAll("-", ""));
  const photo = DISTRICT_PHOTOS[dayNumber % DISTRICT_PHOTOS.length];
  const image = document.querySelector("#district-photo");
  image.src = `${photo.url}?daily=${dateKey}`;
  image.alt = photo.alt;
  document.querySelector("#district-title").textContent = photo.title;
  document.querySelector("#district-date").textContent = new Intl.DateTimeFormat([], {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date()).toUpperCase();
}

function loadLinkedSlides(markDailyRefresh = false) {
  const cacheKey = `${centralDateKey()}-${Date.now()}`;
  document.querySelectorAll(".linked-slide-image").forEach((image) => {
    image.classList.remove("is-loaded");
    image.onload = () => image.classList.add("is-loaded");
    image.onerror = () => {
      const loading = image.parentElement.querySelector(".source-loading");
      if (loading) loading.textContent = `${image.dataset.label} is temporarily unavailable.`;
    };
    image.src = `${image.dataset.src}&refresh=${cacheKey}`;
  });
  if (markDailyRefresh) localStorage.setItem("linkedSlidesRefreshDate", centralDateKey());
}

function checkMorningRefresh() {
  const parts = centralTimeParts();
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number(parts.hour) % 24;
  if (hour >= 8 && localStorage.getItem("linkedSlidesRefreshDate") !== today) loadLinkedSlides(true);
}

function openSettings() {
  document.querySelector("#settings").classList.add("is-open");
  document.querySelector("#settings").setAttribute("aria-hidden", "false");
  document.querySelector("#scrim").classList.add("is-visible");
  clearTimeout(state.slideTimer);
  clearTimeout(state.revealTimer);
  document.querySelector("#city-input").value = state.settings.city;
  document.querySelector("#duration-input").value = state.settings.duration;
  document.querySelector("#category-input").value = state.settings.category;
}

function closeSettings() {
  document.querySelector("#settings").classList.remove("is-open");
  document.querySelector("#settings").setAttribute("aria-hidden", "true");
  document.querySelector("#scrim").classList.remove("is-visible");
  scheduleSlide();
}

document.querySelector("#settings-button").addEventListener("click", openSettings);
document.querySelector("#close-settings").addEventListener("click", closeSettings);
document.querySelector("#scrim").addEventListener("click", closeSettings);

document.querySelector("#fullscreen-button").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch { /* Browser or display may manage fullscreen itself. */ }
});

document.querySelector("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const note = document.querySelector("#settings-note");
  const requestedCity = document.querySelector("#city-input").value.trim();
  note.textContent = "Finding that location…";
  try {
    const location = await geocodeCity(requestedCity);
    state.settings = {
      ...state.settings,
      ...location,
      duration: Math.min(120, Math.max(10, Number(document.querySelector("#duration-input").value) || 24)),
      category: document.querySelector("#category-input").value,
    };
    localStorage.setItem("mediaCenterSettings", JSON.stringify(state.settings));
    await Promise.all([loadWeather(), loadTrivia()]);
    note.textContent = "Saved. Weather updates every 15 minutes; linked schedules refresh at 8:00 AM.";
    setTimeout(closeSettings, 450);
  } catch {
    note.textContent = "I couldn’t find that location. Try a nearby city and state.";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector("#settings").classList.contains("is-open")) closeSettings();
  if (event.key === "ArrowRight" && !document.querySelector("#settings").classList.contains("is-open")) nextSlide();
});

async function init() {
  updateClock();
  updateNewsDate();
  updateDistrictPhoto();
  setInterval(updateClock, 1000);
  const startHour = Number(centralTimeParts().hour) % 24;
  if (startHour < 8) localStorage.removeItem("linkedSlidesRefreshDate");
  loadLinkedSlides(startHour >= 8);
  await Promise.all([loadTrivia(), loadWeather(), loadNews(), loadMinnesotaNews()]);
  setInterval(loadWeather, 15 * 60 * 1000);
  setInterval(loadNews, 30 * 60 * 1000);
  setInterval(loadMinnesotaNews, 30 * 60 * 1000);
  setInterval(updateNewsDate, 60 * 60 * 1000);
  setInterval(updateDistrictPhoto, 60 * 60 * 1000);
  setInterval(checkMorningRefresh, 30 * 1000);
  scheduleSlide();
}

init();
