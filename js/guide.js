/* 유형 가이드(목록/상세) 화면 */
/* ---------- UI ---------- */
const ORDER = Object.keys(T);
let gFilter = "ALL";

function renderGuideList(){
  $("filters").innerHTML = `<button class="chip ${gFilter==="ALL"?"on":""}" onclick="setF('ALL')">전체</button>` +
    Object.entries(GROUPS).map(([k,[nm]])=>`<button class="chip ${gFilter===k?"on":""}" onclick="setF('${k}')">${nm}</button>`).join("");
  $("grid").innerHTML = ORDER.filter(c=>gFilter==="ALL"||gOf(c)===gFilter).map(c=>
    `<button class="t g-${gOf(c)}" onclick="go('${c}')"><div class="tav">${avatar(c,72)}</div><b>${c}</b><span>${T[c].n}</span><em>“${T[c].h}”</em></button>`).join("");
}
function setF(f){ gFilter=f; renderGuideList(); }
function go(c){ location.hash = c; }

function ul(a){ return `<ul class="l">${a.map(x=>`<li>${x}</li>`).join("")}</ul>`; }

function renderDetail(c){
  const d = T[c], g = gOf(c), i = ORDER.indexOf(c);
  const prev = ORDER[(i+15)%16], next = ORDER[(i+1)%16];
  $("gdetail").innerHTML = `
  <a href="#guide">← 전체 유형 보기</a>
  <div class="hero g-${g}" style="margin-top:10px">
    <div class="tav">${avatar(c,110)}</div>
    <div class="sub">${GROUPS[g][0]}</div>
    <div class="code">${c}</div>
    <h2 style="margin:4px 0">${d.n}</h2>
    <div class="hook">“${d.h}”</div>
    <div class="badges" style="justify-content:center">${SHORT[c].tags.map(t=>`<span class="badge">#${t}</span>`).join("")}</div>
  </div>

  <details class="card" open><summary>🧠 핵심 성향</summary><p style="margin:0">${d.c}</p>
    <div class="quote">💭 속마음: ${d.q}</div></details>

  <details class="card"><summary>🔁 이 유형의 일상 습관</summary>${ul(d.hb)}
    <p class="sub" style="margin-bottom:0">몇 개나 해당되나요? 3개 이상이라면 ${c}일 가능성이 높아요.</p></details>

  <details class="card"><summary>💼 어울리는 직업</summary>
    ${d.jobs.map(([a,b])=>`<div class="job"><b>${a}</b><span>${b}</span></div>`).join("")}
    <p class="sub" style="margin-bottom:0">⚠️ ${d.jt}</p></details>

  <details class="card"><summary>💘 연애 스타일</summary>
    ${ul([`<b>스타일</b> · ${d.love.s}`,`<b>끌리는 사람</b> · ${d.love.a}`,`<b>흔한 실수</b> · ${d.love.p}`,`<b>연애 꿀팁</b> · ${d.love.t}`])}</details>

  <details class="card"><summary>📚 맞춤 학습법</summary>${ul(d.st)}
    <p class="sub" style="margin-bottom:0">⚠️ ${d.sw}</p></details>

  <div class="two">
    <div class="card"><h2>😵 스트레스 신호</h2><p style="margin:0">${d.stress.s}</p>
      <p class="sub" style="margin:8px 0 0">회복법 → ${d.stress.f}</p></div>
    <div class="card"><h2>🌱 성장 포인트</h2><p style="margin:0">${d.grow}</p></div>
  </div>

  <details class="card"><summary>🤝 케미가 좋다고 알려진 유형</summary>
    ${d.best.map(b=>`<a class="pill" href="#${b}">${b} · ${T[b].n}</a>`).join("")}
    <p class="sub" style="margin:8px 0 0">유형 궁합은 참고용일 뿐, 서로의 성숙도와 노력이 훨씬 중요합니다.</p></details>

  <div class="card cta">
    <b>나는 정말 ${c}일까?</b>
    <p class="sub">3분 간편 검사로 확인하고, 더 정확하게는 60문항 정밀 검사로.</p>
    <a class="btn pri" href="#" onclick="navTest();return false">내 MBTI 검사하기 →</a>
    <a class="btn" href="#lab/${c}/love">💘 ${c}로 연애 점쳐보기</a>
    <button class="btn" onclick="copyLink()" id="cp">🔗 이 페이지 링크 복사</button>
  </div>

  <div class="nav">
    <a class="btn" href="#${prev}">← ${prev}</a>
    <a class="btn" href="#${next}">${next} →</a>
  </div>`;
}

function copyLink(){
  const done = () => { $("cp").textContent = "✅ 복사됨"; };
  try{ navigator.clipboard.writeText(location.href).then(done,()=>prompt("링크를 복사하세요",location.href)); }
  catch(e){ prompt("링크를 복사하세요",location.href); }
}


