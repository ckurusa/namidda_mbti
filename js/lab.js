/* 점쳐보기 화면(#lab): 연애 / 내 일 / 직군 매트릭스 / 케미 히트맵
   입력값(상대 MBTI·직군·상황)은 메모리에만 두고 저장·전송하지 않는다 */
const labState = {my:null, tab:"love", stage:"crush", other:"", quiz:[null,null,null,null], job:"", mood:"fun"};
const LAB_TABS = [["love","💘 연애"],["job","💼 내 일"],["matrix","📊 직군 매트릭스"],["heat","💞 케미 히트맵"]];
const dotsStr = n => "●".repeat(n) + "○".repeat(5-n);

/* 라우터에서 호출: #lab / #lab/ENFP / #lab/ENFP/love|job|matrix|heat */
function renderLab(type, tab){
  if (T[type]) labState.my = type;
  if (!labState.my) { const h = loadHistory()[0]; if (h && T[h.type]) labState.my = h.type; }
  if (LAB_TABS.some(t=>t[0]===tab)) labState.tab = tab;
  labRender();
}

function labSyncHash(){
  try{ history.replaceState(null, "", "#lab/" + (labState.my || "-") + "/" + labState.tab); }catch(e){}
}
function labSet(k, v){ labState[k] = v; if (k==="other" && v!=="?") labState.quiz=[null,null,null,null]; labRender(); }
function labTab(t){ labState.tab = t; labSyncHash(); labRender(); }
function labQuiz(i, letter){ labState.quiz[i] = letter; labRender(); }
function labPair(me, other){ labState.my = me; labState.other = other; labState.tab = "love"; labSyncHash(); labRender(); window.scrollTo(0,0); }
function labJobCell(jobId, type){ labState.my = type; labState.job = jobId; labState.tab = "job"; labSyncHash(); labRender(); window.scrollTo(0,0); }

const typeOptions = (sel, ph) => `<option value="">${ph}</option>` + Object.keys(T).map(k=>`<option value="${k}" ${k===sel?"selected":""}>${k} · ${T[k].n}</option>`).join("");

function labRender(){
  const S = labState;
  let h = `<h1>🔎 점쳐보기</h1>
    <p class="sub">내 MBTI와 상황을 넣으면 짐작과 조언이 나와요. 재미용이니 가볍게 즐겨 주세요!</p>
    <div class="card mypick">
      <div class="mp-av">${S.my ? avatar(S.my, 64) : '<div class="av-empty">?</div>'}</div>
      <div class="mp-in">
        <label class="sub" for="myType">내 MBTI</label>
        <select id="myType" onchange="labSet('my',this.value||null)">${typeOptions(S.my, "선택해 주세요")}</select>
        ${S.my ? "" : `<div class="sub" style="margin-top:4px">모르겠다면 <a href="#" onclick="navTest();return false">3분 검사</a>부터!</div>`}
      </div>
    </div>
    <div class="tabs" role="tablist">${LAB_TABS.map(([k,n])=>`<button class="tab ${S.tab===k?"on":""}" role="tab" aria-selected="${S.tab===k}" onclick="labTab('${k}')">${n}</button>`).join("")}</div>`;
  h += S.tab==="love" ? labLove() : S.tab==="job" ? labJob() : S.tab==="matrix" ? labMatrix() : labHeat();
  h += `<p class="sub" style="margin-top:18px">🔒 입력한 내용은 이 기기 밖으로 나가지 않고 저장되지도 않아요. · 지수는 재미용이며 과학적으로 검증된 점수가 아니에요.</p>`;
  $("lab").innerHTML = h;
  labScrollToMe();
}

/* 매트릭스·히트맵에서 내 유형 열이 화면 안에 오도록 가로 스크롤 */
function labScrollToMe(){
  if (!document.querySelector) return;
  const th = document.querySelector(".mx th.me"), wrap = document.querySelector(".mxwrap");
  if (th && wrap) wrap.scrollLeft = Math.max(0, th.offsetLeft - 90);
}

const needMy = () => `<div class="card note">먼저 위에서 <b>내 MBTI</b>를 골라 주세요 👆</div>`;

