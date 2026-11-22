/* 실행: node tests/run.js  (브라우저 없이 가짜 DOM으로 앱 로직·콘텐츠·라우팅·점쳐보기를 검증) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const html = read("index.html");

let failed = 0;
const ok = (c, m) => { if (!c) { failed++; console.log("  FAIL:", m); } };
const section = t => console.log("\n▶ " + t);
const len = s => [...s].length;

/* ---------- 0) index.html 구조 · 규칙 ---------- */
section("index.html 구조 · 규칙");
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
ok(srcs.length > 0, "script 태그 없음");
for (const s of srcs) ok(fs.existsSync(path.join(root, s)), "없는 스크립트: " + s);
ok(srcs[srcs.length - 1] === "js/app.js", "js/app.js 는 가장 마지막에 로드해야 함");
for (const d of ["js/data/types.js","js/data/short.js","js/data/lab.js","js/avatar.js","js/match.js","js/lab.js"])
  ok(srcs.includes(d) && srcs.indexOf(d) < srcs.indexOf("js/app.js"), d + " 가 app.js 보다 먼저 로드돼야 함");
const css = html.match(/<link rel="stylesheet" href="([^"]+)">/);
ok(css && fs.existsSync(path.join(root, css[1])), "스타일시트 연결/파일 없음");
ok(!/<script>[\s\S]*?\S[\s\S]*?<\/script>/.test(html), "index.html 안에 인라인 스크립트가 있음 (js/ 로 옮길 것)");
ok(!/ type="module"/.test(html), "ES module 금지 (file:// 에서 동작하지 않음)");
/* 외부 요청 금지 (SVG xmlns 는 URL 요청이 아니므로 허용) */
for (const f of ["index.html", css[1], ...srcs]) {
  const txt = read(f).replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "")
    .replace(/<meta property="og:[^>]*content="https?:\/\/[^"]*"[^>]*>/g, "");   // 배포 후 og:image 절대 주소는 허용(크롤러용 정보, 요청 아님)
  ok(!/https?:\/\//.test(txt), `${f}: 외부 URL(http/https) 발견`);
  ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(txt), `${f}: 외부 전송 코드 발견`);
}
/* index.html 이 가리키는 로컬 파일(이미지 등)은 모두 존재해야 한다 + 공유 미리보기 메타 */
for (const m of html.matchAll(/(?:src|href|content)="((?:img|css|js)\/[^"]+)"/g)) ok(fs.existsSync(path.join(root, m[1])), "없는 파일 참조: " + m[1]);
ok(/property="og:title"/.test(html) && /property="og:description"/.test(html) && /property="og:image"/.test(html), "OG 메타 태그(title/description/image)");
ok(/rel="icon"/.test(html), "파비콘");
ok(fs.existsSync(path.join(root, ".nojekyll")), ".nojekyll (GitHub Pages 용)");
/* 점쳐보기 입력값은 저장하지 않는다 */
for (const f of ["js/lab.js", "js/match.js"]) ok(!/localStorage|sessionStorage|document\.cookie/.test(read(f)), `${f}: 입력값 저장 코드 발견`);

/* ---------- 가짜 DOM + 앱 로드 ---------- */
const els = {};
const mk = () => ({ innerHTML: "", textContent: "", style: {}, classList: { _s: new Set(),
  add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
  toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } } });
const store = {};
const ctx = {
  document: { getElementById: id => els[id] || (els[id] = mk()), addEventListener() {}, querySelectorAll() { return []; } },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] },
  window: { scrollTo() {}, addEventListener() {} }, location: { hash: "" }, history: { replaceState() {} },
  navigator: {}, confirm: () => true, prompt() {}, console };
vm.createContext(ctx);
const code = srcs.map(s => read(s)).join("\n;\n");
vm.runInContext(code + `;this.api={route,T,EXTRA,LETTER,SHORT,TILES,JOBS,JOB_STUDENT,STAGES,PAIR,WPLUS,WMINUS,MOOD_TIP,MOOD_NOTE,MOODS,MINIQ,HEART_LABEL,FIT_LABEL,
  start,pick,score,supplement,resume,readProgress,avatar,cardSpecResult,cardSpecPair,drawCard,cardWrap,cardSiteLine,CARD_W,CARD_H,pairScore,pairAdvice,jobFit,jobAdvice,rankJobs,heartsStr,
  labState,renderLab,labSet,labQuiz,labTab,labPair,labJobCell,openTile,get tileBodies(){return tileBodies},
  get state(){return{mode,qs,ans,idx}},get last(){return lastSummary},Q,AXES,KEYS:Object.keys(T)}`, ctx);
