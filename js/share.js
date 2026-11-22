/* 공유용 이미지 카드(PNG): 검사 결과 카드 / 케미 카드.
   브라우저 canvas 로 직접 그린다 — 외부 요청·외부 폰트 없음. 입력값은 저장·전송하지 않는다.
   내용 만들기(cardSpec*)와 그리기(drawCard)를 분리해 내용은 테스트로 검증한다 */
const CARD_W = 1080, CARD_H = 1350;
const CARD_FONT = '"Pretendard","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const CARD_NOTE = "공식 MBTI®가 아닌 재미용 간이 검사예요";
const CARD_INK = "#2a2540", CARD_SUB = "#5b5675", CARD_ACCENT = "#e8b35a", CARD_HEART = "#ff6f91";

/* http(s) 로 열렸을 때만 주소를 카드 하단에 적는다 (file:// 이면 비움) */
function cardSiteLine(){
  try { return /^https?:$/.test(location.protocol) ? location.host + location.pathname.replace(/index\.html$/, "") : ""; }
  catch (e) { return ""; }
}

/* ---------- 내용(spec) ---------- */
function cardSpecResult(type, r, modeKey){
  const [main, bg] = AV_COLORS[gOf(type)];
  return {
    kind: "result", main, bg, type, name: T[type].n, hook: T[type].h, tags: SHORT[type].tags,
    axes: AXES.map(([k,a,b,la,lb]) => ({la, lb, pctA: r[k].pctA, pctB: r[k].pctB})),
    badge: `${MODE_NAME[modeKey]} 검사 결과`, note: CARD_NOTE, site: cardSiteLine(), file: `mbti-${type}.png`
  };
}
function cardSpecPair(me, other, stageKey){
  const a = pairAdvice(me, other, stageKey);
  const [main, bg] = AV_COLORS[gOf(me)];
  return {
    kind: "pair", main, bg, me, other, hearts: a.hearts, label: a.heartLabel, title: a.title,
    guess: stageKey === "some" ? `둘의 케미 한 줄 요약 — “${a.title}”` : a.guess,   // 썸은 문구가 아래 키워드 칩과 겹쳐서 한 줄 요약으로
    chips: a.axes.map(x => x.t), badge: `${a.stage.name} 케미 점쳐보기`, note: "재미용 지수예요 · " + CARD_NOTE,
    site: cardSiteLine(), file: `mbti-${me}-x-${other}.png`
  };
}