/* ---------- 💘 연애 ---------- */
function labLove(){
  const S = labState;
  if (!S.my) return needMy();
  let h = `<div class="card"><h2>💘 그 사람과 나, 점쳐볼까요?</h2>
    <div class="sub" style="margin:0 0 6px">지금 상황은?</div>
    <div class="chips">${STAGES.map(s=>`<button class="chip ${S.stage===s.k?"on":""}" onclick="labSet('stage','${s.k}')">${s.icon} ${s.name}</button>`).join("")}</div>
    <label class="sub" for="otherType" style="display:block;margin:12px 0 4px">그 사람의 MBTI</label>
    <select id="otherType" onchange="labSet('other',this.value)">
      ${typeOptions(S.other, "선택해 주세요")}
      <option value="?" ${S.other==="?"?"selected":""}>잘 모르겠어요 (4문항으로 짐작해 볼래요)</option>
    </select>`;
  let other = S.other;
  if (other === "?") {
    h += `<div class="miniq">` + MINIQ.map((m,i)=>`<div class="mq"><div class="mq-q">${i+1}. ${m.q}</div>
      <div class="chips">${[m.a, m.b].map(([txt,l])=>`<button class="chip ${S.quiz[i]===l?"on":""}" onclick="labQuiz(${i},'${l}')">${txt}</button>`).join("")}</div></div>`).join("") + `</div>`;
    other = S.quiz.every(Boolean) ? miniType(S.quiz) : "";
    if (other) h += `<div class="note">🕵️ 짐작해 본 그 사람의 유형은 <b>${other}</b> (${T[other].n})! 정확하지 않을 수 있어요.</div>`;
  }
  h += `</div>`;
  if (!other) return h + `<div class="card note">그 사람의 MBTI를 고르면 결과가 나와요 ✨</div>`;

  const a = pairAdvice(S.my, other, S.stage);
  lastPairCard = cardSpecPair(S.my, other, S.stage);
  h += `<div class="card pairres">
    <div class="pairhdr">
      <div class="pc">${avatar(S.my, 78)}<b>${S.my}</b><span>나</span></div>
      <div class="pmid"><div class="hearts" aria-label="케미 지수 ${a.hearts}/5">${heartsStr(a.hearts)}</div><b>${a.heartLabel}</b><span class="sub">${a.title}<br>재미용 지수</span></div>
      <div class="pc">${avatar(other, 78)}<b>${other}</b><span>그 사람</span></div>
    </div>
    <div class="note">🔮 ${a.guess}</div>
    <h3 class="sec">🧩 우리 사이 4가지 키워드</h3>
    <div class="kws">${a.axes.map(x=>`<div class="kw ${x.same?"same":"diff"}"><span class="kax">${x.me}${x.same?"=":"↔"}${x.other}</span><b>${x.t}</b><span>${x.d}</span></div>`).join("")}</div>
    <h3 class="sec">${a.stage.icon} ${a.stage.name}일 때, 그 사람은 이런 편이에요 <span class="sub">(짐작)</span></h3>
    <ul class="l">${a.partnerTips.map(p=>`<li><b>${LETTER[p.ch].name}</b> ${p.tip}</li>`).join("")}</ul>
    <p class="care">💡 ${a.care}</p>
    <h3 class="sec">🙋 내가 챙길 한 가지</h3>
    <p style="margin:0">${a.mine}</p>
    <p class="sub" style="margin:14px 0 0">사람은 MBTI보다 훨씬 복잡해요. 참고만 하고, 상대와 직접 대화하는 게 우선이에요.</p>
    <div class="tb-btns"><button class="btn pri sm" onclick="cardPairBtn(this,'save')">🖼️ 케미 카드 저장</button>${canShareCard() ? `<button class="btn sm" onclick="cardPairBtn(this,'share')">📤 공유</button>` : ""}</div>
  </div>`;
  return h;
}

