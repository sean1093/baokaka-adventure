"""Option D battle + dialogue mocks: anime-film backdrop, anime-JRPG UI."""
D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">'
def boba(i):
    return f'''<svg viewBox="0 0 100 100"><defs>
<radialGradient id="pb{i}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#5A3A5E"/><stop offset=".55" stop-color="#2A1630"/><stop offset="1" stop-color="#160A1A"/></radialGradient>
<linearGradient id="pi{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A0E3A"/><stop offset=".5" stop-color="#D23A8A"/><stop offset="1" stop-color="#FFB0D8"/></linearGradient>
<radialGradient id="ps{i}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E1430" stop-opacity=".5"/><stop offset="1" stop-color="#1E1430" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="50" cy="93" rx="28" ry="5" fill="url(#ps{i})"/>
<path d="M58,24 L68,5" stroke="#5A2C34" stroke-width="9.6" stroke-linecap="round"/><path d="M58,24 L68,5" stroke="#FF7F9E" stroke-width="6.4" stroke-linecap="round"/><path d="M61.4,20 L66,11" stroke="#C84A6E" stroke-width="2" stroke-linecap="round"/><path d="M59,17 L62.4,10.4" stroke="#FFE0EA" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="50" cy="58" r="33" fill="url(#pb{i})" stroke="#5A2C34" stroke-width="2.6"/>
<path d="M24,72 C34,90 66,92 80,74 C72,84 54,88 40,84 C32,81 27,77 24,72 Z" fill="#0E0610"/>
<path d="M78,42 C86,56 84,74 72,84" stroke="#D3A8FF" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>
<path d="M28,40 C32,32 40,28 46,28 C40,32 34,38 31,46 Z" fill="#FFFFFF" opacity=".8"/><circle cx="52" cy="30" r="2" fill="#fff" opacity=".7"/>
<g><path d="M30,58 C30,51 44,50 46,58 C46,66 32,68 30,58 Z" fill="#fff"/><ellipse cx="39" cy="59.6" rx="5" ry="6" fill="url(#pi{i})"/><ellipse cx="39.4" cy="60.4" rx="2" ry="3" fill="#20061A"/><circle cx="37.2" cy="57" r="1.6" fill="#fff"/><circle cx="41.4" cy="62.6" r=".8" fill="#fff"/><path d="M29,58 C30,50 44,48 47,56 L48,54 C44,46 30,47 28,56 Z" fill="#1A0812"/></g>
<g><path d="M54,58 C54,50 68,50 70,58 C70,66 56,68 54,58 Z" fill="#fff"/><ellipse cx="61" cy="59.6" rx="5" ry="6" fill="url(#pi{i})"/><ellipse cx="60.6" cy="60.4" rx="2" ry="3" fill="#20061A"/><circle cx="58.8" cy="57" r="1.6" fill="#fff"/><circle cx="63" cy="62.6" r=".8" fill="#fff"/><path d="M53,56 C56,48 70,50 71,58 L72,56 C70,47 56,46 52,54 Z" fill="#1A0812"/></g>
<path d="M30,47 C35,46 41,48 45,51 M70,47 C65,46 59,48 55,51" stroke="#E9DAF2" stroke-width="2.2" stroke-linecap="round" fill="none"/>
<path d="M43,72 C47,76.6 54,76.6 58,72 C54,73.6 47,73.6 43,72 Z" fill="#A83E5A" stroke="#5A2C34" stroke-width="1.2"/><path d="M45.6,72.6 L46.6,75 L47.6,72.8 Z" fill="#fff"/>
<ellipse cx="30" cy="67" rx="5" ry="2.6" fill="#FF7FA6" opacity=".45"/><ellipse cx="70" cy="67" rx="5" ry="2.6" fill="#FF7FA6" opacity=".45"/>
<path d="M26.4,65 l2,-3.6 M29.6,66 l2,-3.6 M68.4,66 l2,-3.6 M71.6,65 l2,-3.6" stroke="#FF7FA6" stroke-width=".9" stroke-linecap="round" opacity=".8"/></svg>'''

