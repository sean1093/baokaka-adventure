"""Assets for the character design sheets (garments laid flat, props, material swatches, head crops)."""
import sys, math
sys.path.insert(0, __file__.rsplit('/',1)[0])
from anime import head, mocha_head, SIL
from anime2 import Fig, limb, blob, crease, stars, bear_patch, block, f, P
D='/home/user/baokaka-adventure/docs/art/options/d-anime/sheet/'
def svg(inner,vb,w,h): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'
def mirror(pts,cx=100): return pts+[(2*cx-x,y) for x,y in reversed(pts)]

def pajama_flat():
    F=Fig('pf')
    half=[(100,30),(88,31),(78,36),(64,40),(44,58),(26,86),(20,98),(30,106),(48,84),(58,74),(60,108),(60,150),(58,168),(54,230),(50,262),(46,276),(52,286),(72,288),(84,282),(88,262),(92,212),(98,176)]
    d=blob(mirror(half))
    F.part(d,'pj',cel=(5,4),extra=stars([(74,92,3.4),(126,96,3),(80,140,3),(122,146,3.4),(70,200,3),(130,206,3),(66,250,2.6),(134,252,2.6),(100,160,2.6)]))
    # cuffs + footie soles hint + snap placket
    F.raw('<path d="M22,96 L30,104" stroke="#FFF2DC" stroke-width="5" stroke-linecap="round"/><path d="M178,96 L170,104" stroke="#FFF2DC" stroke-width="5" stroke-linecap="round"/>')
    F.raw('<path d="M48,282 C58,288 76,290 86,282" stroke="#FFF2DC" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M152,282 C142,288 124,290 114,282" stroke="#FFF2DC" stroke-width="3.4" fill="none" stroke-linecap="round"/>')
    F.raw('<path d="M100,46 L100,176" stroke="#B06A28" stroke-width="1.2" stroke-dasharray="0.1 9" stroke-linecap="round"/>'+''.join(f'<circle cx="100" cy="{y}" r="2.2" fill="#FFF6E6" stroke="#B06A28" stroke-width=".9"/>' for y in range(52,176,14)))
    F.raw(bear_patch(80,74,1.0))
    F.raw(crease((70,170),(90,172),1)+crease((110,172),(130,170),1)+crease((52,90),(58,98),0.9)+crease((148,90),(142,98),0.9))
    o=F.flush()
    C=Fig('pfc'); C.part('M80,34 C88,46 112,46 120,34 C124,38 122,46 116,48 C106,54 94,54 84,48 C78,46 76,38 80,34 Z','cream',cel=(1,1))
    return svg(o+C.flush(),"10 20 180 280",180,280)

def bib():
    F=Fig('bb')
    d='M60,30 C60,52 72,62 90,62 C108,62 120,52 120,30 C134,34 146,50 146,72 C146,104 122,126 90,126 C58,126 34,104 34,72 C34,50 46,34 60,30 Z'
    F.part(d,'cream',cel=(3,3),extra=''.join(f'<circle cx="{90+56*math.cos(a)}" cy="{78+46*math.sin(a)}" r="4.6" fill="#FFF6E6" stroke="#E8C79A" stroke-width=".8"/>' for a in [i*math.pi/9 for i in range(1,9)]))
    F.raw('<path d="M90,82 l2.4,5 5.4,.7 -4,3.7 1,5.4 -4.8,-2.7 -4.8,2.7 1,-5.4 -4,-3.7 5.4,-.7 Z" fill="#FFC63F" stroke="#B06A28" stroke-width=".8"/>')
    F.raw('<path d="M60,30 C52,26 46,30 46,36" stroke="#E8C79A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="58" cy="34" r="3" fill="#F09A3A" stroke="#A8825E" stroke-width=".8"/>')
    return svg(F.flush(),"28 22 124 110",124,110)

