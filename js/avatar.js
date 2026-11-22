/* 유형별 SVG 캐릭터 — 글자(E/I, S/N, T/F, J/P) 부품을 조합해 16유형이 모두 다른 그림이 된다.
   외부 이미지 없음. 색상은 그룹(분석가/외교관/관리자/탐험가)별 고정 팔레트 */
const AV_COLORS = { A:["#8e6fd8","#efe8ff"], D:["#3fae7a","#e6f7ee"], S:["#4a86e0","#e8f0ff"], E:["#e8a03a","#fff3df"] };
let _avId = 0;

function avatar(type, size){
  size = size || 96;
  const [main, bg] = AV_COLORS[gOf(type)];
  const has = ch => type.indexOf(ch) >= 0;
  const ink = "#3a3550", skin = "#ffe0b8", hair = "#5a4636", id = "avc" + (++_avId);
  let s = `<svg class="av" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${type} 캐릭터" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><clipPath id="${id}"><circle cx="60" cy="60" r="58"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id})"><rect width="120" height="120" fill="${bg}"/>`;

  /* 몸 */
  s += `<path d="M14 124c0-24 20-38 46-38s46 14 46 38z" fill="${main}"/>`;
  if (has("F")) s += `<path d="M60 113c-9-6-12-10-12-14a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 4-3 8-12 14z" fill="#ff6f91" stroke="#fff" stroke-width="2"/>`;

  /* 머리 */
  s += `<circle cx="60" cy="56" r="30" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>`;

  /* 머리카락: J 단정 / P 삐죽 */
  s += `<path d="M30 52c0-21 13-31 30-31s30 10 30 31c-7-9-19-13-30-13S37 43 30 52z" fill="${hair}"/>`;
  if (has("P")) s += `<path d="M38 32l-5-12 11 7zM56 26l-1-14 9 11zM76 28l8-12 3 15z" fill="${hair}"/>`;

  /* 눈: S 동그란 눈 / N 반짝이는 눈 */
  if (has("N")) {
    s += `<circle cx="48" cy="57" r="4.6" fill="${ink}"/><circle cx="72" cy="57" r="4.6" fill="${ink}"/>`;
    s += `<circle cx="49.8" cy="55.2" r="1.7" fill="#fff"/><circle cx="73.8" cy="55.2" r="1.7" fill="#fff"/>`;
  } else {
    s += `<circle cx="48" cy="57" r="3.4" fill="${ink}"/><circle cx="72" cy="57" r="3.4" fill="${ink}"/>`;
  }

  /* 볼터치 (F는 더 진하게) */
  const bo = has("F") ? 0.95 : 0.5;
  s += `<ellipse cx="40" cy="67" rx="5.5" ry="3.4" fill="#ff9db0" opacity="${bo}"/><ellipse cx="80" cy="67" rx="5.5" ry="3.4" fill="#ff9db0" opacity="${bo}"/>`;

  /* 입: E 활짝 / I 살짝 */
  if (has("E")) s += `<path d="M49 68q11 14 22 0z" fill="#d8504d" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
  else s += `<path d="M52 70q8 6 16 0" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;

  /* T: 안경 */
  if (has("T")) s += `<g fill="rgba(255,255,255,.35)" stroke="${ink}" stroke-width="2.2"><circle cx="48" cy="57" r="9.5"/><circle cx="72" cy="57" r="9.5"/><path d="M57.5 56h5" fill="none"/></g>`;

  /* E: 소리 표시 / I: 헤드폰 */
  if (has("E")) s += `<g fill="none" stroke="${main}" stroke-width="3.4" stroke-linecap="round"><path d="M17 44q-7 11 0 22"/><path d="M103 44q7 11 0 22"/></g>`;
  else s += `<path d="M31 54a29 29 0 0 1 58 0" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/><rect x="25" y="50" width="9" height="17" rx="4" fill="${main}" stroke="${ink}" stroke-width="2.2"/><rect x="86" y="50" width="9" height="17" rx="4" fill="${main}" stroke="${ink}" stroke-width="2.2"/>`;

  /* N: 전구 / S: 체크리스트 */
  if (has("N")) s += `<g stroke="${ink}" stroke-width="2"><circle cx="97" cy="26" r="9" fill="#ffd84d"/><rect x="93" y="35" width="8" height="5" rx="1.5" fill="#fff"/></g><g stroke="#ffb000" stroke-width="2" stroke-linecap="round"><path d="M97 11v-3M108 16l2-2M86 16l-2-2"/></g>`;
  else s += `<g stroke="${ink}" stroke-width="2"><rect x="76" y="80" width="19" height="26" rx="3" fill="#fff"/><path d="M80 89l2.5 2.5 4-5M80 99l2.5 2.5 4-5" fill="none" stroke="#3fae7a" stroke-width="2.2" stroke-linecap="round"/><path d="M89 90h3M89 100h3" stroke="${ink}" stroke-linecap="round"/></g>`;

  /* J: 시계 / P: 구름 */
  if (has("J")) s += `<g stroke="${ink}" stroke-width="2"><circle cx="24" cy="28" r="9" fill="#fff"/><path d="M24 22v6l4 3" fill="none" stroke-linecap="round"/></g>`;
  else s += `<g transform="translate(5 5)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M13 29a6 6 0 0 1 11-3 5 5 0 0 1 9 3 4 4 0 0 1-1 8H17a5 5 0 0 1-4-8z" fill="#fff"/></g>`;

  s += `</g><circle cx="60" cy="60" r="58" fill="none" stroke="${main}" stroke-width="2.5"/></svg>`;
  return s;
}
