import sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from chars import glow
O='/home/user/baokaka-adventure/docs/art/options/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">'
GRAIN="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"
ICONS={
 'atk':'<rect x="5" y="9" width="11" height="11" rx="1.5"/><path d="M5 9l4-4h11v11l-4 4M16 9l4-4"/>',
 'skill':'<path d="M12 3l2.2 5.2L20 9l-4.3 3.8L17 18.5 12 15.6 7 18.5l1.3-5.7L4 9l5.8-.8z"/>',
 'item':'<path d="M8 3h8l-1 4H9z"/><path d="M7 7h10l-1.4 13H8.4z"/><path d="M14 3l3-1.5"/>',
 'def':'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
}
def icon(k,col): return f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'

# ---------------- foes ----------------
def boba_A(i):
    return f'''<svg viewBox="0 0 100 100"><defs><radialGradient id="bA{i}" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#8A6A84"/><stop offset=".45" stop-color="#43293F"/><stop offset="1" stop-color="#1E1220"/></radialGradient></defs>
<ellipse cx="50" cy="92" rx="26" ry="4.6" fill="#120A20" opacity=".45"/>
<path d="M58,26 L70,6" stroke="#3A2838" stroke-width="8.4" stroke-linecap="round"/><path d="M58,26 L70,6" stroke="#FF7F95" stroke-width="5" stroke-linecap="round"/><path d="M61,18 L65,11" stroke="#fff" stroke-width="1.2" opacity=".7" stroke-linecap="round"/>
<circle cx="50" cy="58" r="32" fill="url(#bA{i})" stroke="#3A2838" stroke-width="2.2"/>
<path d="M76,44 C82,56 80,72 68,82" stroke="#D3A8FF" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<ellipse cx="36" cy="40" rx="9" ry="5" transform="rotate(-30 36 40)" fill="#fff" opacity=".55"/>
<ellipse cx="40" cy="58" rx="6.4" ry="7.4" fill="#fff" stroke="#3A2838" stroke-width="1.6"/><ellipse cx="62" cy="58" rx="6.4" ry="7.4" fill="#fff" stroke="#3A2838" stroke-width="1.6"/>
<circle cx="42" cy="60" r="3.6" fill="#2E1E2C"/><circle cx="64" cy="60" r="3.6" fill="#2E1E2C"/><circle cx="43.2" cy="58.4" r="1.2" fill="#fff"/><circle cx="65.2" cy="58.4" r="1.2" fill="#fff"/>
<path d="M33,48 L44,51 M69,48 L58,51" stroke="#E9DAF2" stroke-width="2" stroke-linecap="round"/>
<path d="M42,72 C47,77 55,77 60,72 Z" fill="#FF8F9A" stroke="#3A2838" stroke-width="1.4" stroke-linejoin="round"/>
<ellipse cx="31" cy="68" rx="4" ry="2.4" fill="#FF8A80" opacity=".5"/><ellipse cx="71" cy="68" rx="4" ry="2.4" fill="#FF8A80" opacity=".5"/></svg>'''
def boba_B(i):
    S='#0E0B26'
    return f'''<svg viewBox="0 0 100 100"><ellipse cx="50" cy="92" rx="26" ry="4.4" fill="{S}" opacity=".4"/>
<path d="M60,28 L72,8" stroke="{S}" opacity=".35" stroke-width="5.6" stroke-linecap="round" transform="translate(1.6 2.4)"/><path d="M60,28 L72,8" stroke="#F59AA8" stroke-width="5.6" stroke-linecap="round"/>
<circle cx="52" cy="60.4" r="32" fill="{S}" opacity=".35"/><circle cx="50" cy="58" r="32" fill="#2E2240"/>
<path d="M50,26 A32,32 0 0 1 82,58 A30,30 0 0 0 50,30 A30,30 0 0 0 20,52 A32,32 0 0 1 50,26 Z" fill="#4A3A62"/>
<ellipse cx="36" cy="40" rx="8" ry="4.4" transform="rotate(-30 36 40)" fill="#7A6A98"/>
<ellipse cx="40" cy="58" rx="6.4" ry="7.4" fill="#FFF3DE"/><ellipse cx="62" cy="58" rx="6.4" ry="7.4" fill="#FFF3DE"/>
<circle cx="42" cy="60" r="3.6" fill="#1B1433"/><circle cx="64" cy="60" r="3.6" fill="#1B1433"/><circle cx="43.2" cy="58.4" r="1.2" fill="#fff"/><circle cx="65.2" cy="58.4" r="1.2" fill="#fff"/>
<path d="M33,47 L45,51 L33,50 Z M69,47 L57,51 L69,50 Z" fill="#FFF3DE"/>
<path d="M42,71 C47,77 55,77 60,71 Z" fill="#F59AA8"/>
<circle cx="31" cy="68" r="3.4" fill="#F59AA8" opacity=".8"/><circle cx="71" cy="68" r="3.4" fill="#F59AA8" opacity=".8"/></svg>'''
def boba_C(i):
    return f'''<svg viewBox="0 0 100 100"><ellipse cx="50" cy="92" rx="26" ry="4.6" fill="#B57BFF" opacity=".2"/>
<circle cx="50" cy="58" r="32" fill="#1C1230"/>
{glow("M18,58 a32,32 0 1,0 64,0 a32,32 0 1,0 -64,0","#B57BFF","#EBDDFF",1.6)}
{glow("M58,26 L70,6","#FF4D8D","#FFD0E0",2.2)}
<ellipse cx="36" cy="40" rx="8" ry="4.4" transform="rotate(-30 36 40)" fill="#B57BFF" opacity=".35"/>
<ellipse cx="40" cy="58" rx="6.4" ry="7.4" fill="#fff"/><ellipse cx="62" cy="58" rx="6.4" ry="7.4" fill="#fff"/>
<circle cx="42" cy="60" r="3.6" fill="#14102A"/><circle cx="64" cy="60" r="3.6" fill="#14102A"/>
{glow("M33,48 L44,51 M69,48 L58,51","#B57BFF","#EBDDFF",1.1)}
{glow("M42,72 C47,77 55,77 60,72","#FF4D8D","#FFD0E0",1.2)}</svg>'''

