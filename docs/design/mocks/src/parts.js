// Shared SVG parts for the concept mocks. Each function returns an SVG string.
// Characters are authored in a local coordinate box (origin = ground point) and placed with a transform.
(function () {
const INK = '#4a2f24';
const SKIN = '#ffd8c2';
const PJ = '#ffe08a';     // footie pajama
const PJ_D = '#f2c45e';
const BLUSH = '#ff9d8f';
const TABBY = '#b9814f';
const TABBY_D = '#7a4e2c';
const TABBY_L = '#f3dcc0';

function tf(x, y, s = 1, flip = false) {
  return `transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"`;
}

// Crawling baby, side view facing right. ~100 wide, ~78 tall.
function babyCrawl({ x, y, s = 1, flip = false }) {
  return `<g ${tf(x, y, s, flip)} stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="-46" cy="-6" rx="10" ry="6.5" fill="${PJ_D}"/>
    <ellipse cx="-30" cy="-12" rx="17" ry="12" fill="${PJ_D}"/>
    <path d="M10 -36 Q4 -20 8 -4" fill="none"/>
    <ellipse cx="-6" cy="-28" rx="32" ry="20" fill="${PJ}"/>
    <circle cx="-8" cy="-26" r="8" fill="#f7b267" stroke-width="2"/>
    <circle cx="-13" cy="-33" r="3" fill="#f7b267" stroke-width="1.6"/>
    <circle cx="-3" cy="-33" r="3" fill="#f7b267" stroke-width="1.6"/>
    <circle cx="-10.5" cy="-26" r="1.1" fill="${INK}" stroke="none"/><circle cx="-5.5" cy="-26" r="1.1" fill="${INK}" stroke="none"/>
    <ellipse cx="-24" cy="-6" rx="10" ry="6" fill="${PJ}"/>
    <path d="M14 -34 L20 -6" stroke-width="13" stroke="${INK}"/>
    <path d="M14 -34 L20 -6" stroke-width="8.5" stroke="${PJ}"/>
    <ellipse cx="22" cy="-4" rx="8" ry="5.5" fill="${SKIN}"/>
    <circle cx="34" cy="-50" r="25" fill="${SKIN}"/>
    <path d="M24 -73 Q28 -86 36 -76 Q40 -88 46 -74" fill="#5b3a29" stroke-width="2.2"/>
    <ellipse cx="19" cy="-50" rx="5" ry="6.5" fill="${SKIN}"/>
    <ellipse cx="45" cy="-53" rx="4" ry="5.2" fill="${INK}" stroke="none"/>
    <circle cx="46.5" cy="-55" r="1.6" fill="#fff" stroke="none"/>
    <ellipse cx="43" cy="-41" rx="6" ry="3.6" fill="${BLUSH}" stroke="none" opacity=".75"/>
    <path d="M52 -42 Q55 -38 51 -36" fill="none" stroke-width="2.2"/>
  </g>`;
}

// Baby face/upper body, front 3/4, looking up with open mouth (for stroller). ~110 wide.
function babyLookUp({ x, y, s = 1, mouth = 'O' }) {
  return `<g ${tf(x, y, s)} stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-48 0 Q-50 -40 -20 -50 L22 -50 Q50 -40 48 0 Z" fill="${PJ}"/>
    <circle cx="0" cy="-34" r="9" fill="#f7b267" stroke-width="2.2"/>
    <circle cx="0" cy="-88" r="44" fill="${SKIN}"/>
    <path d="M-12 -130 Q-6 -148 2 -132 Q8 -150 16 -130" fill="#5b3a29" stroke-width="2.4"/>
    <ellipse cx="-44" cy="-86" rx="7" ry="10" fill="${SKIN}"/>
    <ellipse cx="44" cy="-86" rx="7" ry="10" fill="${SKIN}"/>
    <ellipse cx="-16" cy="-98" rx="7" ry="9" fill="${INK}" stroke="none"/>
    <ellipse cx="18" cy="-98" rx="7" ry="9" fill="${INK}" stroke="none"/>
    <circle cx="-13" cy="-103" r="3" fill="#fff" stroke="none"/><circle cx="21" cy="-103" r="3" fill="#fff" stroke="none"/>
    <path d="M-26 -114 Q-16 -120 -6 -115 M8 -115 Q18 -120 28 -114" fill="none" stroke-width="2.4"/>
    <ellipse cx="-28" cy="-74" rx="10" ry="6" fill="${BLUSH}" stroke="none" opacity=".7"/>
    <ellipse cx="30" cy="-74" rx="10" ry="6" fill="${BLUSH}" stroke="none" opacity=".7"/>
    ${mouth === 'O' ? `<ellipse cx="1" cy="-66" rx="8" ry="10" fill="#c9524a"/><ellipse cx="1" cy="-62" rx="5" ry="4" fill="#ff8f86" stroke="none"/>` : `<path d="M-8 -68 Q1 -60 10 -68" fill="none"/>`}
    <path d="M30 -40 Q58 -70 66 -118" fill="none" stroke-width="16"/>
    <path d="M30 -40 Q58 -70 66 -118" fill="none" stroke-width="10.5" stroke="${PJ}"/>
    <circle cx="67" cy="-124" r="9" fill="${SKIN}"/>
    <path d="M67 -133 L69 -146" stroke-width="9" />
    <path d="M67 -133 L69 -146" stroke-width="4.5" stroke="${SKIN}"/>
  </g>`;
}

// Mocha sitting, front view. ~70 wide, ~110 tall.
function catSit({ x, y, s = 1, flip = false, look = 'front' }) {
  const ex = look === 'side' ? 4 : 0;
  return `<g ${tf(x, y, s, flip)} stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M20 -6 Q58 -4 52 -34 Q48 -52 40 -48" fill="none" stroke-width="13"/>
    <path d="M20 -6 Q58 -4 52 -34 Q48 -52 40 -48" fill="none" stroke-width="8" stroke="${TABBY}"/>
    <path d="M-28 -2 Q-34 -50 -14 -62 L14 -62 Q34 -50 28 -2 Z" fill="${TABBY}"/>
    <path d="M-12 -2 Q-14 -40 0 -50 Q14 -40 12 -2 Z" fill="${TABBY_L}" stroke="none"/>
    <path d="M-27 -20 L-17 -18 M-29 -32 L-18 -30 M-26 -44 L-16 -42 M27 -20 L17 -18 M29 -32 L18 -30 M26 -44 L16 -42" stroke="${TABBY_D}" stroke-width="3.2"/>
    <ellipse cx="-11" cy="-3" rx="8" ry="5.5" fill="#fff"/>
    <ellipse cx="11" cy="-3" rx="8" ry="5.5" fill="#fff"/>
    <path d="M-26 -84 L-24 -110 L-6 -94 Z" fill="${TABBY}"/><path d="M26 -84 L24 -110 L6 -94 Z" fill="${TABBY}"/>
    <path d="M-22 -92 L-21 -103 L-13 -96 Z M22 -92 L21 -103 L13 -96 Z" fill="#f4a7a0" stroke="none"/>
    <ellipse cx="0" cy="-78" rx="29" ry="24" fill="${TABBY}"/>
    <path d="M-10 -98 L-6 -90 L0 -97 L6 -90 L10 -98" fill="none" stroke="${TABBY_D}" stroke-width="3"/>
    <path d="M-28 -76 L-20 -76 M28 -76 L20 -76" stroke="${TABBY_D}" stroke-width="3"/>
    <ellipse cx="0" cy="-67" rx="13" ry="9" fill="${TABBY_L}" stroke="none"/>
    <ellipse cx="${-11 + ex}" cy="-80" rx="5" ry="6" fill="#9bc45a" stroke-width="2"/>
    <ellipse cx="${11 + ex}" cy="-80" rx="5" ry="6" fill="#9bc45a" stroke-width="2"/>
    <ellipse cx="${-11 + ex}" cy="-80" rx="1.8" ry="4.6" fill="${INK}" stroke="none"/>
    <ellipse cx="${11 + ex}" cy="-80" rx="1.8" ry="4.6" fill="${INK}" stroke="none"/>
    <path d="M-3 -71 L3 -71 L0 -67 Z" fill="#e88b8b" stroke-width="1.6"/>
    <path d="M0 -67 Q-4 -62 -7 -64 M0 -67 Q4 -62 7 -64" fill="none" stroke-width="1.8"/>
    <path d="M-14 -68 L-32 -71 M-14 -65 L-31 -63 M14 -68 L32 -71 M14 -65 L31 -63" stroke-width="1.2"/>
  </g>`;
}

// Mocha walking/crouched, side view facing right (for top-down-ish scenes too). ~90 wide.
function catSide({ x, y, s = 1, flip = false }) {
  return `<g ${tf(x, y, s, flip)} stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-34 -34 Q-56 -50 -48 -76" fill="none" stroke-width="12"/>
    <path d="M-34 -34 Q-56 -50 -48 -76" fill="none" stroke-width="7" stroke="${TABBY}"/>
    <path d="M-26 -2 L-24 -24 M-14 -2 L-14 -22 M16 -2 L14 -24 M26 -2 L24 -22" stroke-width="10"/>
    <path d="M-26 -2 L-24 -24 M-14 -2 L-14 -22 M16 -2 L14 -24 M26 -2 L24 -22" stroke-width="5.5" stroke="${TABBY}"/>
    <path d="M-27 -3 L-21 -3 M-15 -3 L-9 -3 M15 -3 L21 -3 M25 -3 L31 -3" stroke="#fff" stroke-width="5"/>
    <ellipse cx="0" cy="-30" rx="36" ry="16" fill="${TABBY}"/>
    <path d="M-18 -44 L-14 -18 M-4 -46 L-2 -16 M10 -45 L10 -18" stroke="${TABBY_D}" stroke-width="3.2"/>
    <path d="M26 -50 L26 -72 L40 -60 Z M44 -56 L50 -74 L56 -56 Z" fill="${TABBY}"/>
    <ellipse cx="40" cy="-46" rx="20" ry="17" fill="${TABBY}"/>
    <path d="M34 -60 L38 -54 L42 -60" fill="none" stroke="${TABBY_D}" stroke-width="2.6"/>
    <ellipse cx="50" cy="-40" rx="9" ry="6.5" fill="${TABBY_L}" stroke="none"/>
    <ellipse cx="47" cy="-49" rx="3.6" ry="4.6" fill="#9bc45a" stroke-width="1.8"/>
    <ellipse cx="48" cy="-49" rx="1.3" ry="3.6" fill="${INK}" stroke="none"/>
    <path d="M57 -43 L60 -41 L57 -39 Z" fill="#e88b8b" stroke-width="1.4"/>
  </g>`;
}

function bubble({ x, y, w, h, text = '', fs = 18, fill = '#fff', tail = 'bl' }) {
  const tx = tail === 'bl' ? x + 16 : x + w - 22;
  return `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>
    <path d="M${tx} ${y + h - 1} L${tx + (tail === 'bl' ? -6 : 10)} ${y + h + 12} L${tx + 10} ${y + h - 1}" fill="${fill}"/>
    <path d="M${tx + 1} ${y + h - 2.5} L${tx + 9} ${y + h - 2.5}" stroke="${fill}" stroke-width="3"/>
    ${text ? `<text x="${x + w / 2}" y="${y + h / 2 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${INK}" stroke="none">${text}</text>` : ''}
  </g>`;
}

function hand({ x, y, s = 1, rot = 0 }) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M0 0 L0 -26 Q0 -32 6 -32 Q12 -32 12 -26 L12 -10 L12 -12 Q12 -17 17 -17 Q22 -17 22 -12 L22 -8 Q22 -13 27 -13 Q32 -13 32 -8 L32 -4 Q32 -9 37 -9 Q42 -9 42 -4 L42 12 Q42 30 24 34 L12 34 Q2 30 -6 16 L-12 6 Q-14 0 -8 -2 Q-4 -3 0 2 Z" fill="#fff" opacity=".96"/>
  </g>`;
}

const FONT = `font-family: 'WenQuanYi Zen Hei', 'Noto Sans TC', sans-serif;`;
window.P = { babyCrawl, babyLookUp, catSit, catSide, bubble, hand, INK, FONT };
})();