def backdrop():
    import random; random.seed(3)
    stalls=''
    awn=[('#E85A4A','#FFF3E0'),('#2FA39A','#FFF3E0'),('#F2A93B','#FFF3E0'),('#E85A4A','#FFF3E0')]
    for k,x in enumerate([-8,92,192,292]):
        c1,c2=awn[k]
        stripes=''.join(f'<path d="M{x+i*13},200 h6.5 v20 q-3.25,4.5 -6.5,0 Z" fill="{c2}"/>' for i in range(8))
        stalls+=f'''<rect x="{x+6}" y="214" width="94" height="82" fill="#1E1A44"/>
<rect x="{x+12}" y="226" width="82" height="42" fill="url(#bd-win)"/>
<rect x="{x+12}" y="226" width="82" height="42" fill="url(#bd-bloomR)" opacity=".6"/>
<path d="M{x+16},250 h14 v18 h-14 Z M{x+40},244 h18 v24 h-18 Z M{x+68},252 h16 v16 h-16 Z" fill="#7A3A2A" opacity=".45"/>
<path d="M{x},200 h104 v20 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 Z" fill="{c1}"/>{stripes}
<path d="M{x},200 h104 v4 h-104 Z" fill="#fff" opacity=".35"/><path d="M{x},214 h104 v6 h-104 Z" fill="#000" opacity=".18"/>'''
    def sign(x,t,c):
        return f'''<g filter="url(#bd-b6)" opacity=".85"><rect x="{x-36}" y="146" width="72" height="34" rx="8" fill="{c}"/></g>
<rect x="{x-34}" y="148" width="68" height="30" rx="7" fill="#FFF6E2" stroke="{c}" stroke-width="2.4"/>
<text x="{x}" y="170" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="18" fill="{c}">{t}</text>'''
    lan=''.join(f'''<circle cx="{x}" cy="{y+8}" r="18" fill="url(#bd-bloom)"/><ellipse cx="{x}" cy="{y+8}" rx="7.4" ry="8.6" fill="url(#bd-lan)" stroke="#6E1E24" stroke-width="1"/><path d="M{x-7},{y+8} h14 M{x-6},{y+3.6} h12 M{x-6},{y+12.4} h12" stroke="#A82A2A" stroke-width=".7" opacity=".7"/><rect x="{x-3}" y="{y-1.6}" width="6" height="2.4" fill="#2A1E3A"/><ellipse cx="{x-2.6}" cy="{y+5}" rx="1.6" ry="2.6" fill="#FFE6C8" opacity=".8"/>''' for x,y in [(36,112),(92,126),(148,132),(206,132),(262,126),(318,114),(370,100)])
    refl=''.join(f'<rect x="{x}" y="304" width="{w}" height="{h}" fill="{c}" opacity=".5"/>' for x,w,h,c in [(24,10,90,'#FF7A6A'),(160,10,80,'#FFC27A'),(300,10,90,'#6AE0D0'),(80,4,60,'#FFD98A'),(232,4,70,'#FFD98A'),(140,4,50,'#FF9A9A')])
    stars=''.join(f'<circle cx="{random.uniform(0,390):.0f}" cy="{random.uniform(0,90):.0f}" r="{random.choice([.5,.8,1.1])}" fill="#fff" opacity="{random.choice([.5,.8,1])}"/>' for _ in range(40))
    win=''.join(f'<rect x="{random.uniform(0,388):.0f}" y="{random.uniform(132,188):.0f}" width="1.8" height="1.8" fill="{random.choice(["#FFD98A","#FFE9C0","#9AE0FF"])}" opacity=".8"/>' for _ in range(60))
    return f'''<svg viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1238"/><stop offset=".45" stop-color="#26307A"/><stop offset=".8" stop-color="#7A5AA4"/><stop offset="1" stop-color="#E88E8A"/></linearGradient>
<linearGradient id="bd-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9B0"/><stop offset="1" stop-color="#F29A4A"/></linearGradient>
<radialGradient id="bd-bloomR" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#FFFBE6" stop-opacity=".9"/><stop offset="1" stop-color="#FFFBE6" stop-opacity="0"/></radialGradient>
<radialGradient id="bd-bloom" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD0A0" stop-opacity=".75"/><stop offset=".4" stop-color="#FF9A6A" stop-opacity=".3"/><stop offset="1" stop-color="#FF7A5A" stop-opacity="0"/></radialGradient>
<radialGradient id="bd-lan" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFB08A"/><stop offset=".5" stop-color="#E8443A"/><stop offset="1" stop-color="#A8282C"/></radialGradient>
<linearGradient id="bd-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3A6A"/><stop offset=".4" stop-color="#2A2448"/><stop offset="1" stop-color="#14122E"/></linearGradient>
<linearGradient id="bd-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3474"/><stop offset=".7" stop-color="#5A5AA4"/><stop offset="1" stop-color="#F0B0C8"/></linearGradient>
<radialGradient id="bd-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#0A0820" stop-opacity="0"/><stop offset="1" stop-color="#0A0820" stop-opacity=".65"/></radialGradient>
<radialGradient id="bd-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".42"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></radialGradient>
<filter id="bd-b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="bd-b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="bd-b1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1"/></filter></defs>
<rect width="390" height="500" fill="url(#bd-sky)"/>{stars}
<circle cx="318" cy="62" r="44" fill="#DDE6FF" opacity=".18" filter="url(#bd-b6)"/><circle cx="318" cy="62" r="12" fill="#FFF8E6"/>
<g filter="url(#bd-b1)"><path d="M20,96 C18,84 34,78 44,84 C50,70 74,68 82,82 C94,74 116,80 114,94 C84,100 50,100 20,96 Z" fill="url(#bd-cl)"/><path d="M200,70 C198,60 212,54 222,60 C228,48 252,48 258,60 C270,54 290,60 288,72 C258,78 228,76 200,70 Z" fill="url(#bd-cl)" opacity=".85"/></g>
<path d="M0,196 V150 h20 v-14 h16 v20 h20 v-30 h18 v24 h14 v-10 h22 v18 h16 v-40 h18 v34 h20 v-16 h16 v22 h22 v-26 h16 v30 h18 v-20 h20 v26 h16 v-30 h22 v34 h18 V196 Z" fill="#1E1E4E"/>{win}
<ellipse cx="195" cy="200" rx="240" ry="40" fill="#FF9A7A" opacity=".25" filter="url(#bd-b6)"/>
<path d="M0,104 Q195,150 390,92" stroke="#2A1E3A" stroke-width="1.2" fill="none"/>{lan}
{stalls}
{sign(56,'雞排','#E85A4A')}{sign(195,'珍珠奶茶','#9A5A2E')}{sign(334,'臭豆腐','#2A8F88')}
<g filter="url(#bd-b6)" opacity=".5"><ellipse cx="70" cy="196" rx="26" ry="34" fill="#fff"/><ellipse cx="296" cy="188" rx="22" ry="30" fill="#fff"/></g>
<rect y="296" width="390" height="204" fill="url(#bd-floor)"/>
<g filter="url(#bd-b3)">{refl}</g>
<g stroke="#8A7AB0" stroke-width="1" opacity=".3"><path d="M195,296 L50,500 M195,296 L340,500 M195,296 L-90,450 M195,296 L480,450"/></g>
<ellipse cx="195" cy="410" rx="200" ry="80" fill="url(#bd-pool)"/>
<rect width="390" height="500" fill="url(#bd-vig)"/>
<g filter="url(#bd-b6)" opacity=".5"><circle cx="16" cy="300" r="14" fill="#FFC27A"/><circle cx="376" cy="270" r="10" fill="#FF9AB0"/></g></svg>'''

