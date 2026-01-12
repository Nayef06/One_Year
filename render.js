// render.js
const fs = require("fs");
const path = require("path");
const { createCanvas, registerFont } = require("canvas");

try {
  registerFont(path.join(__dirname, "RobotoMono-Regular.ttf"), { family: "MyRoboto" });
} catch (e) {
  console.warn("Could not register font:", e.message);
}

// === RESOLUTION ===
const W = 1179;
const H = 2556;

// === SAFE AREAS ===
const TOP_SAFE = Math.floor(H * 0.35);
const BOTTOM_SAFE = Math.floor(H * 0.15);
const SIDE_PAD = 125;

// === COLORS ===
const BG = "#000000";
const DONE = "#FFFFFF";
const TODO = "#2F2F2F";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

// Day-of-year in a chosen timezone.
// We'll use UTC by default in GitHub Actions to avoid server-local surprises.
function dayOfYearUTC(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const today = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const diffMs = today - start;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diffMs / oneDay) + 1; // Jan 1 => 1
}

function computeGrid(totalDays) {
  const cols = 14;
  const rows = Math.ceil(totalDays / cols);

  const availW = W - SIDE_PAD * 2;
  const availH = H - TOP_SAFE - BOTTOM_SAFE;

  const stepX = availW / (cols - 1);
  const stepY = availH / (rows - 1);

  let r = Math.floor(Math.min(stepX, stepY) * 0.15);
  r = clamp(r, 3, 9);

  return { cols, rows, r, stepX, stepY };
}

function renderWallpaper(dayNumber, totalDays) {
  const day = clamp(dayNumber || 0, 0, totalDays);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const { cols, rows, r, stepX, stepY } = computeGrid(totalDays);

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      idx++;
      if (idx > totalDays) break;

      const x = SIDE_PAD + col * stepX;
      const y = TOP_SAFE + row * stepY;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = idx <= day ? DONE : TODO;
      ctx.fill();
    }
  }

  // === DAYS LEFT TEXT ===
  const showText = false;;

  if (showText) {
    const daysLeft = totalDays - day;
    const daysText = " days left";
    const numText = daysLeft.toString();

    ctx.font = "40px MyRoboto, Consolas, monospace";

    // Calculate text widths
    const numWidth = ctx.measureText(numText).width;
    const textWidth = ctx.measureText(daysText).width;

    // Position: Bottom Right of the SAFE AREA
    // The grid ends at H - BOTTOM_SAFE.
    // We want to align with the right side of the grid (W - SIDE_PAD).

    const textX = W - SIDE_PAD - textWidth + 10;
    const textY = H - BOTTOM_SAFE + 10; // Sits on the bottom line of the safe area

    const numX = textX - numWidth;

    // Draw "days left"
    ctx.fillStyle = "#2F2F2F";
    ctx.fillText(daysText, textX, textY);

    // Draw number
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(numText, numX, textY);
  }

  return canvas;
}

function main() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;
  const day = dayOfYearUTC(now);

  const canvas = renderWallpaper(day, totalDays);
  const outPath = "today.png";
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log(`Wrote ${outPath} for day ${day}/${totalDays} (year ${year}, UTC)`);
}

main();