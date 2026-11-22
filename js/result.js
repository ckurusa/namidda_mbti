/* 결과 화면: 캐릭터 히어로 + 6칸 타일(눌러서 열어보기) + 점쳐보기 연결, 결과 복사, 이번 주 실천 과제 */
function renderResult(r,type){
  const d = T[type], sh = SHORT[type], name = d.n, g = gOf(type);
  const [, strengths, cautions] = EXTRA[type];
  const borderline = AXES.filter(([k])=>confidence(r[k].pctA)[1]).map(([k])=>k);
  const axName = k => { const a = AXES.find(x=>x[0]===k); return a[3]+" / "+a[4]; };

  let html = `
  <div class="card hero2 g-${g}">
    <div class="h2-av">${avatar(type, 128)}</div>
    <div class="h2-tx">
      <span class="tag">${MODE_NAME[mode]} 검사 결과</span>
      <p class="type">${type}</p>
      <h2>${name}</h2>
      <div class="hook">“${d.h}”</div>
      <div class="badges">${sh.tags.map(t=>`<span class="badge">#${t}</span>`).join("")}</div>
    </div>
  </div>`;

  if (mode==="quick") {
    html += `<div class="note">간편 검사는 축마다 5문항이라 오차가 있을 수 있어요. ${borderline.length? `특히 <b>${borderline.map(axName).join(", ")}</b> 축은 경계에 걸려 있어요. 해당 축만 추가 질문(축당 10문항)으로 보완하거나, 정밀 검사를 해 보세요.
      <div style="margin-top:10px"><button class="btn pri" onclick="supplement()">경계 축만 보완하기 (+${borderline.length*10}문항)</button></div>` : "선호가 비교적 뚜렷하게 나왔지만, 확실히 하고 싶다면 정밀 검사도 해 보세요."}</div>`;
  } else if (borderline.length) {
    html += `<div class="note">경계에 걸린 축(${borderline.map(k=>axName(k)).join(", ")})은 상황에 따라 두 성향을 모두 쓰는 사람일 수 있어요. 아래 팁에 두 글자가 함께 나와요.</div>`;
  }

  /* 선호 강도(컴팩트) */
  html += `<div class="card"><h2>📊 선호 강도</h2>`;
  for (const [k,a,b,la,lb] of AXES){
    const x=r[k], [cl,warn]=confidence(x.pctA);
    html += `<div class="axis sm"><div class="row"><span><b>${la}</b> ${x.pctA}%</span><span>${x.pctB}% <b>${lb}</b></span></div>
    <div class="bar"><i style="width:${x.pctA}%"></i></div>
    <div class="conf ${warn?'warn':''}">→ ${x.pick===a? la : lb} · ${cl}</div></div>`;
  }
  html += `</div>`;

  /* 6칸 타일 */
  const more = `<a class="btn sm" href="#${type}">${type} 상세 가이드</a>`;
  const bodies = {
    work: `<div class="pills">${d.jobs.map(([a])=>`<span class="pill">${a}</span>`).join("")}</div>
      <p class="sub">⚠️ ${d.jt}</p>
      <p class="mini"><b>내 결과에 맞춘 팁</b></p>${letterTips(r,"work")}
      <div class="tb-btns"><a class="btn pri sm" href="#lab/${type}/job">내 일 점쳐보기 →</a>${more}</div>`,
    love: `<ul class="l"><li><b>스타일</b> ${d.love.s}</li><li><b>흔한 실수</b> ${d.love.p}</li><li><b>꿀팁</b> ${d.love.t}</li></ul>
      <p class="mini"><b>내 결과에 맞춘 팁</b></p>${letterTips(r,"love")}
      <div class="tb-btns"><a class="btn pri sm" href="#lab/${type}/love">좋아하는 사람 넣어 점쳐보기 →</a>${more}</div>
      <p class="sub" style="margin:10px 0 0">궁합·성향은 참고용이에요. 서로를 이해하려는 노력이 훨씬 중요해요.</p>`,
    study: `<ul class="l">${d.st.map(s=>`<li>${s}</li>`).join("")}</ul>
      <p class="sub">⚠️ ${d.sw}</p>
      <p class="mini"><b>이 스타일이 빛나는 직군 TOP3</b></p>
      <div class="pills">${rankJobs(type).slice(0,3).map(x=>`<span class="pill">${x.job.icon} ${x.job.name}</span>`).join("")}</div>
      <div class="tb-btns"><a class="btn sm" href="#lab/${type}/matrix">직군 매트릭스 보기 →</a></div>`,
    stress: `<p style="margin:0">${d.stress.s}</p><p class="sub" style="margin:8px 0 0">회복법 → ${d.stress.f}</p>`,
    match: `<div class="pills">${d.best.map(b=>`<a class="pill" href="#${b}">${b} ${heartsStr(pairScore(type,b))}</a>`).join("")}</div>
      <p class="sub">통설상 잘 맞는다는 조합이에요. 재미로만 봐요!</p>
      <div class="tb-btns"><a class="btn sm" href="#lab/${type}/heat">케미 히트맵 보기 →</a></div>`,
    grow: `<div class="two"><div><b>💪 강점</b><ul class="l">${strengths.map(s=>`<li>${s}</li>`).join("")}</ul></div>
      <div><b>🌱 조심할 점</b><ul class="l">${cautions.map(s=>`<li>${s}</li>`).join("")}</ul></div></div>
      <p class="mini"><b>성장 포인트</b> · ${d.grow}</p>
      <ul class="l">${weekly(r,type).slice(0,2).map(s=>`<li>${s}</li>`).join("")}</ul>`
  };
  html += `<div class="tilehead"><b>🔓 궁금한 칸을 눌러 보세요</b><span class="sub" id="seenCnt">0/6 열어봄</span></div>
    <div class="tiles">${TILES.map(t=>`<button class="tile" data-k="${t.k}" aria-expanded="false" onclick="openTile('${t.k}')"><span class="ti">${t.icon}</span><b>${t.name}</b><span class="tz">${sh.tz[t.k]}</span><span class="peek">열어보기 ▾</span></button>`).join("")}</div>
    <div class="tilepanel hide" id="tilePanel" aria-live="polite"></div>`;
  tileBodies = bodies; tileSeen = {}; tileOpen = null;

  /* 점쳐보기 연결 */
  html += `<div class="card cta"><b>🔎 내 상황 넣고 점쳐보기</b>
    <p class="sub">좋아하는 사람의 MBTI, 지금 하는 일을 넣으면 짐작과 조언이 나와요</p>
    <div class="ctas"><a class="btn pri" href="#lab/${type}/love">💘 연애 점쳐보기</a><a class="btn" href="#lab/${type}/job">💼 내 일 점쳐보기</a><a class="btn" href="#lab/${type}/matrix">📊 직군 매트릭스</a><a class="btn" href="#lab/${type}/heat">💞 케미 히트맵</a></div></div>`;

  html += `<div class="actions">
    <button class="btn pri" id="cardBtn" onclick="cardResultBtn(this,'save')">🖼️ 이미지 저장</button>
    ${canShareCard() ? `<button class="btn" onclick="cardResultBtn(this,'share')">📤 공유</button>` : ""}
    <button class="btn" id="shareBtn" onclick="shareResult()">📋 결과 복사</button>
    <button class="btn" onclick="start('full')">${mode==="full"?"다시 검사":"정밀 검사"}</button>
    <button class="btn" onclick="home()">처음으로</button>
  </div>`;
  lastResultCard = cardSpecResult(type, r, mode);
  lastSummary = `나의 MBTI는 ${type} (${name})\n` +
    AXES.map(([k,a,b,la,lb])=>`${la} ${r[k].pctA}% : ${r[k].pctB}% ${lb}`).join("\n") +
    `\n(${MODE_NAME[mode]} 검사)`;

  $("result").innerHTML = html;
  show("result"); window.scrollTo(0,0);
}

/* 타일: 위치는 고정, 내용은 아래 패널에 열림. 같은 칸을 다시 누르면 닫힘. 열어본 칸 수를 센다 */
let tileBodies = {}, tileSeen = {}, tileOpen = null;
function openTile(k){
  const panel = $("tilePanel"), closing = (tileOpen === k);
  tileOpen = closing ? null : k;
  document.querySelectorAll(".tile").forEach(b=>{
    const key = b.getAttribute("data-k"), on = key === tileOpen;
    b.classList.toggle("on", on); b.setAttribute("aria-expanded", String(on));
    b.querySelector(".peek").textContent = on ? "접기 ▴" : (tileSeen[key] ? "다시 보기" : "열어보기 ▾");
  });
  if (closing) { panel.classList.add("hide"); return; }
  const t = TILES.find(x=>x.k===k);
  panel.innerHTML = `<h2>${t.icon} ${t.name}</h2>` + tileBodies[k];
  panel.classList.remove("hide");
  tileSeen[k] = true;
  const n = Object.keys(tileSeen).length;
  $("seenCnt").textContent = n>=TILES.length ? "🎉 전부 열어봤어요!" : `${n}/${TILES.length} 열어봄`;
  if (panel.scrollIntoView) panel.scrollIntoView({behavior:"smooth", block:"nearest"});
}

/* 결과에 맞춘 글자별 팁(한 줄씩). 경계에 걸린 축은 양쪽 글자의 팁을 모두 보여 준다 */
function tipLetters(r){
  const out = [];
  for (const [k,a,b] of AXES){ const x=r[k]; out.push(x.pick); if(confidence(x.pctA)[1]) out.push(x.pick===a? b : a); }
  return out;
}
function letterTips(r, field){
  return `<ul class="l">${tipLetters(r).map(ch=>`<li class="lt"><b>${LETTER[ch].name}</b> ${LETTER[ch][field][0]}</li>`).join("")}</ul>`;
}

let lastSummary = "";
function shareResult(){
  const ok = () => { $("shareBtn").textContent = "✅ 복사됨"; };
  try{ navigator.clipboard.writeText(lastSummary).then(ok, ()=>prompt("결과를 복사하세요", lastSummary)); }
  catch(e){ prompt("결과를 복사하세요", lastSummary); }
}

/* 가장 뚜렷한 축 → 강점 활용, 가장 약한 선호 축 → 반대편 연습 */
function weekly(r,type){
  const arr = AXES.map(([k])=>({k, d:Math.abs(r[k].pctA-50), pick:r[k].pick, other:r[k].pick===r[k].a? r[k].b : r[k].a}));
  const strong = arr.slice().sort((x,y)=>y.d-x.d)[0];
  const weak = arr.slice().sort((x,y)=>x.d-y.d)[0];
  return [
    `강점 활용: 가장 뚜렷한 ${LETTER[strong.pick].name} 성향을 살려 이번 주 중요한 일 1개를 맡아 보세요.`,
    `균형 연습: 선호가 가장 약한 축(${LETTER[weak.pick].name} ↔ ${LETTER[weak.other].name})에서 → ${LETTER[weak.pick].grow[0]}`,
    `기록하기: 하루 끝에 “에너지가 올라간 순간 / 떨어진 순간”을 한 줄씩 적어 보세요.`,
    `재검사: 2~4주 뒤 같은 모드로 다시 검사해 결과가 안정적인지 비교해 보세요.`
  ];
}
