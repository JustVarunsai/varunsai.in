const yearTarget = document.querySelector("[data-year]");

if (yearTarget) yearTarget.textContent = new Date().getFullYear().toString();

const thoughts = [
  "New visitor detected. I have made the tea look busy.",
  "Stand-up update: still standing. The code has opinions.",
  "This bug has been promoted to a recurring character.",
  "Deploying on Friday is a personality test. I declined.",
  "The Wi-Fi is strong. The plan is being reviewed.",
  "One more small change. Famous last words.",
  "The build is loading. Please enjoy this professionally timed pause.",
  "I named the variable later. It is now an archaeological site.",
  "No meetings were harmed. The calendar looked suspicious, though.",
];

const thoughtTargets = document.querySelectorAll("[data-sidekick-thought], [data-agent-status]");
const nextThoughtButtons = document.querySelectorAll("[data-sidekick-next]");
let previousThought = Number(sessionStorage.getItem("varun-sidekick-thought"));

function nextThought() {
  let index = Math.floor(Math.random() * thoughts.length);
  while (thoughts.length > 1 && index === previousThought) index = Math.floor(Math.random() * thoughts.length);
  previousThought = index;
  sessionStorage.setItem("varun-sidekick-thought", String(index));
  thoughtTargets.forEach((target) => {
    target.textContent = thoughts[index];
    target.setAttribute("aria-live", "polite");
    window.setTimeout(() => target.removeAttribute("aria-live"), 800);
  });
}

nextThoughtButtons.forEach((button) => button.addEventListener("click", nextThought));

const spotifyButton = document.querySelector("[data-spotify-launch]");
const playerDock = document.querySelector("[data-player-dock]");
const spotifyMount = document.querySelector("[data-spotify-mount]");
const record = document.querySelector(".record-disc");
const minimizeButton = document.querySelector("[data-player-minimize]");
const restoreButton = document.querySelector("[data-player-restore]");
const spotifyTrackUri = "spotify:track:0HE9a9ndSFMCELuobaW5yK";
let spotifyIframeApi;
let spotifyController;
let spotifyStartRequested = false;

function createSpotifyController() {
  if (!spotifyIframeApi || !spotifyMount || spotifyController) return;
  spotifyMount.replaceChildren();
  const mountPoint = document.createElement("div");
  spotifyMount.append(mountPoint);
  spotifyIframeApi.createController(
    mountPoint,
    { uri: spotifyTrackUri, width: "100%", height: 152 },
    (controller) => {
      spotifyController = controller;
      if (spotifyStartRequested) startSpotifyAtBeginning();
    },
  );
}

function ensureSpotifyIframeApi() {
  if (spotifyIframeApi) return createSpotifyController();
  if (document.getElementById("spotify-iframe-api")) return;
  const apiScript = document.createElement("script");
  apiScript.id = "spotify-iframe-api";
  apiScript.src = "https://open.spotify.com/embed/iframe-api/v1";
  apiScript.async = true;
  document.body.append(apiScript);
}

function startSpotifyAtBeginning() {
  if (!spotifyController) return;
  // Spotify's controller is given the track and a zero-second start point, then explicitly restarted.
  spotifyController.loadEntity?.(spotifyTrackUri, false, 0);
  spotifyController.restart?.();
  spotifyController.play?.();
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  spotifyIframeApi = IFrameAPI;
  createSpotifyController();
};

function setPlayerMinimized(minimized) {
  playerDock?.classList.toggle("is-minimized", minimized);
  restoreButton?.toggleAttribute("hidden", !minimized);
  minimizeButton?.toggleAttribute("hidden", minimized);
}

spotifyButton?.addEventListener("click", () => {
  if (!playerDock || !spotifyMount) return;
  playerDock.hidden = false;
  setPlayerMinimized(false);
  record?.classList.add("is-spinning");

  spotifyStartRequested = true;
  if (spotifyController) startSpotifyAtBeginning();
  else ensureSpotifyIframeApi();

  spotifyButton.textContent = "Restart from 0:00";
  spotifyButton.setAttribute("aria-expanded", "true");
});

minimizeButton?.addEventListener("click", () => setPlayerMinimized(true));
restoreButton?.addEventListener("click", () => setPlayerMinimized(false));

window.addEventListener(
  "scroll",
  () => {
    if (spotifyMount?.querySelector("iframe") && !playerDock?.classList.contains("is-minimized")) {
      setPlayerMinimized(true);
    }
  },
  { passive: true },
);

const motionItems = document.querySelectorAll(
  ".hero, .welcome-note, .notes-section, .sidekick-section, .photo-section, .sound-section, .about-section, .contact-section",
);
const motionDirections = ["rise", "slide-left", "rise", "slide-right", "rise", "slide-left", "slide-right", "rise"];

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.body.classList.add("motion-ready");
  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        motionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  motionItems.forEach((item, index) => {
    if (!item.dataset.motion) item.dataset.motion = motionDirections[index] || "rise";
    motionObserver.observe(item);
  });
}

const gallery = document.querySelector(".photo-board");
const galleryStory = document.querySelector("[data-gallery-story]");
const galleryPrevious = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const galleryCards = gallery ? [...gallery.querySelectorAll(".photo-frame")] : [];
const galleryCount = document.querySelector("[data-gallery-count]");
let activePhoto = 0;
let galleryIsMoving = false;

function paintPhotoStack() {
  if (!galleryCards.length) return;
  galleryCards.forEach((card, index) => {
    const position = (index - activePhoto + galleryCards.length) % galleryCards.length;
    card.classList.toggle("is-current", position === 0);
    card.classList.toggle("is-next", position === 1);
    card.classList.toggle("is-peek", position === 2);
    card.classList.toggle("is-back", position > 2);
    card.setAttribute("aria-hidden", position > 2 ? "true" : "false");
  });
  if (galleryCount) galleryCount.textContent = `${String(activePhoto + 1).padStart(2, "0")} / ${String(galleryCards.length).padStart(2, "0")}`;
}

function moveGallery(direction) {
  if (!galleryCards.length || galleryIsMoving) return;
  galleryIsMoving = true;
  activePhoto = (activePhoto + direction + galleryCards.length) % galleryCards.length;
  paintPhotoStack();
  window.setTimeout(() => {
    galleryIsMoving = false;
  }, 680);
}

gallery?.addEventListener(
  "wheel",
  (event) => {
    const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
    if (!isHorizontal) return;
    event.preventDefault();
    moveGallery((event.deltaX || event.deltaY) > 0 ? 1 : -1);
  },
  { passive: false },
);

gallery?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveGallery(event.key === "ArrowRight" ? 1 : -1);
});

galleryPrevious?.addEventListener("click", () => moveGallery(-1));
galleryNext?.addEventListener("click", () => moveGallery(1));

// A story stack should respond where people naturally tap: either half of the image itself.
galleryStory?.addEventListener("click", (event) => {
  if (event.target.closest(".gallery-hit, a, button")) return;
  const bounds = galleryStory.getBoundingClientRect();
  moveGallery(event.clientX >= bounds.left + bounds.width / 2 ? 1 : -1);
});

paintPhotoStack();