def bracelet():
    o=f'<ellipse cx="60" cy="50" rx="38" ry="22" fill="none" stroke="{SIL}" stroke-width="8"/><ellipse cx="60" cy="50" rx="38" ry="22" fill="none" stroke="#E5483E" stroke-width="5"/>'
    o+=''.join(f'<path d="M{60+38*math.cos(a)-1.6},{50+22*math.sin(a)-2} l3.2,4" stroke="#9E2A2A" stroke-width="1.1"/>' for a in [i*math.pi/12 for i in range(24)])
    o+=f'<circle cx="60" cy="72" r="7" fill="#FFD66A" stroke="{SIL}" stroke-width="1.8"/><path d="M56.6,69 C58,67.6 60,67.2 62,67.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>'
    return svg(o,"14 20 92 64",92,64)

def lock():
    o=f'<defs><linearGradient id="lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset=".45" stop-color="#F2C24A"/><stop offset="1" stop-color="#B8822A"/></linearGradient></defs>'
    o+=f'<path d="M30,10 C30,40 90,40 90,10" stroke="{SIL}" stroke-width="5.4" fill="none"/><path d="M30,10 C30,40 90,40 90,10" stroke="#E5483E" stroke-width="3" fill="none"/>'
    body='M60,30 C70,24 84,24 92,32 C100,40 100,52 94,60 C88,70 74,78 60,86 C46,78 32,70 26,60 C20,52 20,40 28,32 C36,24 50,24 60,30 Z'
    o+=f'<path d="{body}" fill="url(#lk)" stroke="{SIL}" stroke-width="2.4" stroke-linejoin="round"/>'
    o+=f'<path d="M60,36 C68,32 78,32 84,38 C90,44 90,52 86,58 C80,66 70,72 60,78 C50,72 40,66 34,58 C30,52 30,44 36,38 C42,32 52,32 60,36 Z" fill="none" stroke="#B8822A" stroke-width="1.2"/>'
    o+='<text x="60" y="52" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="10" fill="#8A5E1E">長命</text><text x="60" y="64" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="10" fill="#8A5E1E">百歲</text>'
    o+='<path d="M36,40 C40,34 46,32 52,33" stroke="#FFFBE6" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="82" cy="40" r="1.8" fill="#fff"/>'
    return svg(o,"14 4 92 88",92,88)

def blocks():
    o=block(40,52,1.6)
    o+=block(84,58,1.3).replace('#F0564A','#4A8BDA').replace('#FFB2A2','#9CC4FF').replace('#B23436','#2F62B0')
    o+=block(62,22,1.2).replace('#F0564A','#FFD86A').replace('#FFB2A2','#FFF0B0').replace('#B23436','#D6863A')
    return svg(o,"16 0 92 76",120,100)

def ticket():
    o=f'''<defs><linearGradient id="tk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3A8A"/><stop offset="1" stop-color="#141A4A"/></linearGradient></defs>
<rect x="4" y="4" width="112" height="72" rx="9" fill="url(#tk)" stroke="{SIL}" stroke-width="2.2"/>
<rect x="4" y="54" width="112" height="9" fill="#0B1030"/>
<circle cx="92" cy="26" r="13" fill="#FFF1C9"/><circle cx="98" cy="22" r="11" fill="#22307A"/>
<path d="M18,20 l1.6,3.4 3.6,.5 -2.6,2.4 .6,3.6 -3.2,-1.8 -3.2,1.8 .6,-3.6 -2.6,-2.4 3.6,-.5 Z M66,14 l1,2 2,.4 -1.5,1.4 .4,2 -1.9,-1 -1.9,1 .4,-2 -1.5,-1.4 2,-.4 Z" fill="#FFE9A0"/>
<text x="14" y="46" font-family="Noto Serif TC" font-weight="900" font-size="15" fill="#FFE9B0">月亮票</text>
<text x="66" y="46" font-family="Fredoka" font-weight="600" font-size="7" fill="#BFC8FF">MOON LINE</text>
<path d="M10,10 C30,8 60,8 80,9" stroke="#fff" stroke-width="1.6" opacity=".3" fill="none" stroke-linecap="round"/>'''
    return svg(o,"0 0 120 80",120,80)