const A = ctx.api;

/* ---------- 1) 문항 구성 ---------- */
section("문항 구성");
for (const [k] of A.AXES) {
  ok(A.Q[k].length === 15, `${k} 문항이 15개가 아님`);
  ok(A.Q[k].filter(q => q[2]).length === 5, `${k} 간편 문항이 5개가 아님`);
  const dirs = {}; A.Q[k].forEach(q => dirs[q[1]] = (dirs[q[1]] || 0) + 1);
  ok(Object.values(dirs).every(v => v >= 6 && v <= 9), `${k} 방향 균형: ${JSON.stringify(dirs)}`);
}
ok(new Set(Object.values(A.Q).flat().map(q => q[0])).size === 60, "중복 문항 존재");

/* ---------- 2) 16유형 모두 도달 가능 ---------- */
section("채점: 16유형 도달 (간편/정밀)");
for (const mode of ["quick", "full"]) for (const t of A.KEYS) {
  A.start(mode); const n = A.state.qs.length;
  ok(n === (mode === "full" ? 60 : 20), `${mode} 문항 수 ${n}`);
  for (let i = 0; i < n; i++) A.pick(t.includes(A.state.qs[i].d) ? 4 : 0);
  ok(A.last.startsWith("나의 MBTI는 " + t), `${mode} ${t} → ${A.last.split("\n")[0]}`);
  ok(A.labState.my === t, `${t} 결과가 점쳐보기 '내 MBTI'로 전달되지 않음`);
}

/* ---------- 3) 경계 축 보완 / 이어하기 ---------- */
section("보완 · 이어하기");
A.start("quick"); for (let i = 0; i < 20; i++) A.pick(2);
ok(els.result.innerHTML.includes("경계 축만 보완하기 (+40문항)"), "보완 버튼 없음");
A.supplement();
ok(A.state.qs.length === 60 && A.state.mode === "plus", "보완 후 60문항/plus 아님");
ok(new Set(A.state.qs.map(q => q.t)).size === 60, "보완 문항 중복");
for (let i = 20; i < 60; i++) A.pick(4);
ok(/간편\+보완/.test(A.last), "보완 결과 요약");
A.start("quick"); A.state.qs.forEach(q => A.pick(q.axis === "EI" ? 2 : (["E","S","T","J"].includes(q.d) ? 4 : 0)));
ok(els.result.innerHTML.includes("+10문항"), "경계 축 1개일 때 +10문항");
A.start("full"); A.pick(3); A.pick(1); A.pick(4);
const p = A.readProgress(); ok(p && p.idx === 3 && p.ans.filter(x => x !== null).length === 3, "진행 저장");
const saved = JSON.stringify(p);
A.start("quick"); store.mbti_prog = saved;
A.resume(); ok(A.state.mode === "full" && A.state.idx === 3 && A.state.ans.filter(x => x !== null).length === 3, "이어하기 복원");
store.mbti_prog = "{broken"; ok(A.readProgress() === null, "손상된 저장본은 무시");

