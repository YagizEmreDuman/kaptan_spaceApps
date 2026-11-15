// All geometry is illustrative artwork, not crop traits or an agronomic model.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function leaf(ctx, x, y, direction, size, color, bend) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + direction * size, y - size * .8 + bend, x + direction * size * 1.5, y - size * .35 + bend);
  ctx.quadraticCurveTo(x + direction * size * .5, y + size * .4 + bend, x, y); ctx.fill();
}

function plant(ctx, crop, height, maturity, pressure, sway) {
  const bend = pressure * 12;
  const green = pressure > 0 ? `rgb(${Math.round(60 + pressure * 90)},${Math.round(139 - pressure * 55)},56)` : '#3d9455';
  ctx.save(); ctx.rotate(sway + pressure * .08);
  ctx.strokeStyle = green; ctx.fillStyle = green; ctx.lineCap = 'round';
  ctx.lineWidth = crop === 'maize' || crop === 'sunflower' ? 3.5 : 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -height * .6, bend, -height); ctx.stroke();
  const leafy = crop === 'maize' ? 4 : 2;
  for (let i = 1; i <= leafy; i++) leaf(ctx, bend * i / (leafy + 1), -height * i / (leafy + 1), i % 2 ? -1 : 1, height * (crop === 'maize' ? .24 : .13), green, bend * .45);
  if (crop === 'chickpea' || crop === 'lentil') {
    for (const direction of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, -height * .25); ctx.lineTo(direction * height * .28, -height * .7 + bend); ctx.stroke();
      for (let i = 1; i <= 3; i++) leaf(ctx, direction * height * .22, -height * (.25 + i * .13), direction, height * .1, green, bend * .25);
      if (maturity > .55) {
        ctx.fillStyle = crop === 'chickpea' ? '#b5bd61' : '#a3ad72';
        ctx.beginPath(); ctx.ellipse(direction * height * .26, -height * .5 + bend, crop === 'chickpea' ? 5 : 3, 6, direction * .2, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (crop === 'sunflower' && maturity > .5) {
    ctx.save(); ctx.translate(bend, -height);
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5); ctx.fillStyle = '#f8c743';
      ctx.beginPath(); ctx.ellipse(0, -10, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#5e442c'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  } else if (crop === 'maize' && maturity > .55) {
    ctx.fillStyle = '#e8bc4f'; ctx.beginPath(); ctx.ellipse(8 + bend * .5, -height * .55, 5, 13, -.35, 0, Math.PI * 2); ctx.fill();
    leaf(ctx, 5, -height * .35, 1, height * .2, green, bend * .25);
    ctx.strokeStyle = '#b88a43'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(bend, -height); ctx.lineTo(bend + i * 5, -height - 10 + Math.abs(i) * 2); ctx.stroke(); }
  } else if ((crop === 'wheat' || crop === 'barley') && maturity > .4) {
    const grain = maturity > .8 ? '#e3b44f' : '#a7b654';
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = grain;
      for (const direction of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(bend + direction * 3, -height + i * 4, 3, 5, direction * .55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = grain; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(bend + direction * 4, -height + i * 4);
        ctx.lineTo(bend + direction * (crop === 'barley' ? 15 : 7), -height + i * 4 - (crop === 'barley' ? 20 : 7)); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export class FarmFieldRenderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }
  draw({ crop, progress, pressure, conditions, seconds, name }) {
    const { canvas, ctx } = this;
    if (!ctx) return;
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(300, box.width || 800), height = Math.max(260, box.height || 380);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#d9f0fa'); sky.addColorStop(.58, '#f1faf0'); sky.addColorStop(1, '#d3e9b5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    const warmth = clamp(conditions.temperatureChangeC / 15, 0, 1);
    ctx.fillStyle = `rgba(251,185,70,${.5 + warmth * .4})`; ctx.beginPath(); ctx.arc(width - 64, 54, 25 + warmth * 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bed6a5'; ctx.beginPath(); ctx.moveTo(0, height * .5); ctx.quadraticCurveTo(width * .3, height * .25, width * .6, height * .48); ctx.quadraticCurveTo(width * .85, height * .33, width, height * .44); ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.fill();

    // 3D Trapezoid Field Boundaries
    const yTop = height * .48;
    const yBottom = height * .94;
    const xLeftTop = width * .16;
    const xRightTop = width * .84;
    const xLeftBottom = width * .02;
    const xRightBottom = width * .98;

    const fieldEdgeLeft = t => xLeftTop + t * (xLeftBottom - xLeftTop);
    const fieldEdgeRight = t => xRightTop + t * (xRightBottom - xRightTop);
    const fieldY = t => yTop + t * (yBottom - yTop);

    const dry = clamp(-conditions.rainfallChangePct / 100, 0, 1);
    ctx.fillStyle = dry ? '#aa835b' : '#8c6948';
    ctx.beginPath();
    ctx.moveTo(xLeftTop, yTop);
    ctx.lineTo(xRightTop, yTop);
    ctx.lineTo(xRightBottom, yBottom);
    ctx.lineTo(xLeftBottom, yBottom);
    ctx.closePath();
    ctx.fill();

    const cols = 9;
    const rows = 5;
    const padRatio = 0.045;

    // Perspective longitudinal furrow lines converging toward the horizon vanishing point
    ctx.strokeStyle = dry ? 'rgba(112, 80, 52, 0.38)' : 'rgba(92, 64, 40, 0.42)';
    ctx.lineWidth = 1.5;
    for (let col = 0; col < cols; col++) {
      const u = (col + 0.5) / cols;
      const tStart = 0.06;
      const tEnd = 0.93;
      const lStart = fieldEdgeLeft(tStart), rStart = fieldEdgeRight(tStart);
      const lEnd = fieldEdgeLeft(tEnd), rEnd = fieldEdgeRight(tEnd);
      const wStart = rStart - lStart, wEnd = rEnd - lEnd;
      const xStart = lStart + wStart * (padRatio + (1 - 2 * padRatio) * u);
      const xEnd = lEnd + wEnd * (padRatio + (1 - 2 * padRatio) * u);
      ctx.beginPath();
      ctx.moveTo(xStart, fieldY(tStart));
      ctx.lineTo(xEnd, fieldY(tEnd));
      ctx.stroke();
    }

    // Perspective horizontal planted rows (foreshortened spacing from back to front of trapezoid)
    for (let row = 0; row < rows; row++) {
      const normRow = row / (rows - 1);
      // Perspective foreshortening: closer rows at the bottom have wider vertical spacing
      const t = 0.12 + Math.pow(normRow, 1.15) * 0.74;
      const y = fieldY(t);
      const leftEdge = fieldEdgeLeft(t);
      const rightEdge = fieldEdgeRight(t);
      const rowSpan = rightEdge - leftEdge;
      const rowLeft = leftEdge + rowSpan * padRatio;
      const rowRight = rightEdge - rowSpan * padRatio;

      ctx.strokeStyle = '#705034';
      ctx.lineWidth = 1.4 + normRow * 1.1;
      ctx.beginPath();
      ctx.moveTo(rowLeft, y + 3);
      ctx.lineTo(rowRight, y + 3);
      ctx.stroke();

      const scale = 0.50 + t * 0.54;
      for (let col = 0; col < cols; col++) {
        const u = (col + 0.5) / cols;
        const x = rowLeft + (rowRight - rowLeft) * u;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        if (progress < .19) {
          ctx.fillStyle = crop === 'lentil' ? '#c27b49' : '#d4ab63';
          ctx.beginPath();
          ctx.ellipse(0, 0, crop === 'barley' ? 2.4 : 3.8, 2.2, -.35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const plantHeight = 10 + clamp((progress - .19) / .61, 0, 1) * 62;
          plant(
            ctx,
            crop,
            plantHeight,
            progress,
            pressure === null ? 0 : clamp(pressure / 100, 0, 1),
            Math.sin(seconds * 2 + col + row) * .025
          );
        }
        ctx.restore();
      }
    }

    // Weather effects are explicitly the USER'S scenario cues, not a forecast.
    if (conditions.rainfallChangePct > 0) {
      ctx.strokeStyle = 'rgba(43,137,181,.6)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const x = (i * 71) % width, y = ((i * 37 + seconds * 85) % (height * .7));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 10); ctx.stroke();
      }
    }
    if (conditions.irrigationAvailabilityChangePct > 0) {
      ctx.strokeStyle = '#4a9eaf'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(width * .07, height * .91); ctx.lineTo(width * .93, height * .91); ctx.stroke();
      ctx.fillStyle = '#82d9ec';
      for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.arc(width * i / 10, height * .9 - 8 - (Math.sin(seconds * 4 + i) + 1) * 4, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillRect(12, 12, Math.min(280, width - 105), 86);
    ctx.save(); ctx.translate(42, 85); ctx.scale(.55, .55); plant(ctx, crop, 70, 1, 0, 0); ctx.restore();
    ctx.fillStyle = '#234837'; ctx.font = '600 13px system-ui'; ctx.fillText(name, 76, 43);
    ctx.font = '10px system-ui';
    if (width < 450) { ctx.fillText('Ürün görseli', 76, 62); ctx.fillText('Temsili animasyon', 76, 76); }
    else ctx.fillText('Ürün görseli · Temsili animasyon', 76, 62);
  }
}