# ---------------- backdrops (390 x 500) ----------------
def bd_A():
    stalls=''
    cols=[('#E8553D','#FFF1DC'),('#2F8F88','#FFF1DC'),('#E9A23A','#FFF1DC'),('#E8553D','#FFF1DC')]
    for k,x in enumerate([-10,92,194,296]):
        c1,c2=cols[k]
        stripes=''.join(f'<rect x="{x+i*13}" y="196" width="6.5" height="22" fill="{c2}" opacity=".9"/>' for i in range(8))
        stalls+=f'''<rect x="{x+6}" y="214" width="92" height="76" fill="#2A2350"/>
<rect x="{x+10}" y="226" width="84" height="40" fill="url(#bA-win)"/>
<path d="M{x},196 h104 v22 h-104 Z" fill="{c1}"/>{stripes}
<path d="M{x},218 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 q6.5,8 13,0 Z" fill="{c1}"/>'''
    signs=''.join(f'<g transform="translate({x} 150)"><rect width="66" height="30" rx="7" fill="#FFF1C9"/><rect width="66" height="30" rx="7" fill="none" stroke="{c}" stroke-width="3"/><text x="33" y="21" text-anchor="middle" font-family="Chiron GoRound TC" font-weight="900" font-size="17" fill="{c}">{t}</text></g>' for x,t,c in [(22,'雞排','#E8553D'),(162,'珍奶','#7A4A2E'),(298,'臭豆腐','#2F8F88')])
    lamps=''.join(f'<circle cx="{x}" cy="{y}" r="9" fill="url(#bA-lamp)"/><circle cx="{x}" cy="{y}" r="3.4" fill="#FFE9A8"/>' for x,y in [(30,120),(80,132),(130,138),(180,140),(230,138),(280,132),(330,122),(372,112)])
    return f'''<svg viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="bA-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121844"/><stop offset=".7" stop-color="#2E2A66"/><stop offset="1" stop-color="#4A3A7A"/></linearGradient>
<linearGradient id="bA-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD98A"/><stop offset="1" stop-color="#F29A4A"/></linearGradient>
<radialGradient id="bA-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset="1" stop-color="#FFB86A" stop-opacity="0"/></radialGradient>
<linearGradient id="bA-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A4A6E"/><stop offset="1" stop-color="#2A2440"/></linearGradient>
<radialGradient id="bA-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".5"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></radialGradient>
<radialGradient id="bA-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#0E0A22" stop-opacity="0"/><stop offset="1" stop-color="#0E0A22" stop-opacity=".6"/></radialGradient>
<radialGradient id="bA-steam" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="390" height="500" fill="url(#bA-sky)"/>
<g fill="#fff"><circle cx="40" cy="40" r="1"/><circle cx="120" cy="24" r=".8"/><circle cx="330" cy="58" r="1.1"/><circle cx="268" cy="30" r=".8"/><circle cx="190" cy="76" r=".7"/></g>
<circle cx="300" cy="70" r="14" fill="#FFF1C9"/><circle cx="300" cy="70" r="34" fill="url(#bA-lamp)" opacity=".4"/>
<path d="M0,190 V150 h20 v-14 h16 v20 h20 v-30 h18 v24 h14 v-10 h22 v18 h16 v-40 h18 v34 h20 v-16 h16 v22 h22 v-26 h16 v30 h18 v-20 h20 v26 h16 v-30 h22 v34 h18 V190 Z" fill="#1E1E4A"/>
<path d="M0,110 Q195,160 390,100" stroke="#3A2838" stroke-width="1.2" fill="none"/>{lamps}
{stalls}{signs}
<path d="M0,290 L390,290 L390,500 L0,500 Z" fill="url(#bA-floor)"/>
<g stroke="#8A7A9A" stroke-width="1.5" opacity=".4"><path d="M195,290 L60,500 M195,290 L330,500 M195,290 L-80,460 M195,290 L470,460"/></g>
<ellipse cx="80" cy="200" rx="30" ry="40" fill="url(#bA-steam)"/><ellipse cx="300" cy="190" rx="26" ry="36" fill="url(#bA-steam)"/>
<ellipse cx="195" cy="400" rx="200" ry="90" fill="url(#bA-pool)"/>
<rect width="390" height="500" fill="url(#bA-vig)"/></svg>'''