/* ---------- 4) 콘텐츠 완전성 · 분량(압축) ---------- */
section("콘텐츠 · 분량");
const fields = ["n","h","c","hb","q","jobs","jt","love","st","sw","stress","grow","best"];
ok(A.KEYS.length === 16 && Object.keys(A.EXTRA).length === 16 && Object.keys(A.SHORT).length === 16, "유형 16개/EXTRA/SHORT 16개 아님");
for (const k of A.KEYS) {
  const t = A.T[k];
  for (const f of fields) ok(t[f] && (!Array.isArray(t[f]) || t[f].length), `${k}.${f} 비어 있음`);
  for (const f of ["s","a","p","t"]) ok(t.love[f], `${k}.love.${f}`);
  ok(t.jobs.length >= 4, `${k} 직업 4개 미만`);
  for (const b of t.best) ok(A.T[b], `${k} 궁합에 없는 유형 ${b}`);
  ok(A.EXTRA[k] && A.EXTRA[k].length === 3 && A.EXTRA[k][1].length && A.EXTRA[k][2].length, `${k} EXTRA`);
  const sh = A.SHORT[k];
  ok(sh.tags.length === 3 && sh.tags.every(x => x && len(x) <= 8), `${k} 태그는 3개, 각 8자 이내: ${sh.tags}`);
  for (const tl of A.TILES) ok(sh.tz[tl.k] && len(sh.tz[tl.k]) <= 30, `${k} 티저(${tl.k}) 30자 이내: '${sh.tz[tl.k]}' (${sh.tz[tl.k] && len(sh.tz[tl.k])})`);
}
ok(A.TILES.length === 6, "타일은 6칸");
for (const l of "ESNTFJIP") ok(A.LETTER[l] && ["life","work","love","grow"].every(f => A.LETTER[l][f] && A.LETTER[l][f].length), `LETTER.${l} (life/work/love/grow)`);
/* 점쳐보기 문구 길이 */
const LIM = 50;
const tooLong = (s, w) => ok(typeof s === "string" && s && len(s) <= LIM, `${w}: ${LIM}자 초과/비어 있음 '${s}' (${s && len(s)})`);
for (const l of "ESNTFJIP") { tooLong(A.WPLUS[l], "WPLUS." + l); tooLong(A.WMINUS[l], "WMINUS." + l); }
for (const [k, v] of Object.entries(A.MOOD_TIP)) for (const [lv, s] of Object.entries(v)) tooLong(s, `MOOD_TIP.${k}.${lv}`);
for (const st of A.STAGES) for (const l of "ESNTFJIP") tooLong(st.tips[l], `STAGES.${st.k}.${l}`);
for (const [ax, v] of Object.entries(A.PAIR)) for (const [k, [t, d]] of Object.entries(v)) { tooLong(t, `PAIR.${ax}.${k}.title`); tooLong(d, `PAIR.${ax}.${k}.desc`); }
ok(A.STAGES.length === 5 && A.JOBS.length === 12 && A.MINIQ.length === 4, "상황 5 · 직군 12 · 미니퀴즈 4");
for (const j of A.JOBS) tooLong(j.about, "JOBS.about " + j.id);

/* ---------- 4-2) 톤 검사 (CLAUDE.md: 비하·결정론 금지, 재미용 표기, 존중 문구) ---------- */
section("톤 · 안전 문구");
const BAN_SLUR = /효율충|급식충|맘충|벌레|한남|김치녀|틀딱|찐따|폐급|븅신|병신/;
const BAN_DETERMINISM = /안 ?맞는 (유형|사이|조합)|최악의 (조합|궁합)|절대 안 ?돼|헤어지[는게]|운명의|100% ?(맞|확실)/;
for (const f of ["js/data/short.js","js/data/lab.js","js/data/letters.js","js/data/types.js","js/match.js","js/lab.js","js/result.js"]) {
  const txt = read(f);
  ok(!BAN_SLUR.test(txt), `${f}: 비하성 표현 '${(txt.match(BAN_SLUR)||[])[0]}'`);
  ok(!BAN_DETERMINISM.test(txt), `${f}: 결정론 표현 '${(txt.match(BAN_DETERMINISM)||[])[0]}'`);
}
for (const st of A.STAGES) tooLong(st.care, "STAGES.care." + st.k);
ok(A.MOOD_NOTE.think && A.MOOD_NOTE.tired && A.MOOD_NOTE.fun === "", "MOOD_NOTE: think/tired 는 주의 문구, fun 은 비어 있어야 함");
for (const k of ["think","tired"]) tooLong(A.MOOD_NOTE[k], "MOOD_NOTE." + k);
ok(A.STAGES.find(s => s.k === "crush").care.includes("부담스러워"), "짝사랑 조언에 상대가 부담스러워하면 속도를 늦추라는 문구");
ok(/재미용/.test(read("js/lab.js")) && /참고만 하고, 상대와 직접 대화/.test(read("js/lab.js")), "lab.js 에 재미용·직접 대화 안내 유지");
/* 모든 축이 같은 권태기는 '닮아서 신선함이 줄었다'로 안내 (축 이름을 억지로 끌어오지 않음) */
ok(A.pairAdvice("ENFP", "ENFP", "slump").guess.includes("너무 닮은"), "같은 유형 권태기 문구");
ok(!A.pairAdvice("ENFP", "ISTJ", "slump").guess.includes("너무 닮은"), "다른 유형 권태기 문구");