ICON={'atk':'<rect x="5" y="9" width="11" height="11" rx="1.5"/><path d="M5 9l4-4h11v11l-4 4M16 9l4-4"/>','skill':'<path d="M12 3l2.2 5.2L20 9l-4.3 3.8L17 18.5 12 15.6 7 18.5l1.3-5.7L4 9l5.8-.8z"/>','item':'<path d="M8 3h8l-1 4H9z"/><path d="M7 7h10l-1.4 13H8.4z"/><path d="M14 3l3-1.5"/>','def':'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>'}
def icon(k,c): return f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[k]}</svg>'
CSS='''*{box-sizing:border-box;margin:0}body{background:#05050F;font-family:'Chiron GoRound TC',system-ui,sans-serif}
:root{--gold:#E8C77A;--goldL:#FFE9B0;--navy:#141A4A;--ink:#F4F2FF;--mut:#BFC2EA}
.phone{position:relative;width:390px;height:844px;overflow:hidden;background:#0A0B24}
.sp{position:absolute}.sp svg,.sp img{display:block;width:100%;height:100%}
.chip{position:absolute;top:14px;padding:6px 16px;color:var(--ink);font:900 15px 'Noto Serif TC';letter-spacing:.06em;background:linear-gradient(rgba(20,24,72,.82),rgba(12,14,44,.82));border:1px solid rgba(232,199,122,.7);border-radius:4px;box-shadow:0 6px 16px -8px #000,inset 0 0 0 3px rgba(12,14,44,.82),inset 0 0 0 4px rgba(232,199,122,.25)}
.chip b{font-family:Fredoka;font-weight:600;color:var(--goldL);margin:0 2px}
.plate{position:absolute;top:58px;right:18px;width:206px;padding:8px 14px 10px;color:var(--ink);background:linear-gradient(90deg,rgba(60,20,70,.0),rgba(40,18,64,.9) 18%,rgba(40,18,64,.9));clip-path:polygon(10% 0,100% 0,100% 100%,0 100%);border-top:1px solid var(--gold);border-bottom:1px solid var(--gold)}
.plate .n{font:900 19px 'Noto Serif TC';letter-spacing:.08em}.plate .n small{font:600 13px Fredoka;color:var(--goldL);margin-left:6px}
.plate .t{font:700 11px 'Chiron GoRound TC';color:#E8B8FF;letter-spacing:.2em}
.dmg{position:absolute;z-index:6;font:700 44px Fredoka;color:#fff;-webkit-text-stroke:5px #C2185B;paint-order:stroke fill;text-shadow:0 0 14px rgba(255,90,160,.8),0 3px 0 #5A0A2A;font-style:italic}
.dmg span{display:block;font:900 15px 'Noto Serif TC';-webkit-text-stroke:3px #5A0A2A;color:#FFE9B0;margin-top:-8px;text-align:center;font-style:normal}
.turn{position:absolute;font:900 13px 'Noto Serif TC';color:#1A1440;background:linear-gradient(#FFF2C8,#E8C77A);padding:3px 12px;border-radius:2px;letter-spacing:.12em;box-shadow:0 0 12px rgba(255,220,140,.8)}
.turn::after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#E8C77A;border-bottom:0}
.panel{position:absolute;left:0;right:0;bottom:0;height:346px;padding:20px 14px 18px;color:var(--ink);background:linear-gradient(rgba(22,26,78,.96),rgba(10,11,34,.99));border-top:1px solid var(--gold);box-shadow:0 -10px 30px rgba(0,0,0,.6)}
.panel::before{content:'';position:absolute;left:10px;right:10px;top:5px;height:1px;background:linear-gradient(90deg,transparent,rgba(232,199,122,.55),transparent)}
.orn{position:absolute;left:50%;top:-7px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);background:linear-gradient(135deg,#FFF2C8,#C9A04A);box-shadow:0 0 10px rgba(255,220,140,.8)}
.party{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mem{position:relative;display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:6px;background:linear-gradient(rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(232,199,122,.3)}
.mem.on{border-color:var(--gold);box-shadow:0 0 14px rgba(232,199,122,.35),inset 0 0 12px rgba(232,199,122,.12)}
.ava{width:48px;height:48px;border-radius:50%;overflow:hidden;flex:none;position:relative;background:radial-gradient(circle at 50% 35%,#5A6AC8,#1E2462);box-shadow:0 0 0 1.5px var(--gold),0 0 0 3px rgba(12,14,44,1),0 0 0 4px rgba(232,199,122,.4)}
.ava img{position:absolute;width:190%;left:-45%;top:-4%}
.nm{font:900 16px 'Noto Serif TC';letter-spacing:.06em}
.bar{height:7px;border-radius:1px;background:rgba(0,0,0,.45);margin:4px 0 2px;box-shadow:0 0 0 1px rgba(232,199,122,.35);overflow:hidden}.bar i{display:block;height:100%}
.st{font:600 12px Fredoka;color:var(--mut);display:flex;justify-content:space-between;white-space:nowrap;gap:6px}
.prompt{margin:14px 4px 10px;display:flex;justify-content:space-between;align-items:center;font:900 17px 'Noto Serif TC';letter-spacing:.06em}
.prompt a{font:700 14px 'Chiron GoRound TC';color:var(--mut)}
.cmds{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cmd{position:relative;height:70px;border:1px solid rgba(232,199,122,.55);border-radius:6px;display:flex;align-items:center;gap:12px;padding:0 14px;background:linear-gradient(#262E74,#161B4C);color:#fff;font:900 21px 'Noto Serif TC';letter-spacing:.1em;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 8px 16px -10px #000}
.cmd::after{content:'';position:absolute;inset:3px;border:1px solid rgba(232,199,122,.18);border-radius:4px;pointer-events:none}
.cmd .ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;border:1px solid rgba(232,199,122,.7);background:rgba(232,199,122,.08)}
.cmd small{display:block;font:600 12px 'Chiron GoRound TC';color:var(--mut);letter-spacing:.04em;margin-top:1px}
.cmd.pri{background:linear-gradient(#FFEFC0,#F0C060 55%,#D89A3A);color:#1A1440;border-color:#FFF2C8;box-shadow:0 0 18px rgba(255,200,100,.55),inset 0 1px 0 #fff}
.cmd.pri small{color:#5A3A1A}.cmd.pri .ic{border-color:#5A3A1A;background:rgba(255,255,255,.35)}
'''
def battle():
    foes=''.join(f'<div class="sp" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px">{boba(i)}</div>' for i,(x,y,s) in enumerate([(212,204,94),(290,232,88),(246,288,100)]))
    pips=''.join(f'<div class="sp" style="left:{x}px;top:{y}px;width:58px;height:6px;background:rgba(0,0,0,.5);box-shadow:0 0 0 1px rgba(232,199,122,.5)"><i style="display:block;height:100%;width:{w}%;background:linear-gradient(90deg,#FF5A8A,#FF9AB8)"></i></div>' for x,y,w in [(230,300,100),(305,322,100),(268,390,40)])
    hit='''<svg class="sp" style="left:228px;top:290px;width:70px;height:70px;z-index:6" viewBox="0 0 100 100"><defs><radialGradient id="hx" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#FFE9A0" stop-opacity=".8"/><stop offset="1" stop-color="#FF9A6A" stop-opacity="0"/></radialGradient></defs>
<circle cx="50" cy="50" r="46" fill="url(#hx)"/><path d="M50,4 L55,42 L96,50 L55,58 L50,96 L45,58 L4,50 L45,42 Z" fill="#fff"/><path d="M50,22 L53,47 L78,50 L53,53 L50,78 L47,53 L22,50 L47,47 Z" fill="#FFE9A0"/>
<circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/><g fill="#FFE9A0"><circle cx="16" cy="22" r="2.4"/><circle cx="84" cy="80" r="2"/><circle cx="82" cy="20" r="1.6"/></g></svg>'''
    html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Battle Mock D</title>{FONT}<style>{CSS}</style></head><body><div class="phone">