def stampbook():
    o=f'''<path d="M14,16 L86,8 L96,92 L24,100 Z" fill="#C8342E" stroke="{SIL}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M14,16 L24,100 L18,101 L8,18 Z" fill="#8A2420" stroke="{SIL}" stroke-width="2" stroke-linejoin="round"/>
<path d="M22,22 L80,15 L88,84 L30,91 Z" fill="none" stroke="#F2C24A" stroke-width="1.4"/>
<text x="56" y="44" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="15" fill="#FFE9A0" transform="rotate(-6 56 44)">集章本</text>
<circle cx="56" cy="66" r="12" fill="none" stroke="#FFE9A0" stroke-width="1.6"/><text x="56" y="70" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="10" fill="#FFE9A0">台北</text>
<path d="M26,26 L30,60" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/>'''
    return svg(o,"4 4 96 100",96,100)

def redenv():
    o=f'''<rect x="10" y="6" width="60" height="88" rx="5" fill="#D9342E" stroke="{SIL}" stroke-width="2.2"/>
<path d="M10,26 C30,40 50,40 70,26 L70,11 C70,8 68,6 65,6 L15,6 C12,6 10,8 10,11 Z" fill="#B82824"/>
<circle cx="40" cy="36" r="8" fill="#F2C24A" stroke="#8A5E1E" stroke-width="1"/>
<text x="40" y="70" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="20" fill="#F2C24A">福</text>
<path d="M16,46 L16,84" stroke="#fff" stroke-width="1.6" opacity=".3" stroke-linecap="round"/>'''
    return svg(o,"6 2 68 96",68,96)

