/* 채점: 축별 선호 %, 확신도, 검사 종료 처리 */
/* ---------- 채점 ---------- */
function score(){
  const res = {};
  for (const [k,a,b] of AXES){
    let sum=0,n=0;
    qs.forEach((q,i)=>{ if(q.axis!==k) return; const v=ans[i]-2; sum += (q.d===a? v : -v); n++; });
    const pctA = Math.round((sum+2*n)/(4*n)*100);
    res[k] = {a, b, pctA, pctB:100-pctA, pick: pctA>50? a : b, n};
  }
  return res;
}
function confidence(p){
  const d = Math.abs(p-50);
  return d<8 ? ["경계 (선호가 거의 비슷함)",true] : d<20 ? ["보통 수준의 선호",false] : ["뚜렷한 선호",false];
}

function finish(){
  const r = score();
  const type = AXES.map(([k])=>r[k].pick).join("");
  saveHistory({date:new Date().toLocaleString("ko-KR"), mode, type, p:AXES.map(([k])=>r[k].pctA)});
  clearProgress();
  labState.my = type;           // 점쳐보기에서 내 MBTI로 바로 사용
  renderResult(r,type);
}

