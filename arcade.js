"use strict";

const cabinet = document.querySelector("#arcade");
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const title = document.querySelector("#screen-title");
const play = document.querySelector("#play");
const directions = [...document.querySelectorAll("[data-direction]")];
const scoreOutput = document.querySelector("#score");
const bestOutput = document.querySelector("#best");
const timeOutput = document.querySelector("#time");
const status = document.querySelector("#game-status");
const roundLength = 25;
const storageKey = "kirmyOrg.stardial.best";
const backdrop = document.createElement("canvas");
backdrop.width = canvas.width;
backdrop.height = canvas.height;

let state = "ready";
let elapsed = 0;
let score = 0;
let best = loadBest();
let ship = canvas.width / 2;
let lastFrame = 0;
let nextStar = 0;
let animationFrame = 0;
let pressedDirection = 0;
let keyboardDirection = 0;
let stars = [];

function loadBest() {
  try {
    return Number(localStorage.getItem(storageKey)) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem(storageKey, String(best));
  } catch {
    // The current page still keeps the score when storage is unavailable.
  }
}

function drawBackdrop() {
  const art = backdrop.getContext("2d");
  const { width, height } = backdrop;
  art.fillStyle = "#101e22";
  art.fillRect(0, 0, width, height);

  for (let index = 0; index < 81; index += 1) {
    const x = (index * 109 + 15) % width;
    const y = (index * 67 + 11) % 121;
    art.fillStyle = ["#395e52", "#7ea889", "#b5cc88"][index % 3];
    art.fillRect(x, y, index % 8 === 0 ? 2 : 1, index % 8 === 0 ? 2 : 1);
  }

  art.fillStyle = "#233c36";
  art.beginPath();
  art.moveTo(0, 127);
  art.lineTo(19, 113);
  art.lineTo(37, 115);
  art.lineTo(50, 105);
  art.lineTo(73, 126);
  art.lineTo(98, 114);
  art.lineTo(114, 130);
  art.lineTo(153, 117);
  art.lineTo(178, 132);
  art.lineTo(218, 105);
  art.lineTo(245, 124);
  art.lineTo(263, 107);
  art.lineTo(295, 118);
  art.lineTo(320, 108);
  art.lineTo(width, height);
  art.lineTo(0, height);
  art.closePath();
  art.fill();

  art.fillStyle = "#182f2d";
  art.fillRect(0, 132, width, 28);
  art.fillStyle = "#679278";
  art.fillRect(0, 132, width, 1);
  art.strokeStyle = "#35564b";
  art.beginPath();
  for (let x = -160; x <= 480; x += 24) {
    art.moveTo(160 + (x - 160) * .35, 133);
    art.lineTo(x, height);
  }
  for (const y of [137, 143, 153]) {
    art.moveTo(0, y);
    art.lineTo(width, y);
  }
  art.stroke();
}

function drawStar(x, y, color) {
  context.fillStyle = color;
  context.fillRect(x - 1, y - 4, 3, 9);
  context.fillRect(x - 4, y - 1, 9, 3);
}

function draw() {
  context.drawImage(backdrop, 0, 0);
  stars.forEach(({ x, y }) => drawStar(Math.round(x), Math.round(y), "#efcd76"));

  if (state === "ready") {
    drawStar(54, 63, "#d5ed8e");
    drawStar(256, 48, "#d5ed8e");
    drawStar(235, 94, "#87ad81");
  }

  const x = Math.round(ship);
  context.fillStyle = "#d8ee91";
  context.fillRect(x - 2, 134, 4, 3);
  context.fillRect(x - 5, 137, 10, 4);
  context.fillRect(x - 9, 141, 18, 4);
  context.fillStyle = "#8baa76";
  context.fillRect(x - 8, 145, 16, 1);
  context.fillStyle = "#f6cb72";
  context.fillRect(x - 2, 147, 4, 2);
}

function updateHud() {
  scoreOutput.textContent = String(score).padStart(2, "0");
  bestOutput.textContent = String(best).padStart(2, "0");
  timeOutput.textContent = String(Math.max(0, Math.ceil(roundLength - elapsed))).padStart(2, "0");
}

function setState(nextState) {
  state = nextState;
  title.hidden = state === "playing";
  directions.forEach((button) => { button.disabled = state !== "playing"; });
  if (state === "playing") {
    play.textContent = "Pause";
    status.textContent = "Round in progress.";
    return;
  }

  cancelAnimationFrame(animationFrame);
  keyboardDirection = 0;
  pressedDirection = 0;
  if (state === "paused") {
    title.firstElementChild.textContent = "PAUSED";
    title.lastElementChild.textContent = "Resume when you're ready";
    play.textContent = "Resume";
    status.textContent = "Game paused.";
  } else if (state === "complete") {
    title.firstElementChild.textContent = "TIME'S UP";
    title.lastElementChild.textContent = "Final score: " + score;
    play.textContent = "Play again";
    status.textContent = "Game over. Final score " + score + ". Best score " + best + ".";
  }
}

function clampShip(position) {
  return Math.min(canvas.width - 10, Math.max(10, position));
}

function tick(timestamp) {
  const delta = Math.min((timestamp - lastFrame) / 1000 || 0, .04);
  lastFrame = timestamp;
  elapsed = Math.min(roundLength, elapsed + delta);
  ship = clampShip(ship + (keyboardDirection || pressedDirection) * 160 * delta);

  if (elapsed >= nextStar) {
    stars.push({ x: 12 + Math.random() * 296, y: -6, speed: 65 + Math.random() * 24 });
    nextStar = elapsed + .43 + Math.random() * .29;
  }

  stars = stars.filter((star) => {
    star.y += star.speed * delta;
    if (star.y >= 133 && star.y <= 149 && Math.abs(star.x - ship) <= 12) {
      score += 1;
      return false;
    }
    return star.y < canvas.height + 4;
  });

  if (score > best) {
    best = score;
    saveBest();
  }
  updateHud();
  draw();

  if (elapsed >= roundLength) {
    setState("complete");
    return;
  }
  animationFrame = requestAnimationFrame(tick);
}

play.addEventListener("click", () => {
  if (state === "playing") {
    setState("paused");
    return;
  }

  if (state !== "paused") {
    elapsed = 0;
    score = 0;
    ship = canvas.width / 2;
    nextStar = 0;
    stars = [];
  }
  lastFrame = performance.now();
  setState("playing");
  animationFrame = requestAnimationFrame(tick);
});

cabinet.addEventListener("keydown", (event) => {
  if (state !== "playing" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  keyboardDirection = event.key === "ArrowLeft" ? -1 : 1;
});

window.addEventListener("keyup", (event) => {
  if ((event.key === "ArrowLeft" && keyboardDirection < 0) ||
      (event.key === "ArrowRight" && keyboardDirection > 0)) {
    keyboardDirection = 0;
  }
});

directions.forEach((button) => {
  const direction = Number(button.dataset.direction);
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture(event.pointerId);
    pressedDirection = direction;
  });
  button.addEventListener("lostpointercapture", () => {
    if (pressedDirection === direction) pressedDirection = 0;
  });
  button.addEventListener("click", (event) => {
    if (event.detail === 0) ship = clampShip(ship + direction * 16);
  });
});

canvas.addEventListener("pointerdown", (event) => {
  if (state !== "playing") return;
  const bounds = canvas.getBoundingClientRect();
  ship = clampShip((event.clientX - bounds.left) * canvas.width / bounds.width);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") setState("paused");
});

window.addEventListener("blur", () => {
  keyboardDirection = 0;
  pressedDirection = 0;
});

drawBackdrop();
draw();
updateHud();
play.disabled = false;