/* ---------- 그리기 ---------- */
function cardWrap(ctx, text, maxW, maxLines){
  const words = text.split(" "), lines = [];
  let cur = "";
  const push = () => { if (cur) lines.push(cur); cur = ""; };
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width <= maxW) { cur = t; continue; }
    push();
    if (ctx.measureText(w).width <= maxW) { cur = w; continue; }
    for (const ch of w) {                      // 한 단어가 너무 길면 글자 단위로 줄바꿈
      if (ctx.measureText(cur + ch).width > maxW) push();
      cur += ch;
    }
  }
  push();
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}
function cardRound(ctx, x, y, w, h, r){
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function cardText(ctx, text, x, y, size, color, weight, align){
  ctx.font = `${weight || 600} ${size}px ${CARD_FONT}`;
  ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}
/* 알약 모양 칩들을 가운데 정렬로 한 줄에 그린다 */
function cardPills(ctx, items, cx, y, size, fill, color){
  ctx.font = `700 ${size}px ${CARD_FONT}`;
  const pad = 26, gap = 16, h = size + 28;
  const widths = items.map(t => ctx.measureText(t).width + pad * 2);
  let x = cx - (widths.reduce((s, w) => s + w, 0) + gap * (items.length - 1)) / 2;
  items.forEach((t, i) => {
    ctx.fillStyle = fill; cardRound(ctx, x, y, widths[i], h, h / 2); ctx.fill();
    cardText(ctx, t, x + widths[i] / 2, y + h / 2 + size * 0.35, size, color, 700);
    x += widths[i] + gap;
  });
}

function drawCard(ctx, spec, imgs){
  const W = CARD_W, H = CARD_H, cx = W / 2;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, spec.bg); g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = spec.main; ctx.lineWidth = 8; cardRound(ctx, 24, 24, W - 48, H - 48, 36); ctx.stroke();

  /* 위쪽 배지 */
  ctx.font = `700 34px ${CARD_FONT}`;
  const bw = ctx.measureText(spec.badge).width + 64;
  ctx.fillStyle = spec.main; cardRound(ctx, cx - bw / 2, 70, bw, 64, 32); ctx.fill();
  cardText(ctx, spec.badge, cx, 113, 34, "#ffffff", 700);

  if (spec.kind === "result") {
    ctx.drawImage(imgs.a, cx - 190, 160, 380, 380);
    ctx.save(); if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
    cardText(ctx, spec.type, cx + 5, 685, 150, spec.main, 800); ctx.restore();
    cardText(ctx, spec.name, cx, 765, 62, CARD_INK, 800);
    const hook = cardWrap(ctx, "“" + spec.hook + "”", 880, 2);
    hook.forEach((ln, i) => cardText(ctx, ln, cx, 835 + i * 54, 38, CARD_SUB, 600));
    const tagsY = 835 + (hook.length - 1) * 54 + 45;            // 문구가 1줄이든 2줄이든 간격 유지
    cardPills(ctx, spec.tags.map(t => "#" + t), cx, tagsY, 34, "#ffffff", spec.main);
    const y0 = tagsY + 60 + 70;
    spec.axes.forEach((ax, i) => {
      const y = y0 + i * 56;
      cardText(ctx, `${ax.la} ${ax.pctA}%`, 100, y, 28, CARD_INK, 700, "left");
      cardText(ctx, `${ax.pctB}% ${ax.lb}`, W - 100, y, 28, CARD_INK, 700, "right");
      ctx.fillStyle = CARD_ACCENT; cardRound(ctx, 100, y + 12, W - 200, 16, 8); ctx.fill();
      if (ax.pctA > 0) { ctx.fillStyle = spec.main; cardRound(ctx, 100, y + 12, Math.max(16, (W - 200) * ax.pctA / 100), 16, 8); ctx.fill(); }
    });
  } else {
    ctx.drawImage(imgs.a, 90, 160, 380, 380);
    ctx.drawImage(imgs.b, W - 470, 160, 380, 380);
    cardText(ctx, spec.me, 280, 625, 84, spec.main, 800);
    cardText(ctx, spec.other, W - 280, 625, 84, spec.main, 800);
    cardText(ctx, "나", 280, 675, 34, CARD_SUB, 600); cardText(ctx, "그 사람", W - 280, 675, 34, CARD_SUB, 600);
    cardText(ctx, heartsStr(spec.hearts), cx, 790, 92, CARD_HEART, 700);
    cardText(ctx, spec.label, cx, 870, 54, CARD_INK, 800);
    cardText(ctx, spec.title, cx, 920, 34, CARD_SUB, 600);
    const lines = cardWrap(ctx, spec.guess, 900, 2);
    lines.forEach((ln, i) => cardText(ctx, ln, cx, 995 + i * 52, 36, CARD_INK, 700));
    const cy = 995 + (lines.length - 1) * 52 + 50;
    cardPills(ctx, spec.chips.slice(0, 2), cx, cy, 32, "#ffffff", spec.main);
    cardPills(ctx, spec.chips.slice(2, 4), cx, cy + 76, 32, "#ffffff", spec.main);
  }

  cardText(ctx, spec.note, cx, 1290, 26, CARD_SUB, 600);
  if (spec.site) cardText(ctx, spec.site, cx, 1328, 26, spec.main, 700);
}

function svgToImage(svg){
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = rej;
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
async function renderCard(spec){
  const c = document.createElement("canvas"); c.width = CARD_W; c.height = CARD_H;
  const ctx = c.getContext("2d");
  const imgs = spec.kind === "result"
    ? {a: await svgToImage(avatar(spec.type, 380))}
    : {a: await svgToImage(avatar(spec.me, 380)), b: await svgToImage(avatar(spec.other, 380))};
  drawCard(ctx, spec, imgs);
  return c;
}

/* how: "save"(파일 저장) | "share"(모바일 공유창) */
async function saveCard(spec, btn, how){
  const label = btn.textContent; btn.disabled = true; btn.textContent = "만드는 중…";
  let msg = "✅ 저장했어요";
  try {
    const c = await renderCard(spec);
    const blob = await new Promise(res => c.toBlob(res, "image/png"));
    const file = new File([blob], spec.file, {type: "image/png"});
    if (how === "share" && navigator.canShare && navigator.canShare({files: [file]})) {
      try { await navigator.share({files: [file], title: "마음도감"}); msg = "✅ 공유했어요"; }
      catch (e) { msg = (e && e.name === "AbortError") ? label : "앗, 공유에 실패했어요"; }
    } else {
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = spec.file; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  } catch (e) { msg = "앗, 이미지를 만들지 못했어요"; }
  btn.textContent = msg;
  setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 2200);
}

/* 화면 버튼에서 호출 */
let lastResultCard = null, lastPairCard = null;
function cardResultBtn(btn, how){ if (lastResultCard) saveCard(lastResultCard, btn, how); }
function cardPairBtn(btn, how){ if (lastPairCard) saveCard(lastPairCard, btn, how); }
const canShareCard = () => typeof navigator !== "undefined" && !!navigator.share;
