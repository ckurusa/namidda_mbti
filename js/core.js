/* 공통 유틸: $, 화면 전환(show), shuffle */
const $ = id => document.getElementById(id);
const VIEWS = ["home","quiz","result","glist","gdetail","lab"];
const NAV_OF = {home:"nTest", quiz:"nTest", result:"nTest", glist:"nGuide", gdetail:"nGuide", lab:"nLab"};
const show = id => {
  VIEWS.forEach(s => $(s).classList.toggle("hide", s!==id));
  ["nTest","nLab","nGuide"].forEach(n => $(n).classList.toggle("on", n===NAV_OF[id]));
};

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
