const gameCards = document.querySelectorAll(".game-card");

gameCards.forEach((card) => {
  const playLightning = () => {
    card.classList.remove("lightning-active");
    void card.offsetWidth;
    card.classList.add("lightning-active");
  };

  card.addEventListener("click", (event) => {
    if (card instanceof HTMLButtonElement) {
      const isPressed = card.getAttribute("aria-pressed") === "true";
      card.setAttribute("aria-pressed", String(!isPressed));
      playLightning();
      return;
    }

    event.preventDefault();
    if (card.dataset.navigating === "true") {
      return;
    }

    card.dataset.navigating = "true";
    playLightning();
    const navigationDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 650
      : 1850;
    window.setTimeout(() => {
      window.location.assign(card.href);
    }, navigationDelay);
  });

  card.addEventListener("animationend", (event) => {
    if (event.animationName === "lightning-pass") {
      card.classList.remove("lightning-active");
    }
  });
});

const todayDate = document.querySelector("#today-date");
const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

todayDate.dateTime = localDate;
todayDate.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(today);