def bd_B():
    S='#0E0B26'
    stalls=''
    for k,(x,c1) in enumerate([(-6,'#E8553D'),(94,'#2FA39A'),(194,'#FFB33F'),(294,'#E8553D')]):
        stripes=''.join(f'<rect x="{x+i*13}" y="200" width="6.5" height="20" fill="#FFF1DC"/>' for i in range(8))
        aw=f'M{x},200 h104 v20 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 Z'
        stalls+=f'''<rect x="{x+8}" y="216" width="90" height="76" fill="{S}" opacity=".35" transform="translate(2 3)"/><rect x="{x+8}" y="216" width="90" height="76" fill="#2E2A6A"/>
<rect x="{x+14}" y="228" width="78" height="36" fill="#FFD670"/><rect x="{x+14}" y="256" width="78" height="8" fill="#F2A23A"/>
<path d="{aw}" fill="{S}" opacity=".35" transform="translate(2 3)"/><path d="{aw}" fill="{c1}"/>{stripes}'''
    signs=''.join(f'<g transform="translate({x} 150)"><rect x="2.5" y="3.5" width="66" height="30" rx="4" fill="{S}" opacity=".35"/><rect width="66" height="30" rx="4" fill="#FFF1C9"/><text x="33" y="21" text-anchor="middle" font-family="Chiron GoRound TC" font-weight="900" font-size="17" fill="{c}">{t}</text></g>' for x,t,c in [(22,'雞排','#E8553D'),(162,'珍奶','#7A4A2E'),(298,'臭豆腐','#2FA39A')])
    lan=''.join(f'<circle cx="{x+1.5}" cy="{y+2.5}" r="8" fill="{S}" opacity=".35"/><circle cx="{x}" cy="{y}" r="8" fill="#E8553D"/><circle cx="{x}" cy="{y}" r="4.4" fill="#FFB33F"/><rect x="{x-3}" y="{y-10}" width="6" height="3" fill="#2A2050"/>' for x,y in [(40,122),(100,134),(160,140),(230,140),(290,134),(350,122)])
    val=''.join(f'<path d="M{x},28 a19.5,16 0 0 0 39,0 Z" fill="#E8553D"/><circle cx="{x+19.5}" cy="36" r="3" fill="#FFD670"/>' for x in range(0,390,39))
    return f'''<svg viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
<rect width="390" height="500" fill="#22246A"/>
<circle cx="302" cy="84" r="20" fill="{S}" opacity=".35" transform="translate(2 3)"/><circle cx="302" cy="84" r="20" fill="#FFF1C9"/>
<path d="M30,70 l1.5,4 4,1.5 -4,1.5 -1.5,4 -1.5,-4 -4,-1.5 4,-1.5 Z M120,60 l1.2,3 3,1.2 -3,1.2 -1.2,3 -1.2,-3 -3,-1.2 3,-1.2 Z M220,90 l1.2,3 3,1.2 -3,1.2 -1.2,3 -1.2,-3 -3,-1.2 3,-1.2 Z" fill="#FFE9B0"/>
<path d="M0,196 V150 h20 v-14 h16 v20 h20 v-30 h18 v24 h14 v-10 h22 v18 h16 v-40 h18 v34 h20 v-16 h16 v22 h22 v-26 h16 v30 h18 v-20 h20 v26 h16 v-30 h22 v34 h18 V196 Z" fill="{S}" opacity=".3" transform="translate(0 -3)"/>
<path d="M0,196 V150 h20 v-14 h16 v20 h20 v-30 h18 v24 h14 v-10 h22 v18 h16 v-40 h18 v34 h20 v-16 h16 v22 h22 v-26 h16 v30 h18 v-20 h20 v26 h16 v-30 h22 v34 h18 V196 Z" fill="#30338A"/>
<path d="M0,112 Q195,160 390,104" stroke="#120E2E" stroke-width="1.4" fill="none"/>{lan}
{stalls}{signs}
<rect y="292" width="390" height="208" fill="#C8925A"/>
<g fill="#B37E4C"><rect y="330" width="390" height="3"/><rect y="380" width="390" height="3"/><rect y="440" width="390" height="3"/></g>
<rect y="292" width="390" height="10" fill="#0E0B26" opacity=".3"/>
<ellipse cx="195" cy="410" rx="170" ry="60" fill="#FFE9A8" opacity=".16"/>
<!-- 布袋戲-style proscenium -->
<rect width="390" height="28" fill="#B5322F"/>{val}
<rect width="14" height="500" fill="#B5322F"/><rect x="376" width="14" height="500" fill="#B5322F"/>
<rect x="14" y="28" width="3" height="472" fill="#FFD670"/><rect x="373" y="28" width="3" height="472" fill="#FFD670"/>
<rect x="17" y="28" width="6" height="472" fill="#0E0B26" opacity=".3"/></svg>'''

