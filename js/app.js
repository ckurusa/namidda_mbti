/* 앱 시작점: 해시 라우터 (#guide, #ISTJ, #lab, #lab/ENFP/love ...) — 가장 마지막에 로드 */
function navTest(){ if(location.hash) location.hash=""; else home(); }
const TITLE_HOME = "마음도감 — MBTI 스타일 성향 검사 · 점쳐보기 · 16유형 가이드";
function route(){
  const parts = decodeURIComponent(location.hash.slice(1)).split("/");
  const h = parts[0].toUpperCase();
  if (T[h]) { renderDetail(h); show("gdetail"); document.title = `${h} ${T[h].n} - 성향·습관·직업·연애·공부법 | 마음도감`; }
  else if (h==="GUIDE") { renderGuideList(); show("glist"); document.title = "마음도감 · 16유형 완전 가이드 — 성향 습관 직업 연애 공부법"; }
  else if (h==="LAB") {   /* 화면을 먼저 보이게 한 뒤 그려야 매트릭스 스크롤 위치 계산이 맞다 */
    show("lab"); renderLab((parts[1]||"").toUpperCase(), (parts[2]||"").toLowerCase());
    document.title = "마음도감 · 점쳐보기 — 연애 케미 · 직군 매트릭스";
  }
  else { home(); document.title = TITLE_HOME; }
  window.scrollTo(0,0);
}
window.addEventListener("hashchange", route);
route();