/* ---------- 5) 캐릭터(SVG) ---------- */
section("캐릭터 SVG");
const norm = s => s.replace(/avc\d+/g, "");
const svgs = A.KEYS.map(k => norm(A.avatar(k, 96)));
ok(new Set(svgs).size === 16, "16유형 캐릭터가 모두 서로 달라야 함");
A.KEYS.forEach((k, i) => { ok(svgs[i].startsWith("<svg") && svgs[i].endsWith("</svg>"), `${k} SVG 형식`); ok(svgs[i].includes(`aria-label="${k} 캐릭터"`), `${k} 접근성 라벨`); });
ok(!/undefined|NaN/.test(svgs.join("")), "SVG 에 undefined/NaN");

/* ---------- 5-1) 공유 이미지 카드 ---------- */
section("공유 이미지 카드");

/* canvas 를 흉내 내는 기록용 ctx: 글자 폭은 한글 1em, 그 외 0.6em 으로 넉넉하게 추정 */
const mkCtx = () => {
  const calls = [], c = { font: "20px x", calls };
  const wOf = (t, font) => { const px = +(font.match(/(\d+)px/) || [0, 20])[1]; return [...t].reduce((s, ch) => s + (/[가-힣“”…]/.test(ch) ? px : px * 0.6), 0); };
  c.measureText = t => ({ width: wOf(t, c.font) });
  c.createLinearGradient = () => ({ addColorStop() {} });
  for (const m of ["fillRect","beginPath","moveTo","arcTo","closePath","stroke","fill","drawImage","save","restore"]) c[m] = (...a) => calls.push([m, ...a]);
  c.fillText = (t, x, y) => calls.push(["fillText", t, x, y, wOf(t, c.font)]);
  return c;
};
const fakeImgs = { a: {}, b: {} };
const checkCard = (spec, name) => {
  const ctx2 = mkCtx();
  try { A.drawCard(ctx2, spec, fakeImgs); } catch (e) { ok(false, name + " 그리기 중 오류: " + e.message); return; }
  const texts = ctx2.calls.filter(c => c[0] === "fillText");
  ok(texts.length >= 6, name + " 글자 수가 너무 적음");
  ok(!texts.some(t => /undefined|NaN|null/.test(t[1])), name + " 에 undefined/NaN/null 글자");
  ok(ctx2.calls.filter(c => c[0] === "drawImage").length === (spec.kind === "pair" ? 2 : 1), name + " 캐릭터 이미지 수");
  const body = texts.slice(0, -2);                          // 마지막 2개는 하단 고지·주소
  ok(body.every(t => t[4] <= A.CARD_W - 80 || t[1].length <= 1), name + " 글자가 카드 폭을 넘음: " + body.filter(t => t[4] > A.CARD_W - 80).map(t => t[1]).join("|"));
  ok(body.every(t => t[3] <= 1240), name + " 본문이 하단 고지 영역을 침범 (y=" + Math.max(...body.map(t => t[3])) + ")");
  ok(texts.some(t => t[1].includes("MBTI®")), name + " 고지 문구(공식 MBTI® 아님)");
};
for (const t of A.KEYS) {
  const r = {}; A.AXES.forEach(([k, a, b], i) => { const pa = 100 - i * 13 - (t.charCodeAt(i) % 7) * 5; r[k] = { pctA: pa, pctB: 100 - pa }; });
  const spec = A.cardSpecResult(t, r, "full");
  ok(spec.file === `mbti-${t}.png` && spec.name === A.T[t].n && spec.tags.length === 3 && spec.axes.length === 4, t + " 결과 카드 spec");
  checkCard(spec, t + " 결과 카드");
}
for (const a of A.KEYS) for (const b of A.KEYS) for (const st of A.STAGES) {
  const spec = A.cardSpecPair(a, b, st.k);
  if (!(spec.hearts >= 1 && spec.hearts <= 5 && spec.chips.length === 4 && spec.guess && spec.file === `mbti-${a}-x-${b}.png`)) ok(false, `${a}×${b}/${st.k} 케미 카드 spec`);
  if (a === "ENFP" || b === "ENFP") checkCard(spec, `${a}×${b}/${st.k} 케미 카드`);
}
/* 줄바꿈: 긴 한 단어도 폭 안에 들어오고, 줄 수 상한과 말줄임을 지킨다 */
{
  const c = mkCtx(); c.font = "600 38px x";
  const lines = A.cardWrap(c, "가나다라마바사 ".repeat(30), 880, 2);
  ok(lines.length === 2 && lines[1].endsWith("…"), "긴 문장은 2줄 + 말줄임: " + lines.length);
  ok(lines.every(l => c.measureText(l).width <= 880), "줄바꿈 후 폭 초과");
  const one = A.cardWrap(c, "짧은 문장", 880, 2); ok(one.length === 1 && one[0] === "짧은 문장", "짧은 문장은 1줄");
  const longWord = A.cardWrap(c, "가".repeat(60), 880, 3); ok(longWord.length === 3 && longWord.every(l => c.measureText(l).width <= 880), "공백 없는 긴 단어도 글자 단위로 줄바꿈");
}
/* file:// 에서는 주소를 적지 않는다 */
ok(A.cardSiteLine() === "", "file/무프로토콜 환경에서는 주소 비움");