def bd_C():
    stalls=''
    for k,(x,c) in enumerate([(-6,'#FF4D8D'),(94,'#4DE3FF'),(194,'#FFC94A'),(294,'#FF4D8D')]):
        aw=f'M{x},200 h104 v20 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 q-6.5,9 -13,0 Z'
        stalls+=f'<rect x="{x+8}" y="216" width="90" height="76" fill="#0E1030"/><rect x="{x+14}" y="228" width="78" height="36" fill="{c}" opacity=".16"/><path d="{aw}" fill="#120F30"/>'+glow(aw,c,'#FFFFFF',1.2)+glow(f'M{x+8},222 V292 M{x+98},222 V292',c,'#FFFFFF',0.8)
    def ntext(x,t,c):
        st=''.join(f'<text x="{x}" y="174" text-anchor="middle" font-family="Chiron GoRound TC" font-weight="900" font-size="22" fill="none" stroke="{c}" stroke-width="{w}" opacity="{op}" stroke-linejoin="round">{t}</text>' for w,op in [(7,.15),(3.4,.45)])
        return st+f'<text x="{x}" y="174" text-anchor="middle" font-family="Chiron GoRound TC" font-weight="900" font-size="22" fill="#FFFFFF">{t}</text>'
    signs=ntext(56,'雞排','#FF4D8D')+ntext(195,'珍奶','#FFC94A')+ntext(330,'臭豆腐','#4DE3FF')
    lan=''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="{c}" opacity=".3"/><circle cx="{x}" cy="{y}" r="2.6" fill="#fff"/>' for (x,y),c in zip([(30,120),(80,132),(130,138),(180,140),(230,138),(280,132),(330,122),(372,112)],['#FF4D8D','#FFC94A','#4DE3FF']*3))
    grid=''.join(f'<path d="M195,292 L{x},500" stroke="#B57BFF" stroke-width="1" opacity=".5"/>' for x in range(-300,700,70))+''.join(f'<path d="M0,{y} H390" stroke="#B57BFF" stroke-width="1" opacity="{op}"/>' for y,op in [(305,.3),(325,.35),(355,.4),(400,.45),(465,.5)])
    return f'''<svg viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bC-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070920"/><stop offset="1" stop-color="#1E1446"/></linearGradient>
<radialGradient id="bC-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF4D8D" stop-opacity=".22"/><stop offset="1" stop-color="#FF4D8D" stop-opacity="0"/></radialGradient></defs>
<rect width="390" height="500" fill="url(#bC-sky)"/>
<g fill="#fff"><circle cx="40" cy="40" r="1"/><circle cx="120" cy="24" r=".8"/><circle cx="330" cy="58" r="1.1"/><circle cx="268" cy="30" r=".8"/><circle cx="190" cy="76" r=".7"/></g>
{glow("M286,70 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0","#FFE9A8","#FFF8E0",1.4)}
<path d="M0,196 V150 h20 v-14 h16 v20 h20 v-30 h18 v24 h14 v-10 h22 v18 h16 v-40 h18 v34 h20 v-16 h16 v22 h22 v-26 h16 v30 h18 v-20 h20 v26 h16 v-30 h22 v34 h18 V196 Z" fill="#0C0E2A"/>
<path d="M0,112 Q195,160 390,104" stroke="#3A3060" stroke-width="1" fill="none"/>{lan}
{stalls}{signs}
<rect y="292" width="390" height="208" fill="#0A0B22"/>{grid}
<ellipse cx="195" cy="410" rx="200" ry="80" fill="url(#bC-pool)"/></svg>'''