<div class="sp" style="inset:0 0 auto 0;height:500px">{backdrop()}</div>
<span class="chip" style="left:18px">士林夜市 <b>03:40</b></span><span class="chip" style="right:18px">第<b>2</b>回合</span>
<div class="plate"><div class="t">ENEMY</div><div class="n">珍珠粉圓<small>×3</small></div></div>
{foes}{pips}{hit}<div class="dmg" style="left:170px;top:252px">18<span>好痛！</span></div>
<svg class="sp" style="left:2px;top:420px;width:170px;height:40px" viewBox="0 0 170 40"><defs><filter id="rg" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="3"/></filter></defs><ellipse cx="85" cy="20" rx="72" ry="12" fill="#FFD98A" opacity=".55" filter="url(#rg)"/><ellipse cx="85" cy="20" rx="72" ry="12" fill="none" stroke="#FFF2C8" stroke-width="1.4"/></svg>
<div class="sp" style="left:150px;top:330px;width:120px;height:120px"><img src="mocha-cat.svg"></div>
<div class="sp" style="left:-8px;top:268px;width:190px;height:190px"><img src="baokaka.svg"></div>
<span class="turn" style="left:40px;top:262px">輪到你</span>
<div class="panel"><span class="orn"></span>
<div class="party">
<div class="mem on"><span class="ava"><img src="sheet/head-happy.svg" style="width:100%;left:0;top:4%"></span><div style="flex:1;min-width:0"><div class="nm">寶咖咖</div><div class="bar"><i style="width:84%;background:linear-gradient(90deg,#3FC88A,#9AF0B8)"></i></div><div class="bar" style="height:5px"><i style="width:60%;background:linear-gradient(90deg,#4A8AF0,#9AC8FF)"></i></div><div class="st"><span>體力 84/100</span><span>元氣 9</span></div></div></div>
<div class="mem"><span class="ava"><img src="sheet/mhead-content.svg" style="width:100%;left:0;top:10%"></span><div style="flex:1;min-width:0"><div class="nm">摩卡貓</div><div class="bar"><i style="width:34%;background:linear-gradient(90deg,#F08A3A,#FFC27A)"></i></div><div class="bar" style="height:5px"><i style="width:88%;background:linear-gradient(90deg,#4A8AF0,#9AC8FF)"></i></div><div class="st"><span style="color:#FFC27A">體力 31/90</span><span>元氣 14</span></div></div></div>
</div>
<p class="prompt"><span>寶咖咖要做什麼？</span><a>逃跑 ›</a></p>
<div class="cmds">
<button class="cmd pri"><span class="ic">{icon('atk','#3A2A1A')}</span><span>攻擊<small>丟積木</small></span></button>
<button class="cmd"><span class="ic">{icon('skill','#FFE9B0')}</span><span>才藝<small>元氣 3</small></span></button>
<button class="cmd"><span class="ic">{icon('item','#FFE9B0')}</span><span>道具<small>4 樣</small></span></button>
<button class="cmd"><span class="ic">{icon('def','#FFE9B0')}</span><span>防禦<small>減傷一半</small></span></button>
</div></div></div></body></html>'''
    open(D+'battle.html','w').write(html)

def dialogue():
    html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Dialogue Mock D</title>{FONT}<style>{CSS}
.map{{position:absolute;left:-95px;top:-60px;width:580px;height:892px;border:0;filter:blur(1.2px) brightness(.9)}}
.scrim{{position:absolute;inset:0;background:linear-gradient(rgba(10,8,32,0) 45%,rgba(10,8,32,.75))}}
.bust{{position:absolute;left:-14px;top:318px;width:340px;height:310px;overflow:hidden}}
.bust img{{position:absolute;width:420px;left:-44px;top:-14px}}
.glow{{position:absolute;left:-20px;top:300px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(160,190,255,.45),rgba(160,190,255,0) 65%)}}
.box{{position:absolute;left:12px;right:12px;bottom:22px;min-height:172px;padding:30px 22px 18px;border-radius:6px;color:var(--ink);background:linear-gradient(rgba(24,28,84,.94),rgba(12,13,40,.97));border:1px solid var(--gold);box-shadow:0 18px 40px -12px #000,inset 0 0 0 4px rgba(12,13,40,.9),inset 0 0 0 5px rgba(232,199,122,.3)}}
.box .c{{position:absolute;width:10px;height:10px;transform:rotate(45deg);background:linear-gradient(135deg,#FFF2C8,#C9A04A)}}
.nameplate{{position:absolute;left:18px;top:-20px;padding:6px 26px 7px;font:900 19px 'Noto Serif TC';letter-spacing:.18em;color:#1A1440;background:linear-gradient(#FFF2C8,#E8C77A 60%,#C9A04A);clip-path:polygon(8% 0,100% 0,92% 100%,0 100%);box-shadow:0 0 14px rgba(255,220,140,.6)}}
.txt{{font:700 21px/1.7 'Chiron GoRound TC';letter-spacing:.02em}}.txt em{{font-style:normal;color:#FFD98A;text-shadow:0 0 10px rgba(255,200,100,.5)}}.txt .g{{opacity:.2}}
.foot{{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font:700 14px 'Chiron GoRound TC';color:var(--mut)}}
.next{{width:14px;height:14px;transform:rotate(45deg);background:linear-gradient(135deg,#FFF2C8,#C9A04A);box-shadow:0 0 10px rgba(255,220,140,.9)}}
.dots i{{display:inline-block;width:6px;height:6px;margin-right:6px;transform:rotate(45deg);border:1px solid var(--gold)}}.dots i.on{{background:var(--gold)}}
.hdr{{position:absolute;top:14px;left:14px;right:14px;display:flex;align-items:center;gap:10px}}
.home{{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(16,18,56,.85);border:1px solid rgba(232,199,122,.7)}}
.ttl{{padding:6px 16px 8px;border-radius:4px;background:linear-gradient(rgba(20,24,72,.86),rgba(12,14,44,.86));border:1px solid rgba(232,199,122,.6);color:var(--ink)}}
.ttl small{{display:block;font:700 12px 'Chiron GoRound TC';color:var(--mut);letter-spacing:.1em}}.ttl b{{font:900 19px 'Noto Serif TC';letter-spacing:.1em}}
.ttl i{{font:600 13px Fredoka;font-style:normal;color:var(--goldL);margin-left:8px}}
</style></head><body><div class="phone">
<object class="map" type="image/svg+xml" data="iso.svg"></object><div class="scrim"></div>
<div class="hdr"><span class="home"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFE9B0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/></svg></span><span class="ttl"><small>第 1 章 · 度晬前一晚</small><b>大安森林公園</b><i>00:24</i></span></div>
<div class="glow"></div><div class="bust"><img src="mocha-smug.svg"></div>
<div class="box"><span class="c" style="left:-6px;top:-6px"></span><span class="c" style="right:-6px;top:-6px"></span><span class="c" style="left:-6px;bottom:-6px"></span><span class="c" style="right:-6px;bottom:-6px"></span>
<span class="nameplate">摩卡貓</span>
<p class="txt">風是往這邊吹的。<em>寶物</em>應該掉在附近。<span class="g">草地上會有搗蛋鬼。</span></p>
<div class="foot"><span class="dots"><i></i><i class="on"></i><i></i><i></i></span><span>點一下繼續</span><span class="next"></span></div></div>
</div></body></html>'''
    open(D+'dialogue.html','w').write(html)
battle(); dialogue()
