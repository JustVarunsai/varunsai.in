const revealItems = document.querySelectorAll("[data-reveal]");

revealItems.forEach((item) => item.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const yearTarget = document.querySelector("[data-year]");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear().toString();
}

const interactiveElements = document.querySelectorAll(
  ".brand, .site-nav a, .button, .path-card, .closing-links a, .inline-link",
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext;

function playInterfaceTone() {
  if (!AudioContextClass || prefersReducedMotion.matches) {
    return;
  }

  audioContext ??= new AudioContextClass();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const gainNode = audioContext.createGain();
  const lowerOscillator = audioContext.createOscillator();
  const upperOscillator = audioContext.createOscillator();

  lowerOscillator.type = "sine";
  upperOscillator.type = "triangle";
  lowerOscillator.frequency.setValueAtTime(392, now);
  upperOscillator.frequency.setValueAtTime(587.33, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.018, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  lowerOscillator.connect(gainNode);
  upperOscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  lowerOscillator.start(now);
  upperOscillator.start(now);
  lowerOscillator.stop(now + 0.16);
  upperOscillator.stop(now + 0.14);
}

interactiveElements.forEach((element) => {
  element.addEventListener("pointerdown", playInterfaceTone, { passive: true });
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      playInterfaceTone();
    }
  });
});