# ---------------- per-option CSS ----------------
CSS_COMMON='''*{box-sizing:border-box;margin:0}body{background:#111;font-family:'Chiron GoRound TC',system-ui,sans-serif}
.phone{position:relative;width:390px;height:844px;overflow:hidden}
.stage{position:absolute;inset:0 0 auto 0;height:500px}.stage>svg{position:absolute;inset:0;width:100%;height:100%}
.sp{position:absolute}.sp svg,.sp img{display:block;width:100%;height:100%}
.topbar{position:absolute;top:14px;left:26px;right:26px;display:flex;justify-content:space-between;z-index:5}
.panel{position:absolute;left:0;right:0;bottom:0;height:344px;padding:18px 16px 20px;z-index:7}
.party{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mem{display:flex;gap:10px;align-items:center;padding:8px 10px}
.ava{width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none;position:relative}
.ava img{position:absolute;width:210%;left:-92%;top:-30%}.ava.mc img{width:170%;left:-36%;top:-14%}
.info{flex:1;min-width:0}.nm{font-weight:900;font-size:16px;line-height:1.1}
.st{font:600 12.5px Fredoka;display:flex;justify-content:space-between;white-space:nowrap;gap:4px}
.mini{height:9px;border-radius:9px;overflow:hidden;margin:3px 0 4px}.mini i{display:block;height:100%;border-radius:9px}
.prompt{margin:14px 2px 10px;font-weight:700;font-size:17px;display:flex;justify-content:space-between;align-items:center}
.prompt a{font-size:15px;font-weight:700;text-decoration:none}
.cmds{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cmd{height:70px;border:0;display:flex;align-items:center;gap:12px;padding:0 16px;font:900 21px 'Chiron GoRound TC'}
.cmd .ic{width:38px;height:38px;display:grid;place-items:center;flex:none}
.cmd small{display:block;font:600 12px Fredoka;margin-top:1px}
.pl{position:absolute;z-index:5}
.dmg{position:absolute;z-index:6;font:700 38px Fredoka}
'''
CSS={
'A':'''.phone{background:#FBF4E6}
.chip{background:rgba(20,16,48,.55);backdrop-filter:blur(6px);color:#FFF4E2;border-radius:999px;padding:7px 14px;font-weight:700;font-size:15px;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.panel{background:linear-gradient(#FFFDF8,#FBF2E2);border-radius:30px 30px 0 0;box-shadow:0 -18px 36px -18px rgba(20,16,48,.6),inset 0 1px 0 #fff;color:#2E2235}
.mem{background:#F6EBD8;border-radius:20px}.mem.on{background:#FFF1C9;box-shadow:inset 0 0 0 2.5px #FFC63F}
.ava{background:radial-gradient(circle at 40% 35%,#fff,#F1DFC4)}.st{color:#6E5A6A}.mini{background:rgba(58,40,56,.12)}
.mini i{position:relative}.mini i::after{content:'';position:absolute;left:4px;right:4px;top:2px;height:2px;border-radius:9px;background:rgba(255,255,255,.5)}
.prompt a{color:#6E5A6A}
.cmd{border-radius:22px;color:#2E2235;background:#fff;box-shadow:0 4px 0 #E3D3BA,0 10px 18px -12px rgba(46,34,53,.45),inset 0 1px 0 #fff}
.cmd .ic{border-radius:13px}.cmd small{color:#6E5A6A}
.cmd.pri{background:linear-gradient(#FFD45C,#FFB834);box-shadow:0 4px 0 #D98A22,0 12px 20px -10px rgba(238,154,44,.85),inset 0 1px 0 #FFF2BF}.cmd.pri small{color:#8A5316}
.pl{background:rgba(20,16,48,.6);backdrop-filter:blur(6px);color:#FFF4E2;border-radius:16px;padding:7px 12px 9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}
.dmg{color:#FFF6DA;-webkit-text-stroke:6px #3A2838;paint-order:stroke fill;text-shadow:0 4px 0 rgba(46,34,53,.35)}
.grain{position:absolute;inset:0;pointer-events:none;z-index:9;opacity:.07;mix-blend-mode:multiply;background-image:'''+GRAIN+'''}''',
'B':'''.phone{background:#F3E6CC}
.chip{background:#FFF1C9;color:#2A2050;border-radius:6px;padding:6px 14px 6px 22px;font-weight:900;font-size:15px;box-shadow:3px 4px 0 rgba(14,11,38,.35);position:relative}
.chip::before{content:'';position:absolute;left:8px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:#22246A}
.panel{height:358px;background:#F3E6CC;color:#2A2050;clip-path:polygon(0 14px,4% 4px,9% 12px,14% 2px,20% 10px,26% 3px,32% 12px,38% 4px,44% 11px,50% 2px,56% 10px,62% 4px,68% 12px,74% 3px,80% 11px,86% 4px,92% 12px,97% 3px,100% 10px,100% 100%,0 100%);padding-top:26px}
.mem{background:#FFF8E8;border-radius:10px;box-shadow:3px 4px 0 rgba(14,11,38,.18)}.mem.on{background:#FFE9A8;box-shadow:3px 4px 0 rgba(14,11,38,.25),inset 0 0 0 2.5px #E8553D}
.ava{background:#F3E6CC}.st{color:#5A4E7A}.mini{background:rgba(42,32,80,.14)}
.prompt a{color:#5A4E7A}
.cmd{border-radius:12px;color:#2A2050;background:#FFF8E8;box-shadow:4px 5px 0 rgba(14,11,38,.28)}
.cmd .ic{border-radius:8px}.cmd small{color:#5A4E7A}
.cmd.pri{background:#FFCB4F}.cmd.pri small{color:#7A4A1E}
.pl{background:#FFF1C9;color:#2A2050;border-radius:6px;padding:6px 12px 8px;box-shadow:3px 4px 0 rgba(14,11,38,.35)}
.dmg{color:#FFF1C9;text-shadow:3px 4px 0 #0E0B26}
.grain{position:absolute;inset:0;pointer-events:none;z-index:9;opacity:.14;mix-blend-mode:multiply;background-image:'''+GRAIN+'''}''',
'C':'''.phone{background:#090A20}
.chip{background:rgba(14,16,48,.85);color:#E8F6FF;border-radius:999px;padding:6px 14px;font-weight:700;font-size:15px;border:1.5px solid #4DE3FF;box-shadow:0 0 10px rgba(77,227,255,.55),inset 0 0 8px rgba(77,227,255,.25)}
.panel{background:linear-gradient(#12143A,#0A0B24);color:#F2F4FF;border-top:2px solid #4DE3FF;box-shadow:0 -4px 18px rgba(77,227,255,.45)}
.mem{background:#161A44;border-radius:16px;border:1.5px solid rgba(255,255,255,.12)}.mem.on{border-color:#FFC94A;box-shadow:0 0 12px rgba(255,201,74,.5),inset 0 0 10px rgba(255,201,74,.18)}
.ava{background:#0E1030;box-shadow:0 0 0 1.5px rgba(255,255,255,.2)}.st{color:#B8BEE8}.mini{background:rgba(255,255,255,.1)}
.mini i{box-shadow:0 0 8px currentColor}
.prompt a{color:#B8BEE8}
.cmd{border-radius:18px;color:#FFFFFF;background:#141738;border:1.5px solid var(--n);box-shadow:0 0 12px color-mix(in srgb,var(--n) 55%,transparent),inset 0 0 10px color-mix(in srgb,var(--n) 22%,transparent)}
.cmd .ic{border-radius:12px;background:rgba(255,255,255,.06)}.cmd small{color:#B8BEE8}
.cmd.pri{background:#2A2210;text-shadow:0 0 8px #FFC94A}
.pl{background:rgba(14,16,48,.85);color:#F2F4FF;border-radius:14px;padding:7px 12px 9px;border:1.5px solid #B57BFF;box-shadow:0 0 12px rgba(181,123,255,.5)}
.dmg{color:#FFFFFF;text-shadow:0 0 6px #FF4D8D,0 0 16px #FF4D8D,0 0 2px #fff}
.grain{display:none}'''
}
BARS={'A':('linear-gradient(#6AD184,#3FA35C)','linear-gradient(#78AEF0,#3F78C8)','linear-gradient(#FFB25A,#E5833A)','linear-gradient(#FF7A6A,#D9443C)'),
      'B':('#4F9A6E','#3D7FC0','#F2A23A','#E8553D'),
      'C':('#4DFFB0','#4DA6FF','#FFB04D','#FF4D8D')}