/* ---------- 6) 결과 화면 (히어로 · 6칸 타일 · 점쳐보기 연결) ---------- */
section("결과 화면");
const tileBody = (h, k) => A.tileBodies[k];      // 타일 내용은 클릭 시 아래 패널에 열린다
const ltCount = s => s.split('<li class="lt">').length - 1;
for (const t of A.KEYS) {
  A.start("full"); A.state.qs.forEach(q => A.pick(t.includes(q.d) ? 4 : 0));
  const h = els.result.innerHTML;
  ok(h.includes("<svg") && h.includes(A.T[t].n) && h.includes(`>${t}<`), `${t} 히어로(캐릭터·이름·코드)`);
  for (const tag of A.SHORT[t].tags) ok(h.includes("#" + tag), `${t} 태그 #${tag}`);
  for (const tl of A.TILES) ok(h.includes(`data-k="${tl.k}"`) && h.includes(A.SHORT[t].tz[tl.k]), `${t} 타일 ${tl.k}/티저`);
  ok(h.split('class="tile"').length - 1 === 6, `${t} 타일 6칸`);
  const work = tileBody(h, "work"), love = tileBody(h, "love"), study = tileBody(h, "study"), match = tileBody(h, "match");
  for (const [job] of A.T[t].jobs) ok(work.includes(job), `${t} 직장 타일에 '${job}' 없음`);
  ok(work.includes(A.T[t].jt), `${t} 직장 주의 문구`);
  ok(love.includes(A.T[t].love.t) && love.includes(A.T[t].love.p) && love.includes(A.T[t].love.s), `${t} 연애 타일 내용`);
  ok(ltCount(work) === 4 && ltCount(love) === 4, `${t} 뚜렷한 결과는 글자 팁 4개씩 (work ${ltCount(work)}, love ${ltCount(love)})`);
  for (const x of A.rankJobs(t).slice(0, 3)) ok(study.includes(x.job.name), `${t} 학습 타일에 어울리는 직군 '${x.job.name}'`);
  for (const b of A.T[t].best) ok(match.includes(`#${b}"`), `${t} 케미 타일에 ${b}`);
  for (const l of ["love","job","matrix","heat"]) ok(h.includes(`href="#lab/${t}/${l}"`), `${t} 점쳐보기 링크 ${l}`);
  ok(!/undefined|NaN/.test(h + Object.values(A.tileBodies).join("")), `${t} 결과 화면에 undefined/NaN`);
  ok(Object.keys(A.tileBodies).length === 6, `${t} 타일 내용 6개`);
}
/* 타일 열기/닫기/카운트 */
A.start("full"); A.state.qs.forEach(q => A.pick(["E","N","F","P"].includes(q.d) ? 4 : 0));
ok(els.result.innerHTML.includes('class="tilepanel hide" id="tilePanel"'), "처음엔 패널이 닫혀 있어야 함");
A.openTile("work");
ok(!els.tilePanel.classList.contains("hide") && els.tilePanel.innerHTML.includes("직장") && els.tilePanel.innerHTML.includes(A.T.ENFP.jobs[0][0]), "타일 열기 → 패널에 내용");
ok(els.seenCnt.textContent === "1/6 열어봄", "열어본 칸 1/6: " + els.seenCnt.textContent);
A.openTile("work"); ok(els.tilePanel.classList.contains("hide"), "같은 칸 다시 누르면 닫힘");
A.openTile("love"); ok(els.tilePanel.innerHTML.includes("연애") && els.seenCnt.textContent === "2/6 열어봄", "다른 칸으로 교체 + 카운트 2/6");
A.openTile("work"); ok(els.seenCnt.textContent === "2/6 열어봄", "이미 본 칸은 카운트 증가 없음");
["study","stress","match","grow"].forEach(k => A.openTile(k));
ok(els.seenCnt.textContent.includes("전부 열어봤어요"), "6칸 모두 열면 축하 문구: " + els.seenCnt.textContent);
A.start("full"); A.state.qs.forEach(q => A.pick(q.axis === "EI" ? 2 : (["E","S","T","J"].includes(q.d) ? 4 : 0)));   // 아래 경계 축 테스트용 결과로 복원

