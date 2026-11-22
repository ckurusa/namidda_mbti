/* 점쳐보기 계산 (순수 함수, DOM 없음 → tests/run.js 가 검증). 모든 지수는 '재미용' */
const AXKEYS = ["EI","SN","TF","JP"];
const SIGN = {E:1,I:-1,S:1,N:-1,T:1,F:-1,J:1,P:-1};
const clamp = (n,a,b) => Math.max(a, Math.min(b, n));

/* ---------- 케미 (유형 × 유형) ---------- */
function pairAxes(a,b){ return AXKEYS.map((k,i)=>({k, me:a[i], other:b[i], same:a[i]===b[i]})); }

/* 점수 규칙(재미용): S/N이 같으면 대화가 잘 통해 +2, T/F·E/I는 다를 때 조금 더 보완, 통설상 잘 맞는 조합(best)이면 +1.5 */
const PAIR_W = {EI:{diff:1.2,same:1}, SN:{diff:0,same:2}, TF:{diff:1.5,same:1}, JP:{diff:0.5,same:1}};
const PAIR_MIN = 2.5, PAIR_MAX = 7.2;
function pairScore(a,b){
  let raw = 0;
  for (const x of pairAxes(a,b)) raw += PAIR_W[x.k][x.same ? "same" : "diff"];
  if (T[a].best.includes(b) || T[b].best.includes(a)) raw += 1.5;
  return clamp(Math.round(1 + (raw-PAIR_MIN)/(PAIR_MAX-PAIR_MIN)*4), 1, 5);
}
const heartsStr = n => "♥".repeat(n) + "♡".repeat(5-n);

/* 상황별 조언: me(내 유형) · other(상대 유형) · stageKey(crush/some/dating/slump/married) */
function pairAdvice(me, other, stageKey){
  const stage = STAGES.find(s=>s.k===stageKey) || STAGES[0];
  const ax = pairAxes(me, other);
  const axes = ax.map(x=>{
    const [t,d] = x.same ? PAIR[x.k][x.me] : PAIR[x.k].diff;
    return {k:x.k, same:x.same, me:x.me, other:x.other, t, d};
  });
  const diffs = axes.filter(x=>!x.same);
  const first = diffs[0] || axes[0];
  const title = PAIR_TITLE[diffs.length];
  const hearts = pairScore(me, other);
  const guess = {
    crush:  `상대 눈에 비친 내 첫인상은 ${SHORT[me].tags.map(t=>"#"+t).join(" ")} 일지도?`,
    some:   `이 관계의 키워드: ${axes.map(x=>x.t).join(" · ")}`,
    dating: `둘의 케미 한 줄 요약 — “${title}”`,
    married:`부부로서의 케미 한 줄 요약 — “${title}”`,
    slump:  diffs.length ? `지금의 답답함은 ‘${first.t}’에서 올 수 있어요` : "너무 닮은 사이라 신선함이 줄어든 걸지도 몰라요"
  }[stage.k];
  return {
    stage, care: stage.care, hearts, heartLabel: HEART_LABEL[hearts], title, axes, guess,
    partnerTips: other.split("").map(ch=>({ch, tip: stage.tips[ch]})),
    mine: LETTER[first.me].love[1]
  };
}

/* ---------- 직군 적합도 (유형 × 직군) ---------- */
function jobContrib(type, job){
  return AXKEYS.map((k,i)=>({k, ch:type[i], c: job.pref[k] * SIGN[type[i]]}));
}
function jobSum(type, job){ return jobContrib(type, job).reduce((s,x)=>s+x.c, 0); }
function jobFit(type, jobId){
  const job = JOBS.find(j=>j.id===jobId);
  const M = AXKEYS.reduce((s,k)=>s+Math.abs(job.pref[k]), 0);
  return clamp(Math.round(3 + 2*jobSum(type, job)/M), 1, 5);
}
function rankJobs(type){
  return JOBS.map((job,i)=>({job, i, fit:jobFit(type, job.id), sum:jobSum(type, job)}))
    .sort((a,b)=> b.fit-a.fit || b.sum-a.sum || a.i-b.i);
}

function jobAdvice(type, jobId, moodKey){
  const ranked = rankJobs(type);
  if (jobId === JOB_STUDENT.id) return {student:true, top: ranked.slice(0,3)};
  const job = JOBS.find(j=>j.id===jobId);
  const fit = jobFit(type, jobId);
  const cs = jobContrib(type, job);
  const plus = cs.filter(x=>x.c>=0).sort((a,b)=>b.c-a.c).slice(0,2).map(x=>({ch:x.ch, text:WPLUS[x.ch]}));
  const worst = cs.filter(x=>x.c<0).sort((a,b)=>a.c-b.c)[0];
  const level = fit>=4 ? "hi" : fit===3 ? "mid" : "lo";
  return {
    job, fit, label: FIT_LABEL[fit], plus,
    minus: worst ? {ch:worst.ch, text:WMINUS[worst.ch]} : null,
    moodTip: MOOD_TIP[moodKey || "fun"][level],
    moodNote: MOOD_NOTE[moodKey || "fun"],
    alts: ranked.filter(x=>x.job.id!==jobId).slice(0,3)
  };
}

/* ---------- 상대 MBTI 미니 퀴즈 ---------- */
function miniType(letters){ return letters.join(""); }