def page(K,folder,foe,bd):
    hp,mp,low,foeHp=BARS[K]
    icCol={'A':['#3A2838','#6B47B8','#2F8A4C','#2B5BA3'],'B':['#2A2050','#2A2050','#2A2050','#2A2050'],'C':['#FFC94A','#FF4D8D','#4DFFB0','#4DE3FF']}[K]
    icBg={'A':['rgba(255,255,255,.55)','#EDE2FF','#DDF2E2','#DCEBFB'],'B':['#FFF1C9','#F59AA8','#9FD6B0','#9CC8F0'],'C':['','','','']}[K]
    neon=['#FFC94A','#FF4D8D','#4DFFB0','#4DE3FF']
    def cmd(i,k,label,sub,pri=False):
        st=f' style="--n:{neon[i]}"' if K=='C' else ''
        bg=f' style="background:{icBg[i]}"' if icBg[i] else ''
        return f'<button class="cmd{" pri" if pri else ""}"{st}><span class="ic"{bg}>{icon(k,icCol[i])}</span><span>{label}<small>{sub}</small></span></button>'
    foes=''.join(f'<div class="sp" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px">{foe(i)}</div>' for i,(x,y,s) in enumerate([(216,206,92),(292,236,86),(250,290,96)]))
    pips=''.join(f'<div class="sp" style="left:{x}px;top:{y}px;width:56px;height:7px;border-radius:9px;background:rgba(0,0,0,.35);overflow:hidden"><i style="display:block;height:100%;width:{w}%;background:{foeHp};border-radius:9px"></i></div>' for x,y,w in [(234,300,100),(307,323,100),(270,386,40)])
    hitcol={'A':('#FFE27A','#3A2838'),'B':('#FFE27A','#0E0B26'),'C':('#FFFFFF','#FF4D8D')}[K]
    if K=='C':
        hit=f'<svg class="sp" style="left:236px;top:296px;width:58px;height:58px;z-index:6" viewBox="0 0 100 100">'+glow('M50,8 L58,38 L90,30 L64,52 L86,78 L54,64 L44,94 L38,62 L8,70 L32,48 L12,22 L42,36 Z','#FF4D8D','#FFFFFF',2.4)+'</svg>'
    elif K=='B':
        hit='<svg class="sp" style="left:236px;top:296px;width:58px;height:58px;z-index:6" viewBox="0 0 100 100"><path d="M50,8 L58,38 L90,30 L64,52 L86,78 L54,64 L44,94 L38,62 L8,70 L32,48 L12,22 L42,36 Z" fill="#0E0B26" opacity=".35" transform="translate(4 6)"/><path d="M50,8 L58,38 L90,30 L64,52 L86,78 L54,64 L44,94 L38,62 L8,70 L32,48 L12,22 L42,36 Z" fill="#FFE27A"/><path d="M50,28 L54,44 L68,42 L58,52 L64,64 L50,58 L40,68 L42,54 L30,48 L44,44 Z" fill="#FFF8E8"/></svg>'
    else:
        hit='<svg class="sp" style="left:236px;top:296px;width:58px;height:58px;z-index:6" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#FFF2C2" stroke-width="3" opacity=".7"/><path d="M50,8 L58,38 L90,30 L64,52 L86,78 L54,64 L44,94 L38,62 L8,70 L32,48 L12,22 L42,36 Z" fill="#FFE27A" stroke="#3A2838" stroke-width="2.4" stroke-linejoin="round"/><path d="M50,26 L54,42 L70,40 L58,52 L66,66 L50,58 L40,70 L42,54 L28,48 L44,44 Z" fill="#FFFDF2"/></svg>'
    ring={'A':'<svg class="sp" style="left:4px;top:430px;width:140px;height:30px" viewBox="0 0 140 30"><ellipse cx="70" cy="15" rx="66" ry="12" fill="#FFD45C" opacity=".22" stroke="#FFD45C" stroke-width="3"/></svg>',
          'B':'<svg class="sp" style="left:4px;top:430px;width:140px;height:30px" viewBox="0 0 140 30"><ellipse cx="72" cy="17" rx="66" ry="11" fill="#0E0B26" opacity=".3"/><ellipse cx="70" cy="15" rx="66" ry="11" fill="#FFCB4F"/></svg>',
          'C':'<svg class="sp" style="left:4px;top:430px;width:140px;height:30px" viewBox="0 0 140 30">'+glow('M4,15 a66,11 0 1,0 132,0 a66,11 0 1,0 -132,0','#FFC94A','#FFF6D6',1.6)+'</svg>'}[K]
    html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Battle Mock {K}</title>{FONT}<style>{CSS_COMMON}{CSS[K]}</style></head><body><div class="phone">