/* 경계에 걸린 축은 양쪽 글자 팁을 모두 보여 줘야 한다 */
A.start("full"); A.state.qs.forEach(q => A.pick(q.axis === "EI" ? 2 : (["E","S","T","J"].includes(q.d) ? 4 : 0)));
{
  const h = els.result.innerHTML, work = tileBody(h, "work");
  ok(ltCount(work) === 5, `경계 축 1개 → 직장 팁 5개 (실제 ${ltCount(work)})`);
  ok(work.includes("외향(E)") && work.includes("내향(I)"), "경계 축의 두 글자 모두 표시");
}

/* ---------- 7) 점쳐보기 계산 (케미 · 직군) ---------- */
section("점쳐보기 계산");
const row = a => A.KEYS.map(b => A.pairScore(a, b));
for (const a of A.KEYS) {
  for (const b of A.KEYS) {
    const n = A.pairScore(a, b);
    ok(Number.isInteger(n) && n >= 1 && n <= 5, `케미 ${a}×${b} 범위 ${n}`);
    ok(n === A.pairScore(b, a), `케미 비대칭 ${a}×${b}`);
  }
  ok(new Set(row(a)).size >= 3, `${a} 케미가 너무 한쪽으로 쏠림: ${row(a)}`);
}
for (const j of A.JOBS) {
  const lv = A.KEYS.map(t => A.jobFit(t, j.id));
  ok(lv.every(n => Number.isInteger(n) && n >= 1 && n <= 5), `${j.id} 적합도 범위`);
  ok(new Set(lv).size >= 3, `${j.id} 적합도가 너무 한쪽으로 쏠림: ${[...new Set(lv)]}`);
}
for (const t of A.KEYS) {
  const rk = A.rankJobs(t);
  ok(rk.length === 12 && rk[0].fit >= rk[11].fit, `${t} 직군 순위`);
  ok(rk[0].fit >= 4, `${t} 1위 직군 적합도가 4 이상이어야 함 (${rk[0].fit})`);
}
let adviceCount = 0;
for (const a of A.KEYS) for (const b of A.KEYS) for (const st of A.STAGES) {
  const r = A.pairAdvice(a, b, st.k); adviceCount++;
  const flat = JSON.stringify(r);
  ok(!/undefined|NaN|null/.test(flat), `연애 조언 ${a}×${b}/${st.k} 에 undefined`);
  ok(r.axes.length === 4 && r.partnerTips.length === 4 && r.guess && r.mine && r.title && r.heartLabel, `연애 조언 구성 ${a}×${b}/${st.k}`);
  ok(r.hearts === A.pairScore(a, b), "하트 일치");
}
ok(adviceCount === 1280, "연애 조언 16×16×5 = 1280");
for (const t of A.KEYS) for (const j of A.JOBS) for (const m of A.MOODS) {
  const r = A.jobAdvice(t, j.id, m.k);
  ok(!/undefined|NaN/.test(JSON.stringify(r)), `직군 조언 ${t}/${j.id}/${m.k} 에 undefined`);
  ok(r.fit === A.jobFit(t, j.id) && r.moodTip && r.alts.length === 3 && !r.alts.some(x => x.job.id === j.id), `직군 조언 구성 ${t}/${j.id}`);
}
ok(A.jobAdvice("INFP", "student", "fun").student === true && A.jobAdvice("INFP", "student", "fun").top.length === 3, "학생·취준 경로");
ok(A.heartsStr(3) === "♥♥♥♡♡", "하트 문자열");