def swatch(kind,uid):
    w,h=150,96
    if kind=='fleece':
        inner=f'''<defs><filter id="{uid}n"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .8  0 0 0 .55 0"/></filter>
<linearGradient id="{uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".6" stop-color="#FFD05A"/><stop offset="1" stop-color="#EBA244"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#{uid}g)"/><rect width="{w}" height="{h}" filter="url(#{uid}n)" opacity=".5"/>'''+stars([(36,30,9),(110,64,8),(80,22,4),(40,74,4)],'#FFF6DA')+'<path d="M0,70 C40,58 90,80 150,62" stroke="#E39A3A" stroke-width="2" fill="none" opacity=".6"/>'
    elif kind=='gold':
        inner=f'''<defs><linearGradient id="{uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A5E1E"/><stop offset=".2" stop-color="#F2C24A"/><stop offset=".32" stop-color="#FFF6CC"/><stop offset=".42" stop-color="#E8B040"/><stop offset=".7" stop-color="#B8822A"/><stop offset=".82" stop-color="#FFE9A0"/><stop offset="1" stop-color="#9A6A22"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#{uid}g)"/><path d="M10,80 C50,40 100,30 140,14" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/><text x="75" y="60" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="26" fill="#8A5E1E" opacity=".45">壽</text>'''
    elif kind=='cord':
        inner=f'<rect width="{w}" height="{h}" fill="#D9382E"/>'+''.join(f'<path d="M{x},-10 L{x+40},{h+10}" stroke="#9E2420" stroke-width="5"/><path d="M{x+6},-10 L{x+46},{h+10}" stroke="#FF7A6A" stroke-width="2" opacity=".7"/>' for x in range(-60,160,14))
    elif kind=='felt':
        inner=f'''<defs><filter id="{uid}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .6 0"/></filter></defs>
<rect width="{w}" height="{h}" fill="#B98058"/><rect width="{w}" height="{h}" filter="url(#{uid}n)" opacity=".6"/>
<path d="M0,20 Q75,4 150,20" stroke="#F6E2C6" stroke-width="2" stroke-dasharray="5 4" fill="none"/>'''
    elif kind=='tabbyM':
        inner=f'<rect width="{w}" height="{h}" fill="#D7975E"/>'+''.join(f'<path d="{d}" fill="#7A4628"/>' for d in ['M75,8 C80,22 80,34 76,48 C72,34 71,22 75,8 Z','M56,12 C62,22 62,34 58,46 C55,34 54,22 56,12 Z','M94,12 C97,22 97,34 94,46 C90,34 90,22 94,12 Z','M36,24 C44,30 46,40 42,52 C38,42 34,32 36,24 Z','M114,24 C116,32 114,42 108,52 C106,40 108,30 114,24 Z'])+'<text x="75" y="84" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="13" fill="#5E3020">額頭 M 字紋</text>'
    elif kind=='stripes':
        inner=f'<rect width="{w}" height="{h}" fill="#D7975E"/>'+''.join(f'<path d="M{x},0 C{x-8},30 {x+6},60 {x-4},{h} L{x+6},{h} C{x+14},60 {x+2},30 {x+10},0 Z" fill="#7A4628"/>' for x in range(8,150,26))+f'<rect y="{h-18}" width="{w}" height="18" fill="#FFF5E8"/>'
    elif kind=='ring':
        inner=f'<rect width="{w}" height="{h}" fill="#F2E6D2"/><path d="M-10,60 C30,40 90,40 160,58" stroke="{SIL}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M-10,60 C30,40 90,40 160,58" stroke="#D7975E" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M-10,60 C30,40 90,40 160,58" stroke="#7A4628" stroke-width="26" fill="none" stroke-dasharray="10 16"/>'
    elif kind=='beans':
        inner=f'<rect width="{w}" height="{h}" fill="#F2E6D2"/><ellipse cx="75" cy="56" rx="42" ry="34" fill="#FFF5E8" stroke="{SIL}" stroke-width="2"/><path d="M60,64 C60,54 90,54 90,64 C90,76 60,76 60,64 Z" fill="#F4A0A8" stroke="#C86070" stroke-width="1"/>'+''.join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="8" fill="#F4A0A8" stroke="#C86070" stroke-width="1"/>' for x,y in [(50,40),(66,32),(84,32),(100,40)])
    return svg(inner,f"0 0 {w} {h}",w,h)

def bandana_flat():
    o=f'''<path d="M10,20 C60,32 140,32 190,20 C176,46 140,60 100,96 C60,60 24,46 10,20 Z" fill="#4A8BDA" stroke="{SIL}" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M100,96 C140,60 176,46 190,20 L194,24 C180,50 146,66 100,96 Z" fill="#2F62B0"/>
<path d="M10,20 C4,14 2,8 6,4 C12,10 16,14 22,22 Z M190,20 C196,14 198,8 194,4 C188,10 184,14 178,22 Z" fill="#4A8BDA" stroke="{SIL}" stroke-width="2" stroke-linejoin="round"/>
'''+''.join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#FFF5E2"/>' for x,y in [(40,34),(70,40),(100,42),(130,40),(160,34),(60,56),(100,62),(140,56),(100,80),(80,48),(120,48)])+'''
<path d="M30,26 C70,36 130,36 170,26" stroke="#9CC4FF" stroke-width="2" fill="none" opacity=".8"/>
<path d="M60,40 C76,56 90,72 100,96 M140,40 C124,56 110,72 100,96" stroke="#1E3E78" stroke-width="1.2" fill="none"/>'''
    return svg(o,"0 0 200 100",200,100)
def tag():
    o=f'''<defs><radialGradient id="tg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6CC"/><stop offset=".5" stop-color="#F2C24A"/><stop offset="1" stop-color="#A8782A"/></radialGradient></defs>