<div class="stage">{bd}
<div class="topbar"><span class="chip">士林夜市 · 03:40</span><span class="chip">第 2 回合</span></div>
<div class="pl" style="top:64px;right:26px;width:200px"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-weight:900;font-size:18px">珍珠粉圓</b><span style="font:600 14px Fredoka">×3</span></div></div>
{foes}{pips}{hit}<div class="dmg" style="left:196px;top:262px">18</div>
{ring}
<div class="sp" style="left:124px;top:366px;width:84px;height:84px">{'<img src="mocha-cat.svg">'}</div>
<div class="sp" style="left:8px;top:330px;width:124px;height:124px"><img src="baokaka-crawl.svg"></div>
</div>
<div class="panel">
<div class="party">
<div class="mem on"><span class="ava"><img src="baokaka-crawl.svg"></span><div class="info"><div class="nm">寶咖咖</div><div class="mini"><i style="width:84%;background:{hp};color:{"#4DFFB0" if K=="C" else "transparent"}"></i></div><div class="mini" style="height:6px"><i style="width:60%;background:{mp};color:{"#4DA6FF" if K=="C" else "transparent"}"></i></div><div class="st"><span>體力 84/100</span><span>元氣 9</span></div></div></div>
<div class="mem"><span class="ava mc"><img src="mocha-cat.svg"></span><div class="info"><div class="nm">摩卡貓</div><div class="mini"><i style="width:34%;background:{low};color:{"#FFB04D" if K=="C" else "transparent"}"></i></div><div class="mini" style="height:6px"><i style="width:88%;background:{mp};color:{"#4DA6FF" if K=="C" else "transparent"}"></i></div><div class="st"><span>體力 31/90</span><span>元氣 14</span></div></div></div>
</div>
<p class="prompt"><span>寶咖咖要做什麼？</span><a>逃跑 ›</a></p>
<div class="cmds">{cmd(0,'atk','攻擊','丟積木',True)}{cmd(1,'skill','才藝','元氣 3')}{cmd(2,'item','道具','4 樣')}{cmd(3,'def','防禦','減傷一半')}</div>
</div><div class="grain"></div></div></body></html>'''
    open(O+folder+'/battle.html','w').write(html)

page('A','a-picture-book-diorama',boba_A,bd_A())
page('B','b-paper-cut-night',boba_B,bd_B())
page('C','c-neon-sign-taipei',boba_C,bd_C())
