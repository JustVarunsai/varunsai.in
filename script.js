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

const rotatingWord = document.querySelector("[data-rotate]");

if (rotatingWord) {
  const words = rotatingWord.dataset.words
    .split("|")
    .map((word) => word.trim())
    .filter(Boolean);

  let wordIndex = 0;

  window.setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotatingWord.style.opacity = "0.18";

    window.setTimeout(() => {
      rotatingWord.textContent = words[wordIndex];
      rotatingWord.style.opacity = "1";
    }, 180);
  }, 2600);
}

const yearTarget = document.querySelector("[data-year]");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear().toString();
}