<path d="M40,6 L40,18" stroke="{SIL}" stroke-width="3"/><circle cx="40" cy="44" r="26" fill="url(#tg)" stroke="{SIL}" stroke-width="2.4"/>
<path d="M28,44 C32,36 46,36 52,44 C46,52 32,52 28,44 Z M52,44 L60,38 L60,50 Z" fill="#B8822A"/><circle cx="34" cy="43" r="1.6" fill="#FFF6CC"/>
<path d="M24,32 C28,26 34,22 40,22" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>'''
    return svg(o,"10 2 60 72",60,72)
def fish():
    o=f'''<path d="M8,40 C24,22 62,18 84,32 L104,18 L100,40 L104,62 L84,48 C62,62 24,58 8,40 Z" fill="#C8A070" stroke="{SIL}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M8,40 C24,30 60,28 84,36" stroke="#F2DCB8" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="22" cy="36" r="3" fill="#2A1612"/><circle cx="21" cy="35" r="1" fill="#fff"/>
<path d="M40,30 L44,50 M54,28 L58,52 M68,30 L70,50" stroke="#8A6040" stroke-width="1.4"/>'''
    return svg(o,"2 12 108 56",108,56)
def tray():
    o=f'''<defs><radialGradient id="tr" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#F0645A"/><stop offset="1" stop-color="#A8282C"/></radialGradient></defs>
<ellipse cx="80" cy="56" rx="76" ry="44" fill="#7A1E22" stroke="{SIL}" stroke-width="2.4"/><ellipse cx="80" cy="50" rx="76" ry="44" fill="url(#tr)" stroke="{SIL}" stroke-width="2.4"/>
<ellipse cx="80" cy="50" rx="62" ry="34" fill="none" stroke="#F2C24A" stroke-width="1.6"/>'''
    for i in range(9):
        a=math.pi*2*i/9-math.pi/2; x=80+48*math.cos(a); y=50+26*math.sin(a)
        o+=f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="9" ry="6" fill="#8A2024" stroke="#F2C24A" stroke-width="1"/>'
    o+='<ellipse cx="80" cy="50" rx="13" ry="9" fill="#8A2024" stroke="#F2C24A" stroke-width="1.4"/><text x="80" y="54" text-anchor="middle" font-family="Noto Serif TC" font-weight="900" font-size="9" fill="#F2C24A">金鎖</text>'
    return svg(o,"0 2 160 104",160,104)
def catnip():
    o=f'''<path d="M40,90 C40,60 38,40 30,20" stroke="#4E8A5A" stroke-width="3" fill="none"/>'''+''.join(f'<path d="M{x},{y} C{x-14},{y-4} {x-18},{y-14} {x-10},{y-20} C{x-2},{y-14} {x},{y-8} {x},{y} Z" fill="#6AAE72" stroke="{SIL}" stroke-width="1.4"/><path d="M{x},{y} C{x+14},{y-4} {x+18},{y-14} {x+10},{y-20} C{x+2},{y-14} {x},{y-8} {x},{y} Z" fill="#8AC88A" stroke="{SIL}" stroke-width="1.4"/>' for x,y in [(38,74),(35,54),(31,34)])
    return svg(o,"10 10 60 84",60,84)

if __name__=='__main__':
    import os; os.makedirs(D,exist_ok=True)
    for n,fn in [('pajama',pajama_flat),('bib',bib),('bracelet',bracelet),('lock',lock),('blocks',blocks),('ticket',ticket),('stampbook',stampbook),('redenv',redenv),('bandana',bandana_flat),('tag',tag),('fish',fish),('tray',tray),('catnip',catnip)]:
        open(D+n+'.svg','w').write(fn())
    for k in ['fleece','gold','cord','felt','tabbyM','stripes','ring','beans']:
        open(D+'sw-'+k+'.svg','w').write(swatch(k,'s'+k))
    for e in ['happy','laugh','teary','surprised']:
        open(D+'head-'+e+'.svg','w').write(svg(head(e,'hh'+e),"-60 -76 120 124",240,248))
    for e in ['content','smug','happy','surprised']:
        open(D+'mhead-'+e+'.svg','w').write(svg(mocha_head(e,'mh'+e),"-62 -66 124 110",248,220))
