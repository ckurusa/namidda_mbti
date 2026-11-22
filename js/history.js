/* 검사 기록(localStorage) 저장/표시 */
/* ---------- 기록 ---------- */
function loadHistory(){ try{ return JSON.parse(localStorage.getItem("mbti_hist")||"[]"); }catch(e){ return []; } }
function saveHistory(item){ try{ const h=loadHistory(); h.unshift(item); localStorage.setItem("mbti_hist",JSON.stringify(h.slice(0,10))); }catch(e){} }
function clearHistory(){ try{ localStorage.removeItem("mbti_hist"); }catch(e){} renderHistory(); }
function renderHistory(){
  const h = loadHistory();
  $("historyCard").classList.toggle("hide", !h.length);
  if(!h.length) return;
  $("histTable").innerHTML = `<tr><th>일시</th><th>검사</th><th>유형</th><th>E / S / T / J %</th></tr>` +
    h.map(x=>`<tr><td>${x.date}</td><td>${MODE_NAME[x.mode]||"간편"}</td><td><b>${x.type}</b></td><td>${x.p.join(" / ")}</td></tr>`).join("");
  const q = h.find(x=>x.mode!=="full"), f = h.find(x=>x.mode==="full");
  $("histMsg").textContent = (q&&f) ? (q.type===f.type ? `간편(${q.type})과 정밀(${f.type}) 결과가 일치합니다 👍` : `간편(${q.type})과 정밀(${f.type}) 결과가 다릅니다. 달라진 글자는 경계에 있는 성향일 가능성이 큽니다.`) : "";
}
