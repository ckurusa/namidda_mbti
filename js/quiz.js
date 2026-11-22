/* 검사 진행: 시작/문항 표시/응답/이전/이어하기/보완/키보드 */
/* ---------- 상태 ---------- */
let mode, qs, ans, idx;
function start(m){
  mode = m;
  qs = [];
  for (const [k] of AXES) for (const q of Q[k]) if (m==="full" || q[2]) qs.push({t:q[0],d:q[1],axis:k});
  shuffle(qs);
  ans = new Array(qs.length).fill(null);
  idx = 0;
  setTag(); saveProgress();
  show("quiz"); render(); window.scrollTo(0,0);
}

const MODE_NAME = {quick:"간편", plus:"간편+보완", full:"정밀"};
function setTag(){
  $("modeTag").textContent = mode==="full" ? "정밀 검사 · 60문항"
    : mode==="plus" ? `간편 검사 + 경계 축 보완 · ${qs.length}문항` : "간편 검사 · 20문항";
}
function home(){ show("home"); renderHistory(); renderResume(); window.scrollTo(0,0); }

/* 진행 상황 저장 / 이어하기 */
function readProgress(){
  try{
    const p = JSON.parse(localStorage.getItem("mbti_prog"));
    return (p && Array.isArray(p.qs) && Array.isArray(p.ans) && p.qs.length===p.ans.length && MODE_NAME[p.mode]) ? p : null;
  }catch(e){ return null; }
}
function saveProgress(){ try{ localStorage.setItem("mbti_prog", JSON.stringify({mode,qs,ans,idx})); }catch(e){} }
function clearProgress(){ try{ localStorage.removeItem("mbti_prog"); }catch(e){} }
function resume(){
  const p = readProgress(); if(!p) return;
  mode=p.mode; qs=p.qs; ans=p.ans; idx=Math.min(Math.max(p.idx|0,0),qs.length-1);
  setTag(); show("quiz"); render(); window.scrollTo(0,0);
}
function renderResume(){
  const p = readProgress();
  $("resumeCard").classList.toggle("hide", !p);
  if(p) $("resumeMsg").textContent = `${MODE_NAME[p.mode]} 검사를 ${p.ans.filter(x=>x!==null).length}/${p.qs.length}문항까지 진행했어요.`;
}

/* 간편 검사 후, 경계에 걸린 축만 나머지 문항으로 보완 */
function supplement(){
  const r = score();
  const keys = AXES.filter(([k])=>confidence(r[k].pctA)[1]).map(a=>a[0]);
  const have = new Set(qs.map(q=>q.t));
  const add = [];
  for (const k of keys) for (const q of Q[k]) if(!have.has(q[0])) add.push({t:q[0],d:q[1],axis:k});
  if(!add.length) return;
  shuffle(add);
  idx = qs.length; qs = qs.concat(add); ans = ans.concat(new Array(add.length).fill(null));
  mode = "plus"; setTag(); saveProgress();
  show("quiz"); render(); window.scrollTo(0,0);
}

function render(){
  const q = qs[idx];
  $("qText").textContent = q.t;
  $("count").textContent = `${idx+1} / ${qs.length}`;
  $("bar").style.width = (idx/qs.length*100)+"%";
  $("prev").disabled = idx===0;
  $("scale").innerHTML = LABEL.map((l,i)=>`<button class="${ans[idx]===i?'on':''}" onclick="pick(${i})"><b>${i+1}</b>${l}</button>`).join("");
}
function pick(v){
  ans[idx]=v;
  if(idx<qs.length-1){ idx++; saveProgress(); render(); } else finish();
}
function prev(){ if(idx>0){ idx--; saveProgress(); render(); } }
function goHome(){ if(confirm("검사를 잠시 멈추고 처음으로 돌아갈까요?\n진행 상황은 저장되어 나중에 이어서 할 수 있어요.")) home(); }

/* 키보드: 1~5 답변, ← 이전 */
document.addEventListener("keydown", e=>{
  if($("quiz").classList.contains("hide") || e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key>="1" && e.key<="5") pick(+e.key-1);
  else if(e.key==="ArrowLeft" || e.key==="Backspace") { e.preventDefault(); prev(); }
});
