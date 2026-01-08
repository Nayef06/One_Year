// render.js
const fs = require("fs");
const { createCanvas } = require("canvas");

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

// === BIRTH & LIFESPAN ===
// Your birthday: July 22, 2006 (UTC)
const BIRTH_DATE = new Date(Date.UTC(2006, 6, 22));
// Target age: 75
const TARGET_AGE = 75;

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function computeDays() {
    // 75th birthday: July 22, 2006 + 75 years = July 22, 2081 (UTC)
    const endYear = BIRTH_DATE.getUTCFullYear() + TARGET_AGE;
    const endMonth = BIRTH_DATE.getUTCMonth();
    const endDate = BIRTH_DATE.getUTCDate();
    const END_DATE = new Date(Date.UTC(endYear, endMonth, endDate));

    const now = new Date();
    // Use UTC for consistent, server-independent calculations
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const oneDay = 24 * 60 * 60 * 1000;

    // Total days from birth to 75th birthday
    const totalDays = Math.floor((END_DATE - BIRTH_DATE) / oneDay);
    
    // Days elapsed from birth until today
    const dayNumber = Math.floor((today - BIRTH_DATE) / oneDay);

    return { dayNumber, totalDays };
}

function computeGrid(totalDays) {
    // Increased column limit to 80 to reduce the number of rows and increase vertical spacing (stepY)
    const MAX_COLS = 135; 
    
    // Calculate required rows based on the total days and the maximum allowed columns
    let cols = clamp(MAX_COLS, 1, totalDays); 
    let rows = Math.ceil(totalDays / cols);

    const availW = W - SIDE_PAD * 2;
    const availH = H - TOP_SAFE - BOTTOM_SAFE;

    // The denominator must be at least 1 to avoid division by zero if cols or rows is 1
    const stepX = availW / (cols - 1 || 1); 
    const stepY = availH / (rows - 1 || 1);

    // Recalculate radius based on the new, smaller steps
    let r = Math.floor(Math.min(stepX, stepY) * 0.15);
    r = 2;

    console.log(`Grid: ${cols} columns x ${rows} rows. Total dots: ${cols * rows}. Actual Ratio (cols/rows): ${(cols/rows).toFixed(3)}`);
    console.log(`Dot Radius (r): ${r}`);

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

    return canvas;
}

function main() {
    const { dayNumber, totalDays } = computeDays();
    const now = new Date();
    
    const canvas = renderWallpaper(dayNumber, totalDays);
    const outPath = "today.png";
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    
    console.log(`Wrote ${outPath}`);
    console.log(`Days passed since birth: ${dayNumber}`);
    console.log(`Total days until age ${TARGET_AGE}: ${totalDays}`);
    console.log(`Today's date (UTC): ${now.toISOString().substring(0, 10)}`);
}

main();