/* ---------- 💼 내 일 ---------- */
function labJob(){
  const S = labState;
  if (!S.my) return needMy();
  let h = `<div class="card"><h2>💼 지금 하는 일은?</h2>
    <select id="jobSel" onchange="labSet('job',this.value)" aria-label="직군 선택">
      <option value="">직군을 골라 주세요</option>
      ${JOBS.map(j=>`<option value="${j.id}" ${S.job===j.id?"selected":""}>${j.icon} ${j.name} (${j.ex})</option>`).join("")}
      <option value="${JOB_STUDENT.id}" ${S.job===JOB_STUDENT.id?"selected":""}>${JOB_STUDENT.icon} ${JOB_STUDENT.name}</option>
    </select>
    <div class="sub" style="margin:12px 0 6px">요즘 상태는?</div>
    <div class="chips">${MOODS.map(m=>`<button class="chip ${S.mood===m.k?"on":""}" onclick="labSet('mood','${m.k}')">${m.label}</button>`).join("")}</div></div>`;
  if (!S.job) return h + `<div class="card note">직군을 고르면 결과가 나와요 ✨</div>`;

  const a = jobAdvice(S.my, S.job, S.mood);
  if (a.student) {
    return h + `<div class="card"><h2>🎒 아직 정하는 중이라면, ${S.my}의 TOP3</h2>
      ${a.top.map((x,i)=>`<div class="rankrow"><span class="rk">${i+1}</span><span class="ri">${x.job.icon}</span><div><b>${x.job.name}</b> <span class="dots" aria-label="적합도 ${x.fit}/5">${dotsStr(x.fit)}</span><div class="sub">${x.job.about}</div></div></div>`).join("")}
      <p class="sub" style="margin:10px 0 0">관심 있는 직군을 위 목록에서 골라 보면 자세한 짐작이 나와요. (재미용 지수)</p></div>`;
  }
  return h + `<div class="card jobres">
    <div class="jobhdr"><div class="ji">${a.job.icon}</div>
      <div><b class="jn">${a.job.name}</b><div class="sub">${a.job.ex}</div></div>
      <div class="jfit"><span class="dots big" aria-label="적합도 ${a.fit}/5">${dotsStr(a.fit)}</span><b>${a.label}</b><span class="sub">재미용 지수</span></div></div>
    <div class="note">이 일에 필요한 것: <b>${a.job.about}</b></div>
    <h3 class="sec">✨ 내 강점 (${S.my})</h3>
    <ul class="l">${a.plus.length ? a.plus.map(p=>`<li><b>${LETTER[p.ch].name}</b> ${p.text}</li>`).join("") : "<li>나만의 방식으로 풀어 가는 재미가 있어요</li>"}</ul>
    <h3 class="sec">⚠️ 조심할 점</h3>
    <ul class="l">${a.minus ? `<li><b>${LETTER[a.minus.ch].name}</b> ${a.minus.text}</li>` : "<li>크게 걸리는 곳이 없어요. 번아웃만 조심!</li>"}</ul>
    <h3 class="sec">${MOODS.find(m=>m.k===S.mood).label.split(" ")[0]} 요즘의 나에게</h3>
    <p style="margin:0">${a.moodTip}</p>${a.moodNote ? `<p class="care">💡 ${a.moodNote}</p>` : ""}
    <h3 class="sec">🧭 이런 직군도 어울려요</h3>
    <div>${a.alts.map(x=>`<button class="pill pbtn" onclick="labSet('job','${x.job.id}')">${x.job.icon} ${x.job.name} ${dotsStr(x.fit)}</button>`).join("")}</div>
  </div>`;
}

/* ---------- 📊 직군 × 유형 ---------- */
function labMatrix(){
  const S = labState, keys = Object.keys(T);
  let h = `<div class="card"><h2>📊 직군 × 유형 매트릭스</h2>
    <p class="sub" style="margin-top:0">숫자가 클수록 찰떡이에요 (5=찰떡 … 1=도전형). 칸을 누르면 자세한 짐작이 나와요.</p>
    <div class="mxwrap"><table class="mx"><thead><tr><th class="corner"></th>${keys.map(k=>`<th class="${k===S.my?"me":""}">${k}</th>`).join("")}</tr></thead><tbody>
    ${JOBS.map(j=>`<tr><th class="rowh">${j.icon} ${j.name}</th>${keys.map(k=>{const f=jobFit(k,j.id);return `<td class="c l${f} ${k===S.my?"me":""}"><button onclick="labJobCell('${j.id}','${k}')" aria-label="${k} ${j.name} 적합도 ${f}">${f}</button></td>`;}).join("")}</tr>`).join("")}
    </tbody></table></div></div>`;
  if (S.my) {
    h += `<div class="card"><h2>🏆 ${S.my}의 TOP3 직군</h2>${rankJobs(S.my).slice(0,3).map((x,i)=>
      `<div class="rankrow"><span class="rk">${i+1}</span><span class="ri">${x.job.icon}</span><div><b>${x.job.name}</b> <span class="dots">${dotsStr(x.fit)}</span><div class="sub">${x.job.about}</div></div></div>`).join("")}</div>`;
  } else h += needMy();
  return h;
}

/* ---------- 💞 케미 히트맵 ---------- */
function labHeat(){
  const S = labState, keys = Object.keys(T);
  return `<div class="card"><h2>💞 16×16 케미 히트맵</h2>
    <p class="sub" style="margin-top:0">숫자가 클수록 케미가 좋다고 ‘점쳐지는’ 조합이에요. 칸을 누르면 그 둘의 이야기가 열려요. (재미용)</p>
    <div class="mxwrap"><table class="mx hm"><thead><tr><th class="corner"></th>${keys.map(k=>`<th class="${k===S.my?"me":""}">${k}</th>`).join("")}</tr></thead><tbody>
    ${keys.map(a=>`<tr><th class="rowh ${a===S.my?"me":""}">${a}</th>${keys.map(b=>{const n=pairScore(a,b);return `<td class="c l${n} ${a===S.my||b===S.my?"me":""}"><button onclick="labPair('${a}','${b}')" aria-label="${a}와 ${b} 케미 ${n}">${n}</button></td>`;}).join("")}</tr>`).join("")}
    </tbody></table></div>
    <p class="sub" style="margin:10px 0 0">5 찰떡 · 4 잘 맞는 편 · 3 무난 · 2 다름이 매력 · 1 서로 배우는 사이</p></div>`;
}