/* ---------- 8) 점쳐보기 화면 (탭 · 입력 흐름) ---------- */
section("점쳐보기 화면");
const labHtml = () => els.lab.innerHTML;
A.labState.my = null; A.labState.other = ""; A.labState.job = "";
delete store.mbti_hist;                              // 기록이 없으면 내 MBTI 를 고르라고 안내
A.renderLab("", "love");
ok(labHtml().includes("먼저 위에서") , "내 MBTI 없을 때 안내");
A.start("quick"); A.state.qs.forEach(q => A.pick(["I","N","F","P"].includes(q.d) ? 4 : 0));   // INFP 결과를 만들면
A.labState.my = null; A.renderLab("", "love");
ok(A.labState.my === "INFP", "최근 검사 기록의 유형이 내 MBTI 로 자동 사용돼야 함");
A.labState.my = null;
A.renderLab("ENFP", "love");
ok(A.labState.my === "ENFP" && labHtml().includes("그 사람의 MBTI를 고르면"), "내 MBTI 지정 후 상대 선택 안내");
A.labSet("other", "ISTJ"); A.labSet("stage", "some");
ok(labHtml().includes("케미 지수") && labHtml().includes("ENFP") && labHtml().includes("ISTJ") && labHtml().includes("재미용"), "연애 결과 카드");
ok(labHtml().includes("참고만 하고, 상대와 직접 대화"), "연애 면책 문구");
A.labSet("other", "?");
ok(labHtml().includes("4문항") || labHtml().includes("그 사람의 대화는"), "미니퀴즈 표시");
["E","S","T","J"].forEach((l, i) => A.labQuiz(i, l));
ok(labHtml().includes("짐작해 본 그 사람의 유형은 <b>ESTJ</b>"), "미니퀴즈 결과 ESTJ");
A.renderLab("INTJ", "job");
ok(labHtml().includes("직군을 고르면 결과가"), "직군 선택 안내");
for (const j of [...A.JOBS.map(j => j.id), "student"]) for (const m of ["fun","tired","think"]) {
  A.labSet("job", j); A.labSet("mood", m);
  ok(!/undefined|NaN/.test(labHtml()), `내 일 화면 ${j}/${m} 에 undefined`);
}
A.labSet("job", "dev");
ok(labHtml().includes("적합도") && labHtml().includes("재미용 지수") && labHtml().includes("내 강점"), "직군 결과 카드");
A.renderLab("ISFJ", "matrix");
ok((labHtml().match(/<td class="c /g) || []).length === 192, "직군 매트릭스 192칸 (12×16)");
ok(labHtml().includes("ISFJ의 TOP3"), "매트릭스 내 TOP3");
A.renderLab("ISFJ", "heat");
ok((labHtml().match(/<td class="c /g) || []).length === 256, "케미 히트맵 256칸 (16×16)");
ok(!/undefined|NaN/.test(labHtml()), "히트맵 undefined");
A.labPair("ENTP", "INFJ");
ok(A.labState.tab === "love" && A.labState.my === "ENTP" && A.labState.other === "INFJ" && labHtml().includes("케미 지수"), "히트맵 칸 → 연애 결과");
A.labJobCell("sales", "ESTP");
ok(A.labState.tab === "job" && A.labState.job === "sales" && A.labState.my === "ESTP", "매트릭스 칸 → 직군 결과");

/* 존중 문구가 화면에 나온다 */
A.renderLab("ENFP","love"); A.labSet("other","ISTJ"); A.labSet("stage","crush");
ok(labHtml().includes("속도를 늦추는 게 먼저"), "짝사랑 화면에 존중 문구");
A.labSet("stage","slump"); ok(labHtml().includes("둘이 같이 풀어 가요"), "권태기 화면에 문구");
A.renderLab("ENFP","job"); A.labSet("job","dev"); A.labSet("mood","think");
ok(labHtml().includes("재미용 점수보다 현실 상황"), "이직 고민 화면에 큰 결정 주의 문구");
A.labSet("mood","tired"); ok(labHtml().includes("휴식이 먼저"), "지침 화면에 휴식 문구");
A.labSet("mood","fun"); ok(!labHtml().includes('class="care"'), "즐거움 상태에는 주의 박스 없음");

/* ---------- 9) 라우팅 ---------- */
section("라우팅");
const shown = () => ["home","quiz","result","glist","gdetail","lab"].filter(i => !els[i].classList.contains("hide"));
const nav = () => ["nTest","nLab","nGuide"].filter(i => els[i].classList.contains("on"));
const go = h => { ctx.location.hash = h; A.route(); };
go(""); ok(shown().join() === "home" && nav().join() === "nTest", "빈 해시 → home");
go("#guide"); ok(shown().join() === "glist" && nav().join() === "nGuide", "#guide → 목록");
ok(els.grid.innerHTML.split('class="t g-').length - 1 === 16, "목록 카드 16개 아님");
ok(els.grid.innerHTML.split("<svg").length - 1 === 16, "목록 카드마다 캐릭터");
for (const k of A.KEYS) {
  go("#" + k.toLowerCase());
  const h = els.gdetail.innerHTML;
  ok(shown().join() === "gdetail" && h.includes(A.T[k].n) && h.includes("<svg"), `#${k} 상세`);
  ok(h.split("<details").length === h.split("</details>").length && h.split("<details").length - 1 === 6, `#${k} 접이식 6개`);
  ok(h.includes(`href="#lab/${k}/love"`), `#${k} 점쳐보기 링크`);
}
go("#XXXX"); ok(shown().join() === "home", "알 수 없는 해시 → home");
go("#lab"); ok(shown().join() === "lab" && nav().join() === "nLab", "#lab → 점쳐보기");
go("#lab/enfp/heat"); ok(A.labState.my === "ENFP" && A.labState.tab === "heat" && labHtml().includes("케미 히트맵"), "#lab/enfp/heat");
go("#lab//matrix"); ok(A.labState.tab === "matrix" && shown().join() === "lab", "#lab//matrix");
go("#lab/ZZZZ/bogus"); ok(shown().join() === "lab" && A.labState.tab === "matrix" && A.labState.my === "ENFP", "잘못된 파라미터는 무시");
go("#LAB/INTJ/JOB"); ok(A.labState.my === "INTJ" && A.labState.tab === "job", "대소문자 무시");

/* ---------- 10) HTML id 참조 무결성 ---------- */
section("HTML id 참조");
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const dynamic = new Set(["shareBtn", "cp", "seenCnt", "tilePanel"]);   // 렌더링 시 동적으로 생기는 요소
for (const s of srcs) for (const m of read(s).matchAll(/\$\("([^"]+)"\)/g)) ok(ids.has(m[1]) || dynamic.has(m[1]), `${s}: $("${m[1]}") 가 HTML에 없음`);
for (const id of ["nTest","nLab","nGuide","lab","glist","gdetail","home","quiz","result"]) ok(ids.has(id), `HTML 에 #${id} 없음`);

console.log(failed ? `\n❌ 실패 ${failed}건` : "\n✅ 모든 테스트 통과");
process.exit(failed ? 1 : 0);
