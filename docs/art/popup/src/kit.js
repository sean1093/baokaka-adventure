// 翻翻台北 Pop-Up Taipei: shared paper-craft SVG kit for the environment style proofs.
// Every function returns an SVG string. Coordinates are CSS px in a 390x844 phone viewport.
// These helpers are the reference implementation of docs/art/popup/README.md; the game should
// port them to src/popup/art/*.ts and bake the expensive filter work (grain, shadows) to bitmaps.
(function () {
  // ---------- palette ----------
  const C = {
    // book + UI (navy linen cover with gold foil = option D UI, re-materialised as a real book)
    cover: '#1B2052', coverD: '#121638', coverL: '#2A3170',
    gold: '#E8C77A', goldL: '#FFE9B0', goldD: '#B8893A',
    page: '#F3E6CC', pageD: '#E2D0AE', pageEdge: '#D8C59F',
    ink: '#2E2235', inkSoft: '#5B4A5E',
    // touchables: marigold card + vermilion seal (never night-graded)
    tab: '#FFC23A', tabL: '#FFE38C', tabD: '#E39A17', tabEdge: '#A9650C',
    seal: '#D8342A', sealD: '#9E1F18',
    // shadows are indigo, never black
    shadow: '#140C34',
    // light
    lamp: '#FFD98A', lampHot: '#FFF3CF', neonPink: '#FF6FAE', neonCyan: '#7FF3FF', moon: '#FFF4D2',
  };

  // ---------- seeded random ----------
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const f1 = (n) => Math.round(n * 10) / 10;

  // ---------- filters / defs ----------
  // A "depth" filter = stacked shadow (tight contact + wide soft) + cut-edge rim light (top-left)
  // + cut-edge shade (bottom-right). z grows with the layer's distance from what is behind it.
  function depthFilter(id, z, tint = C.shadow) {
    const cdx = 0.5 + z * 0.25, cdy = 0.8 + z * 0.45;
    const sdx = 1 + z * 1.1, sdy = 2 + z * 2.2, sb = 1.5 + z * 1.6;
    return `<filter id="${id}" x="-25%" y="-25%" width="150%" height="170%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${sb}" result="b1"/><feOffset in="b1" dx="${sdx}" dy="${sdy}" result="o1"/>
      <feFlood flood-color="${tint}" flood-opacity="${0.22 + z * 0.03}"/><feComposite in2="o1" operator="in" result="soft"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="${0.5 + z * 0.15}" result="b2"/><feOffset in="b2" dx="${cdx}" dy="${cdy}" result="o2"/>
      <feFlood flood-color="${tint}" flood-opacity=".55"/><feComposite in2="o2" operator="in" result="contact"/>
      <feOffset in="SourceAlpha" dx="1.1" dy="1.1" result="sh1"/><feComposite in="SourceAlpha" in2="sh1" operator="out" result="rimA"/>
      <feFlood flood-color="#FFF8E8" flood-opacity=".42"/><feComposite in2="rimA" operator="in" result="rim"/>
      <feOffset in="SourceAlpha" dx="-1" dy="-1" result="sh2"/><feComposite in="SourceAlpha" in2="sh2" operator="out" result="shA"/>
      <feFlood flood-color="${tint}" flood-opacity=".35"/><feComposite in2="shA" operator="in" result="shade"/>
      <feMerge><feMergeNode in="soft"/><feMergeNode in="contact"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="rim"/></feMerge>
    </filter>`;
  }

  function defs(extra = '') {
    return `<defs>
    ${[0, 1, 2, 3, 4, 5].map((z) => depthFilter('z' + z, z)).join('')}
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .46  0 0 0 0 .42  .9 .9 .9 0 -1.05"/>
    </filter>
    <filter id="mottle" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .4  1.2 0 0 0 -.45"/>
    </filter>
    <filter id="deckle" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="2" seed="11" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="torn" x="-5%" y="-10%" width="110%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="5" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowS" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="1.6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur18" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="18"/></filter>
    <!-- die-cut standee: printed sprite + 3px white card border + thin cut line + stacked shadow -->
    <filter id="standee" x="-30%" y="-15%" width="160%" height="135%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d"/>
      <feGaussianBlur in="d" stdDeviation=".5" result="d2"/>
      <feComponentTransfer in="d2" result="border"><feFuncA type="linear" slope="3" intercept="-.6"/></feComponentTransfer>
      <feFlood flood-color="#FBF6EC"/><feComposite in2="border" operator="in" result="white"/>
      <feMorphology in="border" operator="dilate" radius=".6" result="cut0"/><feComposite in="cut0" in2="border" operator="out" result="cutA"/>
      <feFlood flood-color="#8F8296" flood-opacity=".9"/><feComposite in2="cutA" operator="in" result="cut"/>
      <feGaussianBlur in="border" stdDeviation="3.5" result="sb"/><feOffset in="sb" dx="3" dy="5" result="so"/>
      <feFlood flood-color="${C.shadow}" flood-opacity=".45"/><feComposite in2="so" operator="in" result="soft"/>
      <feGaussianBlur in="border" stdDeviation=".8" result="cb"/><feOffset in="cb" dx="1" dy="1.6" result="co"/>
      <feFlood flood-color="${C.shadow}" flood-opacity=".6"/><feComposite in2="co" operator="in" result="contact"/>
      <feMerge><feMergeNode in="soft"/><feMergeNode in="contact"/><feMergeNode in="white"/><feMergeNode in="cut"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="vign" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05061A" stop-opacity=".55"/></radialGradient>
    <linearGradient id="tabG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.tabL}"/><stop offset=".45" stop-color="${C.tab}"/><stop offset="1" stop-color="${C.tabD}"/></linearGradient>
    <radialGradient id="tabR" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${C.tabL}"/><stop offset=".55" stop-color="${C.tab}"/><stop offset="1" stop-color="${C.tabD}"/></radialGradient>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8A5E1E"/><stop offset=".22" stop-color="#FFE9A8"/><stop offset=".34" stop-color="#C9963A"/>
      <stop offset=".55" stop-color="#FFF6D2"/><stop offset=".7" stop-color="#B8822A"/><stop offset="1" stop-color="#FFE08A"/></linearGradient>
    <radialGradient id="coinG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6D2"/><stop offset=".45" stop-color="#F2C860"/><stop offset="1" stop-color="#A87A2A"/></radialGradient>
    <linearGradient id="foilH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9A6A22"/><stop offset=".3" stop-color="#FFEDB0"/><stop offset=".5" stop-color="#C9963A"/>
      <stop offset=".75" stop-color="#FFF4CC"/><stop offset="1" stop-color="#A87A2A"/></linearGradient>
    <linearGradient id="silverFoil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6E7AA8"/><stop offset=".3" stop-color="#F2F6FF"/><stop offset=".5" stop-color="#9AA6CC"/><stop offset=".75" stop-color="#FFFFFF"/><stop offset="1" stop-color="#7A86B4"/></linearGradient>
    <pattern id="linen" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="${C.cover}"/><path d="M0 .5H4M0 2.5H4" stroke="${C.coverL}" stroke-width=".7" opacity=".55"/>
      <path d="M.5 0V4M2.5 0V4" stroke="${C.coverD}" stroke-width=".7" opacity=".6"/></pattern>
    <pattern id="ridges" width="4" height="10" patternUnits="userSpaceOnUse">
      <rect width="4" height="10" fill="none"/><rect x="0" width="2" height="10" fill="${C.tabEdge}" opacity=".45"/><rect x="2" width="1" height="10" fill="#FFF3C2" opacity=".6"/></pattern>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="5" height="5" fill="none"/><path d="M0 0V5" stroke="#000" stroke-width="1.2" opacity=".14"/></pattern>
    ${extra}
  </defs>`;
  }

  // Full-scene paper grain + low-frequency mottle. Apply last, over everything except UI text.
  function grain(w = 390, h = 844, op = 0.55) {
    return `<rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".18" style="mix-blend-mode:soft-light" pointer-events="none"/>
      <rect width="${w}" height="${h}" filter="url(#grain)" opacity="${op}" style="mix-blend-mode:soft-light" pointer-events="none"/>`;
  }

  // Washi/kraft fibres: short curved hairlines, seeded.
  function fibers(x, y, w, h, n, color, seed = 1, op = 0.25) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const px = x + r() * w, py = y + r() * h, a = r() * Math.PI * 2, L = 4 + r() * 14;
      const ex = px + Math.cos(a) * L, ey = py + Math.sin(a) * L;
      const cx = (px + ex) / 2 + (r() - 0.5) * 6, cy = (py + ey) / 2 + (r() - 0.5) * 6;
      s += `<path d="M${f1(px)} ${f1(py)}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}"/>`;
    }
    return `<g fill="none" stroke="${color}" stroke-width=".55" stroke-linecap="round" opacity="${op}">${s}</g>`;
  }

  // Scalloped cloud/edge band (cut-paper silhouette). Top edge is scalloped, bottom is flat at yb.
  function scallopBand(x0, x1, yTop, yb, seed, amp = 10, step = 26) {
    const r = rng(seed); let d = `M${x0} ${yb}L${x0} ${yTop}`; let x = x0;
    while (x < x1) {
      const w = step * (0.7 + r() * 0.7), h = amp * (0.5 + r());
      d += `Q${f1(x + w / 2)} ${f1(yTop - h * 1.6)} ${f1(Math.min(x + w, x1))} ${f1(yTop + (r() - 0.5) * amp * 0.6)}`;
      x += w;
    }
    return d + `L${x1} ${yb}Z`;
  }

  // City silhouette with lit pinprick windows.
  function skyline(x0, x1, base, seed, { fill, minH = 20, maxH = 70, win = C.lamp, winP = 0.18, winOp = 0.85 } = {}) {
    const r = rng(seed); let d = `M${x0} ${base}`; let x = x0; const wins = [];
    while (x < x1) {
      const w = 10 + r() * 24, h = minH + r() * (maxH - minH);
      d += `L${f1(x)} ${f1(base - h)}`;
      if (r() < 0.25) d += `L${f1(x + w * 0.3)} ${f1(base - h)}L${f1(x + w * 0.3)} ${f1(base - h - 6)}L${f1(x + w * 0.45)} ${f1(base - h - 6)}L${f1(x + w * 0.45)} ${f1(base - h)}`;
      d += `L${f1(x + w)} ${f1(base - h)}`;
      for (let wy = base - h + 5; wy < base - 4; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < winP) wins.push([wx, wy]);
      x += w;
    }
    d += `L${x1} ${base}Z`;
    return { d, wins: `<g fill="${win}" opacity="${winOp}">${wins.map(([a, b]) => `<rect x="${f1(a)}" y="${f1(b)}" width="1.8" height="2.4"/>`).join('')}</g>`, fill };
  }

  // Pinhole stars: light coming through needle holes in the backdrop page.
  function pinholes(x, y, w, h, n, seed, color = '#FFF3C8') {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const px = x + r() * w, py = y + r() * h * r(); const big = r() < 0.12;
      const rr = big ? 1.4 : 0.55 + r() * 0.6;
      s += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(rr)}" opacity="${f1(0.55 + r() * 0.45)}"/>`;
      if (big) s += `<path d="M${f1(px - 5)} ${f1(py)}H${f1(px + 5)}M${f1(px)} ${f1(py - 5)}V${f1(py + 5)}" stroke="${color}" stroke-width=".5" opacity=".7"/>`;
    }
    return `<g fill="${color}" filter="url(#glowS)">${s}</g>`;
  }

  // Four-point paper sparkle (foil cut-out).
  function sparkle(x, y, r, fill = 'url(#foil)', op = 1) {
    return `<path d="M${x} ${y - r}Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z" fill="${fill}" opacity="${op}"/>`;
  }

  // Red verb seal (印章) carrying the action word. The seal is the redundant "this is touchable" cue.
  function seal(x, y, ch, r = 13) {
    return `<g transform="translate(${x} ${y})">
      <rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.32}" fill="${C.seal}" filter="url(#deckle)"/>
      <rect x="${-r + 2.2}" y="${-r + 2.2}" width="${2 * r - 4.4}" height="${2 * r - 4.4}" rx="${r * 0.22}" fill="none" stroke="#FFE7D8" stroke-width="1" opacity=".75"/>
      <text y="${r * 0.38}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${r * 1.12}" fill="#FFF4EA">${ch}</text></g>`;
  }

  // Brass split-pin (paper fastener) = pivot of a wheel; marigold brad = "linked to a tab".
  function brad(x, y, r = 4.5, linked = false) {
    return `<g transform="translate(${x} ${y})"><circle r="${r + 1}" fill="${C.shadow}" opacity=".35" transform="translate(.8 1.2)"/>
      <circle r="${r}" fill="url(#foil)"/><circle r="${r * 0.45}" cx="${-r * 0.25}" cy="${-r * 0.3}" fill="#FFF8DC" opacity=".8"/>
      ${linked ? `<circle r="${r + 2.4}" fill="none" stroke="${C.tab}" stroke-width="1.6" stroke-dasharray="2 2"/>` : ''}</g>`;
  }

  // 拉 Pull-tab: tongue sticking out of a slot, ridged grip end, seal + arrow, riding a dashed track.
  function pullTab(x, y, { w = 112, h = 44, dir = 1, label = '拉', track = 120, slotY = null, wiggle = true } = {}) {
    const ridges = `<rect x="${w - 30}" y="6" width="22" height="${h - 12}" rx="4" fill="url(#ridges)"/>`;
    const arrow = `<path d="M${w * 0.42} ${h / 2}H${w * 0.66}" stroke="${C.sealD}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M${w * 0.62} ${h / 2 - 7}L${w * 0.7} ${h / 2}L${w * 0.62} ${h / 2 + 7}" fill="none" stroke="${C.sealD}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    const trackSvg = `<g opacity=".85"><path d="M${w + 4} ${h / 2}H${w + track}" stroke="${C.tabL}" stroke-width="2.2" stroke-dasharray="1 7" stroke-linecap="round"/>
      <path d="M${w + track - 8} ${h / 2 - 6}L${w + track} ${h / 2}L${w + track - 8} ${h / 2 + 6}" fill="none" stroke="${C.tabL}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    return `<g transform="translate(${x} ${y}) scale(${dir} 1)">
      ${trackSvg}
      ${wiggle ? `<g stroke="${C.tabL}" stroke-width="1.8" stroke-linecap="round" opacity=".9"><path d="M-8 6l-6 -4M-9 ${h / 2}h-7M-8 ${h - 6}l-6 4"/></g>` : ''}
      <g filter="url(#z3)">
        <rect width="${w}" height="${h}" rx="${h * 0.34}" fill="url(#tabG)"/>
        <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${h * 0.3}" fill="none" stroke="#FFF6D6" stroke-width="1.2" opacity=".7"/>
        ${ridges}${arrow}
      </g>
      <g transform="scale(${dir} 1)">${seal(dir * 22, h / 2, label, 14)}</g>
    </g>`;
  }

  // 轉 Paper wheel (volvelle) with scalloped grip rim, brad pivot and curved arrows.
  function wheel(x, y, r, { teeth = 18, label = '轉', face = '', rot = 0 } = {}) {
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.5) / teeth) * Math.PI * 2, a2 = ((i + 1) / teeth) * Math.PI * 2;
      const p = (a, rr) => `${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr)}`;
      d += (i ? 'L' : 'M') + p(a0, r) + `Q${p(a1, r * 1.12)} ${p(a2, r)}`;
    }
    return `<g transform="translate(${x} ${y})">
      <g stroke="${C.tabL}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".95">
        <path d="M${f1(-r * 0.55)} ${f1(-r * 1.32)}A${r * 1.42} ${r * 1.42} 0 0 1 ${f1(r * 0.9)} ${f1(-r * 1.1)}"/>
        <path d="M${f1(r * 0.62)} ${f1(-r * 1.32)}l${f1(r * 0.3)} ${f1(r * 0.2)}l${f1(-r * 0.05)} ${f1(r * 0.34)}" stroke-linejoin="round"/></g>
      <g filter="url(#z3)" transform="rotate(${rot})"><path d="${d}Z" fill="url(#tabR)"/>
        <circle r="${r * 0.78}" fill="none" stroke="${C.tabEdge}" stroke-width="1" opacity=".5"/>
        <circle r="${r * 0.74}" fill="none" stroke="#FFF6D6" stroke-width="1" opacity=".6"/>${face}</g>
      ${brad(0, 0, r * 0.16)}
      ${label ? seal(r * 0.82, r * 0.82, label, 11) : ''}
    </g>`;
  }

  // Simple die-cut thought bubble on a coiled wire spring (bobs when he changes his mind).
  function springBubble(x0, y0, x1, y1, content, { w = 96, h = 48 } = {}) {
    const n = 7; let d = `M${x0} ${y0}`;
    for (let i = 1; i <= n * 2; i++) {
      const t = i / (n * 2), px = x0 + (x1 - x0) * t, py = y0 + (y1 + h / 2 - y0) * t, s = i % 2 ? 4 : -4;
      d += `L${f1(px + s)} ${f1(py)}`;
    }
    const bx = x1 - w / 2, by = y1 - h / 2;
    const cloud = `M${bx + 14} ${by + h}Q${bx - 6} ${by + h} ${bx + 2} ${by + h * 0.55}Q${bx - 4} ${by + 6} ${bx + 18} ${by + 6}
      Q${bx + 26} ${by - 6} ${bx + w * 0.45} ${by + 2}Q${bx + w * 0.62} ${by - 7} ${bx + w * 0.78} ${by + 4}Q${bx + w + 6} ${by + 4} ${bx + w - 2} ${by + h * 0.5}
      Q${bx + w + 6} ${by + h + 2} ${bx + w - 16} ${by + h}Z`;
    return `<path d="${d}" fill="none" stroke="#1A1238" stroke-width="2.6" stroke-linejoin="round" opacity=".35" transform="translate(1 1.5)"/><path d="${d}" fill="none" stroke="#E9E4F4" stroke-width="1.6" stroke-linejoin="round"/>
      <g filter="url(#z3)"><path d="${cloud}" fill="#FBF6EC"/></g>${content}`;
  }

  // Character standee: baked anime sprite, die-cut with a white border, a fold-back easel tab and contact shadow.
  function standee(href, x, yFeet, h, aspect, { flip = false, glow = null, shadowW = null } = {}) {
    const w = h * aspect; const sw = shadowW || w * 0.8;
    return `<g>
      <ellipse cx="${x + (flip ? -1 : 1) * 6}" cy="${yFeet + 2}" rx="${sw / 2}" ry="${Math.max(3, h * 0.035)}" fill="${C.shadow}" opacity=".5" filter="url(#blur3)"/>
      <path d="M${x - w * 0.18} ${yFeet + 1}L${x - w * 0.12} ${yFeet - h * 0.22}L${x + w * 0.12} ${yFeet - h * 0.22}L${x + w * 0.28} ${yFeet + 3}Z" fill="#D9CDBB" opacity=".9"/>
      ${glow ? `<ellipse cx="${x}" cy="${yFeet - h * 0.5}" rx="${w * 0.75}" ry="${h * 0.55}" fill="${glow}" opacity=".18" filter="url(#blur18)"/>` : ''}
      <image href="${href}" x="${x - w / 2}" y="${yFeet - h}" width="${w}" height="${h}" filter="url(#standee)" ${flip ? `transform="translate(${2 * x} 0) scale(-1 1)"` : ''}/>
    </g>`;
  }

  // Vellum (tracing paper) ghost hand for hints.
  function ghostHand(x, y, s = 1, rot = 0) {
    // fingertip at (0,0); vellum = translucent, white edge, soft shadow. Group opacity keeps overlaps clean.
    const shape = (fill, stroke) => `<g fill="${fill}" stroke="${stroke}" stroke-width="${stroke === 'none' ? 0 : 3.2}" stroke-linejoin="round">
      <rect x="-7" y="0" width="14" height="40" rx="7"/>
      <rect x="-10" y="26" width="44" height="36" rx="13"/>
      <rect x="5" y="20" width="12" height="20" rx="6"/><rect x="16" y="22" width="12" height="20" rx="6"/><rect x="26" y="26" width="10" height="18" rx="5"/>
      <rect x="-22" y="36" width="22" height="12" rx="6" transform="rotate(28 -11 42)"/>
      <rect x="-6" y="56" width="34" height="18" rx="6"/></g>`;
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <g opacity=".5" transform="translate(3 6)" filter="url(#blur3)">${shape(C.shadow, 'none')}</g>
      <g opacity=".8">${shape('#FFFFFF', '#FFFFFF')}${shape('#E9E6FA', 'none')}</g>
      <g fill="none" stroke="#BDB6DE" stroke-width="1.1" stroke-linecap="round" opacity=".9"><path d="M-3 6a4 3 0 0 1 6 0"/><path d="M11 28v8M22 30v8M31 33v6"/></g></g>`;
  }

  // The book: navy linen cover, gold-foil corner ornaments.
  function cover(w = 390, h = 844) {
    const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="url(#foil)" stroke-width="1.4" opacity=".9">
      <path d="M0 28V0H28"/><path d="M5 22V5H22"/><path d="M9 9l7 7M5 5" /><circle cx="16" cy="16" r="2.2" fill="url(#foil)" stroke="none"/></g>`;
    return `<rect width="${w}" height="${h}" fill="url(#linen)"/>
      <rect width="${w}" height="${h}" fill="url(#vign)"/>
      ${corner(8, 8, 1, 1)}${corner(w - 8, 8, -1, 1)}${corner(8, h - 8, 1, -1)}${corner(w - 8, h - 8, -1, -1)}`;
  }

  // Cream paper label (chapter header) on the cover, held by washi tape.
  function washi(x, y, w, h, rot, color = '#E9A9A0', op = 0.78) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${color}" opacity="${op}" filter="url(#torn)"/>
      <g opacity=".35" stroke="#FFF" stroke-width="1">${Array.from({ length: Math.floor(w / 6) }, (_, i) => `<path d="M${-w / 2 + 3 + i * 6} ${-h / 2 + 2}l3 ${h - 4}"/>`).join('')}</g></g>`;
  }


  // ---- shared screen chrome ----
  function hud({ title, sub, time, filled = 2, moon = true, page = '' }) {
    return `<g transform="rotate(-.6 195 50)">
  <g filter="url(#z2)"><rect x="16" y="14" width="358" height="74" rx="3" fill="${C.page}" filter="url(#deckle)"/></g>
  ${fibers(18, 16, 354, 70, 70, '#A88A5E', 4, .22)}
  <text x="32" y="50" font-family="'Noto Serif TC'" font-weight="900" font-size="27" fill="${C.ink}" letter-spacing="2">${title}${page ? `<tspan font-size="15" font-weight="700" fill="${C.seal}" letter-spacing="0" dx="4">「${page}」</tspan>` : ''}</text>
  <text x="33" y="75" font-size="14" font-weight="700" fill="${C.inkSoft}">${sub}</text>
  <g transform="translate(250 24)">
    <rect width="110" height="34" rx="17" fill="${C.cover}"/><rect x="2" y="2" width="106" height="30" rx="15" fill="none" stroke="url(#foil)" stroke-width="1.2"/>
    ${moon ? `<path d="M24 9a9 9 0 1 0 8 13a7 7 0 1 1 -8 -13z" fill="url(#foil)"/>` : `<circle cx="24" cy="17" r="6" fill="url(#foil)"/><path d="M24 5v3M24 26v3M12 17h3M33 17h3M16 9l2 2M30 23l2 2M16 25l2 -2M30 11l2 -2" stroke="${C.gold}" stroke-width="1.6" stroke-linecap="round"/>`}
    <text x="70" y="24" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="19" fill="${C.goldL}">${time}</text>
  </g>
  <g transform="translate(176 68)">
    ${Array.from({ length: 9 }, (_, i) => i < filled
      ? `<circle cx="${i * 18 + 7}" cy="0" r="6.5" fill="url(#coinG)"/><circle cx="${i * 18 + 7}" cy="0" r="4.6" fill="none" stroke="#9A6A22" stroke-width=".7" opacity=".6"/><circle cx="${i * 18 + 5}" cy="-2" r="2" fill="#FFF8DC" opacity=".8"/>`
      : `<circle cx="${i * 18 + 7}" cy="0" r="6" fill="${C.pageD}"/><circle cx="${i * 18 + 7}" cy=".8" r="6" fill="none" stroke="#FFF7E6" stroke-width="1"/><circle cx="${i * 18 + 7}" cy="-.4" r="6" fill="none" stroke="#B7A07A" stroke-width=".8"/>`).join('')}
    <text x="172" y="5" font-size="12" font-weight="700" fill="${C.inkSoft}" text-anchor="end" dx="16">抓周</text>
  </g>
</g>
${washi(44, 16, 50, 15, -8)}${washi(352, 84, 46, 14, 10, '#9CC9C2')}`;
  }

  function bookBlock(FX0, FX1, FB) {
    return `<rect x="6" y="94" width="378" height="614" rx="8" fill="${C.coverD}"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path d="M${FX0 - 1 + i * 0.4} ${FB + 2 + i * 2.4}H${FX1 + 1 - i * 0.4}" stroke="${i % 2 ? '#CDB993' : '#EADBBB'}" stroke-width="2"/>`).join('')}`;
  }

  // Bottom bar per GDD §2.1: [寶咖咖 portrait → word ring] [提示] [重來] [選單] + stickers 解開 · 淘氣 · 土地公
  function tray(SPR, { done = [0, 0, 0] } = {}) {
    const btn = (x, label, icon, ring = 'url(#foil)', r = 28) => `<g transform="translate(${x} 764)">
  <g filter="url(#z2)"><circle r="${r}" fill="${C.page}"/></g><circle r="${r - 2.5}" fill="none" stroke="${ring}" stroke-width="2.2"/>${icon}
  <text y="${r + 24}" text-anchor="middle" font-size="15" font-weight="900" fill="#F4EEDC">${label}</text></g>`;
    let s = `<circle cx="46" cy="764" r="35" fill="${C.tab}" opacity=".25" filter="url(#blur3)"/>`;
    s += btn(46, '說話', `<clipPath id="pClip"><circle r="25"/></clipPath><g clip-path="url(#pClip)"><circle r="25" fill="#FFF3D6"/><image href="${SPR}baokaka-head-happy@3x.webp" x="-24" y="-22" width="48" height="52"/></g>`, C.tab, 31);
    s += `<circle cx="46" cy="764" r="35" fill="none" stroke="${C.tab}" stroke-width="2" stroke-dasharray="3 4"/>`;
    s += btn(116, '提示', `<path d="M0 -14a10.5 10.5 0 0 1 6.5 18.5V7h-13V4.5A10.5 10.5 0 0 1 0 -14z" fill="#FFD27A" stroke="#8A5E1E" stroke-width="1.6"/><path d="M-5.5 11h11M-3.5 15h7" stroke="#8A5E1E" stroke-width="2" stroke-linecap="round"/>`);
    s += btn(178, '重來', `<path d="M9 -8A12 12 0 1 0 12 3" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M3 -13L11 -9L8 -1" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
    s += btn(240, '選單', `<path d="M-10 -7H10M-10 0H10M-10 7H10" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round"/>`);
    const stick = (x, label, d, icon) => `<g transform="translate(${x} 758)"><circle r="15" fill="#2B3274"/><circle r="15" cy="1.2" fill="none" stroke="#4A54A8" stroke-width="1.2"/>
  <circle r="15" cy="-1" fill="none" stroke="#0A0C26" stroke-width="1.2" opacity=".7"/>
  ${d ? `<circle r="13.5" fill="url(#foil)"/>${icon}` : `<circle r="11" fill="none" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="2.5 3" opacity=".7"/>`}
  <text y="33" text-anchor="middle" font-size="12" font-weight="700" fill="#C9CBEF">${label}</text></g>`;
    return s + stick(290, '解開', done[0], `<path d="M-6 0l4 4l8 -9" fill="none" stroke="#7A5410" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`)
      + stick(328, '淘氣', done[1], `<text y="5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="#7A5410">嘿</text>`)
      + stick(366, '土地公', done[2], `<path d="M-7 0a7 7 0 0 1 14 0z" fill="#C8342C"/><path d="M-5 1q5 9 10 0z" fill="#FBF6EC"/>`);
  }

  // 金珠珠: the page goal (a gold-foil bead in a little paper cup of light)
  function bead(x, y, r = 9) {
    return `<g transform="translate(${x} ${y})"><circle r="${r * 3.2}" fill="#FFE08A" opacity=".28" filter="url(#blur8)"/>
      <ellipse cy="${r + 3}" rx="${r * 1.2}" ry="${r * .3}" fill="${C.shadow}" opacity=".45" filter="url(#blur3)"/>
      <g filter="url(#z4)"><circle r="${r}" fill="url(#foil)"/></g><circle cx="${-r * .35}" cy="${-r * .38}" r="${r * .3}" fill="#FFFBEA"/>
      ${sparkle(-r * 1.9, -r * 1.5, r * .7)}${sparkle(r * 1.8, -r * 2.2, r * .5)}${sparkle(r * 1.7, r * .2, r * .35)}</g>`;
  }

  // Crawling Baokaka standee: v2 pose frame `baokaka-crawl-0` (225×237 @3x, faces right), die-cut like every standee.
  // x = body centre, yG = ground line, h = drawn height in px (~70 at 390 wide per GDD §3.9).
  function crawlBaby(SPR, x, yG, h = 70, flip = false, frame = 'baokaka-crawl-0') {
    const w = h * 225 / 237;
    return `<g><ellipse cx="${x}" cy="${yG}" rx="${w * .42}" ry="${Math.max(2.5, h * .04)}" fill="${C.shadow}" opacity=".5" filter="url(#blur3)"/>
      <ellipse cx="${x}" cy="${yG - h * .5}" rx="${w * .7}" ry="${h * .6}" fill="#FFD98A" opacity=".16" filter="url(#blur18)"/>
      <image href="${SPR}${frame}@3x.webp" x="${x - w / 2}" y="${yG - h + h * .03}" width="${w}" height="${h}" filter="url(#standee)" ${flip ? `transform="translate(${2 * x} 0) scale(-1 1)"` : ''}/></g>`;
  }

  // 翻 Flap: a card with a lifted dog-ear corner showing its kraft back + finger notch + seal.
  function flap(x, y, w, h, { face = '#7A5AA0', label = '翻', open = 0 } = {}) {
    const c = 22 + open * 20;
    return `<g transform="translate(${x} ${y})">
      <g filter="url(#z3)"><path d="M0 0H${w}V${h - c}L${w - c} ${h}H0Z" fill="${face}"/>
        <path d="M2 2H${w - 2}" stroke="#FFFFFF" stroke-width="1" opacity=".35"/></g>
      <g filter="url(#z4)"><path d="M${w} ${h - c}L${w - c} ${h}L${w - c * 0.35} ${h + c * 0.42}Z" fill="url(#tabG)"/>
        <path d="M${w - c} ${h}L${w - c * 0.35} ${h + c * 0.42}" stroke="${C.tabEdge}" stroke-width="1" opacity=".6"/></g>
      <path d="M${w - c * 0.2} ${h + c * 0.62}q8 6 14 2" stroke="${C.tabL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M${w + 4} ${h - c * 0.4}l6 -3M${w - c * 0.5} ${h + c * 0.95}l-1 6" stroke="${C.tabL}" stroke-width="1.8" stroke-linecap="round"/>
      ${seal(16, 16, label, 11)}</g>`;
  }
  // 滑 Slider: knob riding a slot inside the scene.
  function slider(x, y, len, pos = 0.3, label = '推') {
    const kx = len * pos;
    return `<g transform="translate(${x} ${y})">
      <rect x="-4" y="-5" width="${len + 8}" height="10" rx="5" fill="#140C34" opacity=".55"/><rect x="-4" y="-5" width="${len + 8}" height="2" rx="1" fill="#000" opacity=".35"/>
      <path d="M${kx + 26} 0H${len}" stroke="${C.tabL}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>
      <path d="M${len - 6} -5L${len} 0L${len - 6} 5" stroke="${C.tabL}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g filter="url(#z3)"><rect x="${kx - 16}" y="-15" width="32" height="30" rx="10" fill="url(#tabG)"/>
      <rect x="${kx - 9}" y="-9" width="18" height="18" rx="3" fill="url(#ridges)"/></g>
      ${seal(kx - 24, -22, label, 9)}</g>`;
  }
  // Mocha perch marker: chalk paw print + soft marigold halo (only while Mocha is available).
  function perch(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="22" ry="7" fill="${C.tab}" opacity=".3" filter="url(#blur3)"/>
      <g fill="#FFF7E0"><ellipse cx="0" cy="1" rx="4.6" ry="3.6"/><circle cx="-5.5" cy="-4" r="1.9"/><circle cx="-1.8" cy="-6.4" r="1.9"/><circle cx="2.2" cy="-6.4" r="1.9"/><circle cx="5.8" cy="-4" r="1.9"/></g></g>`;
  }

  window.K = { C, rng, f1, defs, depthFilter, grain, fibers, scallopBand, skyline, pinholes, sparkle, seal, brad, pullTab, wheel, springBubble, standee, ghostHand, cover, washi, hud, bookBlock, tray, bead, crawlBaby, flap, slider, perch };
})();
