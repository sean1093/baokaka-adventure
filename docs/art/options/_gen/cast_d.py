"""D-style cast: 咻咻 (4 forms), 阿藍, 黑糖, recurring NPCs. Same construction + two-pass line + cel recipe."""
import sys, math, random
sys.path.insert(0, __file__.rsplit('/',1)[0])
from anime import eye, SIL
from anime2 import Fig, MAT, limb, blob, crease, shadow, f, P, svg
MAT.update({
 'cloud':('#D8E2F2','#A8B8D8','#8A9AC0','#6A7AA8'),'storm':('#4A5A8A','#2E3A66','#1E2A4E','#141C3A'),'cry':('#A8C4EC','#7A9AD0','#5A7AB8','#4A6AA0'),'fluff':('#FFFFFF','#E0E8FA','#C8D4F0','#9AA8CC'),
 'blue':('#3F7FE0','#2A5CB8','#1E4392','#163070'),'hood':('#34324A','#22202E','#16141E','#0E0C14'),'belly':('#B8D4F4','#8EB0E0','#7096C8','#5A7AA8'),'coral':('#FF7A5E','#D9452F','#A8322A','#8A2A22'),
 'bear':('#3A3650','#26222F','#18161F','#0E0C14'),'moon':('#FFF4DC','#E9D2A6','#D2B482','#A8885E'),'tan':('#E6C49A','#C49A6E','#A8784E','#7A5434'),'scarf':('#FF6E5E','#D94A44','#B23436','#8A2A2C'),
 'goldm':('#FFD66A','#E0A83A','#B8822A','#8A5E1E'),
})
def cloud_outline(cx,cy,r,lobes=9,amp=0.12,seed=1):
    """Puffy cloud: round bumps with soft inward cusps (r = R*(1+a*|cos(n*t/2)|)), sampled densely."""
    random.seed(seed); ph=random.uniform(0,1)
    pts=[]
    for i in range(96):
        t=math.pi*2*i/96
        rr=r*(0.9+amp*abs(math.cos(lobes*t/2+ph)))
        pts.append((cx+rr*math.cos(t), cy+rr*0.86*math.sin(t)))
    return 'M'+' L'.join(f'{f(x)},{f(y)}' for x,y in pts)+' Z'

def big_eye(cx,cy,flip,expr,uid,iris):
    s=1.5
    return f'<g transform="translate({cx} {cy}) scale({s}) translate({-cx} {-cy})">'+eye(cx,cy,flip,expr,iris=iris,uid=uid)+'</g>'

def shushu(form='normal',uid='ss'):
    F=Fig(uid); o=[]
    mat={'normal':'cloud','storm':'storm','cry':'cry','bonus':'fluff'}[form]
    R={'normal':52,'storm':70,'cry':48,'bonus':54}[form]; cx,cy=100,104
    if form=='storm':
        o.append('<defs><radialGradient id="%sau" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8A6AFF" stop-opacity=".45"/><stop offset="1" stop-color="#8A6AFF" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="98" fill="url(#%sau)"/>'%(uid,uid))
        for k in range(3):
            a0=k*2.1; pts=[(cx+(R+16)*math.cos(a0+t*0.5)*(1+t*0.08),cy+(R+10)*0.8*math.sin(a0+t*0.5)*(1+t*0.08)) for t in range(6)]
            F.part(limb(pts,[7,6.4,5.6,4.6,3.6,2.4]),mat,cel=(2,2))
    if form=='normal' or form=='cry' or form=='bonus':
        for (a,ln) in [(-0.4,26),(3.5,24)]:
            p0=(cx+R*0.8*math.cos(a),cy+R*0.6*math.sin(a)); p1=(p0[0]+ln*0.7*math.cos(a),p0[1]+ln*0.5*math.sin(a)+4); p2=(p1[0]+8*math.cos(a),p1[1]-7)
            F.part(limb([p0,p1,p2],[11,8,5.4]),mat,cel=(1.6,1.6))
    o.append(F.flush())
    body=cloud_outline(cx,cy,R,lobes=9 if form!='storm' else 11,amp=0.16,seed={'normal':3,'storm':5,'cry':7,'bonus':9}[form])
    sw={'normal':'#8A9AC0','storm':'#141C3A','cry':'#5A7AB8','bonus':'#C8D4F0'}[form]
    swirl=''.join(f'<path d="M{f(cx+r*math.cos(a))},{f(cy+r*0.8*math.sin(a))} A{r},{r*0.8} 0 0 1 {f(cx+r*math.cos(a+1.6))},{f(cy+r*0.8*math.sin(a+1.6))}" stroke="{sw}" stroke-width="{2.2 if form=="storm" else 1.6}" fill="none" stroke-linecap="round" opacity=".8"/>' for r,a in [(R*0.82,3.6),(R*0.68,0.4),(R*0.9,1.2),(R*0.55,4.6)])
    F.part(body,mat,cel=(R*0.12,R*0.1),deep=swirl)
    o.append(F.flush())
    # eye hollow + big anime eyes
    hol={'normal':'#5A6A9A','storm':'#0E1430','cry':'#4A64A0','bonus':'#B8C8EC'}[form]
    o.append(f'<ellipse cx="{cx}" cy="{cy+2}" rx="{R*0.62}" ry="{R*0.44}" fill="{hol}" opacity="{.55 if form!="bonus" else .35}"/>')
    iris={'normal':('#1E3A6A','#3A7AC8','#9AD8FF','#D8F4FF'),'storm':('#3A0E3A','#B83A8A','#FFB0D8','#FFE0F0'),'cry':('#1E3A6A','#3A7AC8','#9AD8FF','#D8F4FF'),'bonus':('#1E3A6A','#3A7AC8','#9AD8FF','#D8F4FF')}[form]
    ex={'normal':'teary','storm':'happy','cry':'teary','bonus':'laugh'}[form]
    o.append(big_eye(cx-17,cy,False,ex,uid+'a',iris)+big_eye(cx+17,cy,True,ex,uid+'b',iris))
    if form=='storm':
        o.append(f'<path d="M{cx-34},{cy-22} L{cx-8},{cy-12} M{cx+34},{cy-22} L{cx+8},{cy-12}" stroke="#E9DAF2" stroke-width="3.4" stroke-linecap="round"/>')
        o.append(f'<path d="M{cx-8},{cy+24} C{cx-4},{cy+20} {cx+4},{cy+20} {cx+8},{cy+24}" stroke="#E9DAF2" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
        for x,y in [(30,40),(168,52),(40,160),(160,150)]:
            o.append(f'<path d="M{x},{y} l8,-2 -4,9 8,-2 -12,16 3,-11 -7,2 Z" fill="#FFE27A" stroke="{SIL}" stroke-width="1.2" stroke-linejoin="round"/>')
    elif form=='cry':
        o.append(f'<path d="M{cx-26},{cy+14} C{cx-28},{cy+36} {cx-24},{cy+60} {cx-26},{cy+80} M{cx+26},{cy+14} C{cx+28},{cy+36} {cx+24},{cy+60} {cx+26},{cy+80}" stroke="#CFEAFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>')
        o.append(''.join(f'<path d="M{x},{y} l-3,9" stroke="#9AC8F0" stroke-width="1.6" stroke-linecap="round"/>' for x,y in [(40,150),(62,166),(140,160),(160,148),(84,176),(118,178),(52,130),(150,126)]))
        o.append(f'<path d="M{cx-8},{cy+26} C{cx-4},{cy+22} {cx+4},{cy+22} {cx+8},{cy+26}" stroke="#2A3A6A" stroke-width="2" fill="none" stroke-linecap="round"/>')
        o.append('<path d="M128,40 A40,40 0 0 1 176,76" stroke="#FF8A8A" stroke-width="3" fill="none" opacity=".7"/><path d="M130,46 A34,34 0 0 1 170,78" stroke="#FFE27A" stroke-width="3" fill="none" opacity=".7"/><path d="M132,52 A28,28 0 0 1 164,80" stroke="#8AE0A8" stroke-width="3" fill="none" opacity=".7"/>')
    elif form=='bonus':
        o.append(f'<path d="M{cx-10},{cy+20} C{cx-6},{cy+30} {cx+6},{cy+30} {cx+10},{cy+20} Z" fill="#A83E48" stroke="#6E2A2A" stroke-width="1"/>')
        o.append(f'<path d="M{cx-14},{cy-R*0.78} L{cx+2},{cy-R*1.6} L{cx+18},{cy-R*0.76} Z" fill="#E8C8A0" stroke="{SIL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M{cx-8},{cy-R*0.95} L{cx+12},{cy-R*0.94} M{cx-3},{cy-R*1.2} L{cx+8},{cy-R*1.2}" stroke="#C8584A" stroke-width="2.2"/><circle cx="{cx+2}" cy="{cy-R*1.62}" r="4" fill="#FF7A6A" stroke="{SIL}" stroke-width="1.4"/>')
        random.seed(2)
        o.append(''.join(f'<rect x="{random.uniform(10,190):.0f}" y="{random.uniform(10,190):.0f}" width="4" height="7" rx="1" fill="{random.choice(["#FF7A9A","#FFD66A","#7AD8FF","#8AE0A8"])}" transform="rotate({random.uniform(0,90):.0f} 100 100)"/>' for _ in range(18)))
    else:
        o.append(f'<path d="M{cx-6},{cy+26} C{cx-3},{cy+23} {cx+3},{cy+23} {cx+6},{cy+26}" stroke="#2A3A6A" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
    if form!='bonus':
        lx,ly=cx+R*0.55,cy+R*0.42
        o.append(f'<circle cx="{lx}" cy="{ly}" r="14" fill="#FFE6A0" opacity=".45"/><path d="M{lx},{ly-6} C{lx+4},{ly-9} {lx+9},{ly-8} {lx+10},{ly-3} C{lx+10},{ly+2} {lx+5},{ly+6} {lx},{ly+9} C{lx-5},{ly+6} {lx-10},{ly+2} {lx-10},{ly-3} C{lx-9},{ly-8} {lx-4},{ly-9} {lx},{ly-6} Z" fill="#FFD66A" stroke="{SIL}" stroke-width="1.4"/><path d="M{lx-6},{ly-4} C{lx-4},{ly-6} {lx-2},{ly-6} {lx},{ly-5}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>')
        o.append(f'<path d="M{lx-10},{ly-3} C{lx-24},{ly-14} {lx-40},{ly-2} {lx-54},{ly-12}" stroke="#E5483E" stroke-width="1.8" fill="none"/>')
    return ''.join(o)

def magpie(expr='happy',uid='mg'):
    F=Fig(uid); o=[shadow(110,186,40,6,uid)]
    # tail: two long paddles raised behind
    for k,(tip,rr) in enumerate([((22,30),5.4),((14,62),5)]):
        pts=[(84,128),( (84+tip[0])/2+6,(128+tip[1])/2+4),tip]
        F.part(limb(pts,[7,6.4,rr]),'blue',cel=(1.8,1.8),extra=f'<circle cx="{tip[0]}" cy="{tip[1]}" r="{rr+1}" fill="#FFFFFF"/><circle cx="{tip[0]+ (6 if k==0 else 7)}" cy="{tip[1]+(7 if k==0 else 3)}" r="{rr}" fill="#232234"/>')
    o.append(F.flush())
    # legs
    for x0,x1 in [(104,102),(118,120)]:
        F.part(limb([(x0,150),(x1,178)],[2.6,2.2]),'coral',cel=None,lw=0.8)
        F.part(limb([(x1-7,181),(x1,179),(x1+7,181)],[1.8,2.2,1.8]),'coral',cel=None,lw=0.8)
    o.append(F.flush())
    body=blob([(88,104),(104,96),(124,100),(138,116),(140,134),(132,150),(116,158),(98,156),(86,146),(80,128)])
    F.part(body,'blue',cel=(4,3.6),extra='<path d="M112,118 C130,118 138,134 134,150 C128,158 112,160 104,154 C110,142 112,130 112,118 Z" fill="#B8D4F4"/><path d="M118,126 C126,128 130,138 128,148 C124,140 120,132 116,128 Z" fill="#8EB0E0"/>')
    # folded wing with layered primaries
    wing=blob([(86,112),(100,108),(116,116),(120,132),(110,146),(92,150),(80,140),(78,124)])
    F.part(wing,'blue',cel=(2.6,2.4),extra=''.join(f'<path d="M{x},{y} l-12,8 l4,-10 Z" fill="#FFFFFF"/>' for x,y in [(86,146),(92,150),(98,152)])+'<path d="M90,118 C100,116 110,120 114,128" stroke="#9CC4FF" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M84,132 C94,136 104,140 112,140" stroke="#1E4392" stroke-width="1" fill="none"/>')
    F.raw('<path d="M80,130 L68,124" stroke="%s" stroke-width="5" stroke-linecap="round"/><path d="M80,130 L68,124" stroke="#FFD25A" stroke-width="3" stroke-linecap="round"/><path d="M70,125 L67,123.4" stroke="#F4A0A8" stroke-width="3" stroke-linecap="round"/>'%SIL)
    o.append(F.flush())
    head=blob([(110,48),(126,52),(136,64),(136,80),(130,94),(118,102),(104,102),(92,94),(88,80),(90,64),(98,54)])
    F.part(head,'hood',cel=(3,2.6),extra='<path d="M100,56 C108,50 118,50 126,54" stroke="#6E6C8C" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M134,66 C138,76 136,86 130,94" stroke="#B8D6FF" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    F.part('M134,72 C142,70 152,72 158,76 C152,80 144,82 134,82 Z','coral',cel=(1,1))
    o.append(F.flush())
    o.append(f'<circle cx="120" cy="74" r="11" fill="#F2CF4E"/>'+f'<g transform="translate(120 74) scale(.95) translate(-120 -74)">'+eye(120,74,True,expr,iris=('#3A2408','#B8862A','#FFE08A','#FFF4C8'),uid=uid+'e')+'</g>')
    o.append('<g fill="none" stroke="#C9962E" stroke-width="1.6"><circle cx="120" cy="74" r="14"/><path d="M106,72 L94,70 M133.6,72 C136,70 138,70 140,71"/></g>')
    o.append('<path d="M110,64 C113,62 117,61 120,62" stroke="#fff" stroke-width="1.2" opacity=".7" stroke-linecap="round"/>')
    if expr=='laugh':
        o.append('<path d="M136,82 C142,86 150,84 154,79" stroke="%s" stroke-width="1.4" fill="#A8322A"/>'%SIL)
    return ''.join(o)

def bear(expr='scared',uid='br'):
    F=Fig(uid); o=[shadow(100,188,50,7,uid)]
    for x in (82,118):
        F.part(limb([(x,160),(x+(-2 if x<100 else 2),180)],[13,12]),'bear',cel=(2,2))
        F.part(blob([(x-14,184),(x-10,176),(x,174),(x+10,176),(x+14,184),(x,188)]),'bear',cel=(1.4,1.4))
    o.append(F.flush())
    body=blob([(100,92),(122,96),(138,112),(146,136),(144,160),(130,176),(100,182),(70,176),(56,160),(54,136),(62,112),(78,96)])
    F.part(body,'bear',cel=(5,4),extra='<path d="M66,120 C62,136 62,150 68,162" stroke="#8FA8D8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><path d="M142,124 C146,140 144,156 136,168" stroke="#9CC8FF" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    F.part('M72,108 C84,122 92,128 100,128 C108,128 116,122 128,108 C122,126 112,140 100,140 C88,140 78,126 72,108 Z','moon',cel=(1.6,1.4))
    o.append(F.flush())
    # arms: paws held together at chest (shy)
    for side in (-1,1):
        sh=(100+side*36,112); el=(100+side*40,138); wr=(100+side*12,140)
        F.part(limb([sh,el,wr],[12,10.4,9]),'bear',cel=(2.4,2.2),extra='' )
        F.part(blob([(wr[0]-8,wr[1]-6),(wr[0]+8,wr[1]-7),(wr[0]+10,wr[1]+3),(wr[0],wr[1]+9),(wr[0]-9,wr[1]+4)]),'bear',cel=(1.4,1.2))
    o.append(F.flush())
    F.part('M64,94 C78,106 122,106 136,94 C140,98 140,106 134,109 C118,116 82,116 66,109 C60,106 60,98 64,94 Z','scarf',cel=(1.6,1.4),extra=''.join(f'<path d="M{x},{103} l1,9" stroke="#B23436" stroke-width="1"/>' for x in range(70,132,6)))
    F.part('M70,104 L64,132 L74,131 L78,108 Z','scarf',cel=(1,1),extra='<path d="M64,128 L74,127 M65,131 l-1,4 M69,131 l0,4 M73,131 l1,4" stroke="#FFC4B0" stroke-width="1"/>')
    o.append(F.flush())
    for ex in (-1,1):
        F.part(f'M{100+ex*30},{34} a11,11 0 1,1 .1,0 Z','bear',cel=(1.4,1.4),extra=f'<circle cx="{100+ex*30}" cy="{45}" r="5.6" fill="#6E5A6A"/>')
    head=blob([(100,30),(122,34),(136,48),(140,66),(134,84),(118,96),(100,99),(82,96),(66,84),(60,66),(64,48),(78,34)])
    F.part(head,'bear',cel=(3.4,3),extra='<path d="M136,52 C142,64 140,78 132,88" stroke="#9CC8FF" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M74,44 C82,38 92,35 102,35" stroke="#8A88A8" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    F.part('M100,68 C112,68 118,74 118,81 C118,89 110,93 100,93 C90,93 82,89 82,81 C82,74 88,68 100,68 Z','tan',cel=(1.6,1.4))
    o.append(F.flush())
    o.append('<ellipse cx="100" cy="74" rx="6" ry="4" fill="#1A1420"/><ellipse cx="98" cy="72.6" rx="2" ry="1" fill="#fff" opacity=".7"/>')
    iris=('#0E0A12','#3A2E4A','#8A7AA8','#C8B8E8')
    o.append(f'<g transform="translate(84 60) scale(.72) translate(-84 -60)">'+eye(84,60,False,'teary' if expr=='scared' else expr,iris=iris,uid=uid+'a')+'</g>'+f'<g transform="translate(116 60) scale(.72) translate(-116 -60)">'+eye(116,60,True,'teary' if expr=='scared' else expr,iris=iris,uid=uid+'b')+'</g>')
    if expr=='scared':
        o.append('<path d="M74,46 L90,42 M126,46 L110,42" stroke="#A9A0BC" stroke-width="2.4" stroke-linecap="round" transform="rotate(0)"/>'.replace('M74,46 L90,42','M76,48 L90,42').replace('M126,46 L110,42','M124,48 L110,42'))
        o.append('<path d="M94,84 C96,86 98,86 100,84 C102,86 104,86 106,84" stroke="#3A2838" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M140,40 C142,44 143,47 141,49 C139,51 136,50 136,47 C136,45 138,42 140,40 Z" fill="#BFE6FF" stroke="#3A2838" stroke-width="1"/>')
    elif expr=='brave':
        o.append('<path d="M74,44 L90,48 M126,44 L110,48" stroke="#A9A0BC" stroke-width="2.6" stroke-linecap="round"/><path d="M94,84 L106,84" stroke="#3A2838" stroke-width="1.6" stroke-linecap="round"/>')
    else:
        o.append('<path d="M92,84 C96,90 104,90 108,84" stroke="#3A2838" stroke-width="1.6" fill="#A83E48" stroke-linecap="round"/>')
    o.append('<ellipse cx="74" cy="76" rx="6" ry="3" fill="#FF8A80" opacity=".45"/><ellipse cx="126" cy="76" rx="6" ry="3" fill="#FF8A80" opacity=".45"/>')
    return ''.join(o)

if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/cast/'
    import os; os.makedirs(D,exist_ok=True)
    for fm in ['normal','storm','cry','bonus']: open(D+f'shushu-{fm}.svg','w').write(svg(shushu(fm,'ss'+fm)))
    for e in ['happy','laugh','teary']: open(D+f'alan-{e}.svg','w').write(svg(magpie(e,'mg'+e)))
    for e in ['scared','brave','laugh']: open(D+f'heitang-{e}.svg','w').write(svg(bear(e,'br'+e)))

# ---------------- adult NPC template (light chibi, ~4.5 heads) ----------------
def _mat(name,base,shade,deep,line): MAT[name]=(base,shade,deep,line)
def adult(cfg,uid):
    """cfg keys: top/bottom/shoe (hex tuples), hair(style,color), eyes('open'|'closed'|'hidden'), extras list, scale, glow"""
    F=Fig(uid); o=[shadow(100,190,34,5,uid)]
    for k in ('top','bottom','shoe','hairc','skinN'):
        if k in cfg: _mat(uid+k,*cfg[k])
    skin=uid+'skinN' if 'skinN' in cfg else 'skin'
    J=dict(head=(100,34),neck=(100,58),shL=(80,68),shR=(120,68),elL=(73,96),elR=(127,96),wrL=(71,120),wrR=(129,118),
           hipL=(91,122),hipR=(109,122),knL=(90,152),knR=(110,152),anL=(89,179),anR=(111,179))
    J.update(cfg.get('joints',{}))
    if 'back' in cfg: o.append(cfg['back'])
    # legs + shoes
    for side in 'LR':
        F.part(limb([J['hip'+side],J['kn'+side],J['an'+side]],[10,8,6.2]),uid+'bottom',cel=(2,1.8))
        ax,ay=J['an'+side]
        F.part(blob([(ax-8,ay+1),(ax-6,ay-4),(ax+6,ay-4),(ax+11,ay+3),(ax+8,ay+8),(ax-7,ay+8)]),uid+'shoe',cel=(1,1))
    o.append(F.flush())
    F.part(limb([(100,50),(100,62)],[6.4,7]),skin,cel=(1,1))
    torso=blob([(100,60),(113,61),(123,67),(125,86),(123,106),(120,126),(100,130),(80,126),(77,106),(75,86),(77,67),(87,61)])
    F.part(torso,uid+'top',cel=(3,2.6),extra=cfg.get('torsoX',''))
    o.append(F.flush())
    for side in 'LR':
        F.part(limb([J['sh'+side],J['el'+side],J['wr'+side]],[7,6,4.8]),uid+'top',cel=(1.6,1.4))
        wx,wy=J['wr'+side]
        F.part(blob([(wx-4.8,wy),(wx-4,wy+6),(wx,wy+9),(wx+4,wy+6),(wx+4.8,wy)]),skin,cel=(0.8,0.8),lw=0.9)
    o.append(F.flush())
    if 'front' in cfg: o.append(cfg['front'])
    # head
    hx,hy=J['head']
    face=f'M{hx},{hy-22} C{hx+14},{hy-22} {hx+21},{hy-12} {hx+21},{hy} C{hx+21},{hy+12} {hx+13},{hy+21} {hx},{hy+24} C{hx-13},{hy+21} {hx-21},{hy+12} {hx-21},{hy} C{hx-21},{hy-12} {hx-14},{hy-22} {hx},{hy-22} Z'
    hs,hc=cfg['hair']
    _mat(uid+'hair',*hc)
    if hs in ('bun','long','perm'):
        back={'bun':blob([(hx-22,hy-2),(hx-20,hy-20),(hx,hy-28),(hx+20,hy-20),(hx+22,hy-2),(hx+16,hy+12),(hx-16,hy+12)]),
              'long':blob([(hx-23,hy-4),(hx-20,hy-22),(hx,hy-29),(hx+20,hy-22),(hx+23,hy-4),(hx+22,hy+26),(hx,hy+30),(hx-22,hy+26)]),
              'perm':cloud_outline(hx,hy-6,27,lobes=12,amp=0.18,seed=4)}[hs]
        F.part(back,uid+'hair',cel=(1.6,1.4))
        if hs=='bun': F.part(f'M{hx+6},{hy-30} a9,9 0 1,1 .1,0 Z',uid+'hair',cel=(1.2,1))
    F.part(face,skin,cel=(2.6,2),extra=f'<path d="M{hx-21},{hy-6} C{hx-10},{hy-12} {hx+10},{hy-12} {hx+21},{hy-6} L{hx+21},{hy-30} L{hx-21},{hy-30} Z" fill="{MAT[skin][1]}" opacity=".0"/>')
    o.append(F.flush())
    # face features
    ey=hy+3
    if cfg.get('eyes','open')=='open':
        for ex,fl in ((hx-8,1),(hx+8,-1)):
            o.append(f'<ellipse cx="{ex}" cy="{ey}" rx="4.4" ry="4.6" fill="#fff"/><circle cx="{ex}" cy="{ey+0.6}" r="3.4" fill="{cfg.get("iris","#5A3A2A")}"/><circle cx="{ex}" cy="{ey+0.8}" r="1.5" fill="#1A0E0A"/><circle cx="{ex-1.2*fl}" cy="{ey-1}" r="1.1" fill="#fff"/>')
            o.append(f'<path d="M{ex-5},{ey-1} C{ex-3},{ey-6} {ex+3},{ey-6} {ex+5.4},{ey-1.6} L{ex+5.6},{ey-3.4} C{ex+3},{ey-8} {ex-3},{ey-8} {ex-5.4},{ey-2} Z" fill="#2E1A12"/>')
    elif cfg['eyes']=='closed':
        o.append(f'<path d="M{hx-12},{ey} C{hx-10},{ey+3} {hx-6},{ey+3} {hx-4},{ey} M{hx+4},{ey} C{hx+6},{ey+3} {hx+10},{ey+3} {hx+12},{ey}" stroke="#2E1A12" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    o.append(f'<path d="M{hx+0.6},{hy+10} l1.2,1.4" stroke="#C9786A" stroke-width="1" stroke-linecap="round"/>')
    o.append(cfg.get('mouth',f'<path d="M{hx-3},{hy+15} C{hx-1},{hy+17} {hx+1},{hy+17} {hx+3},{hy+15}" stroke="#7A2A32" stroke-width="1.3" fill="none" stroke-linecap="round"/>'))
    o.append(f'<ellipse cx="{hx-13}" cy="{hy+10}" rx="3.6" ry="2" fill="#FF8A80" opacity=".35"/><ellipse cx="{hx+13}" cy="{hy+10}" rx="3.6" ry="2" fill="#FF8A80" opacity=".35"/>')
    # front hair
    fr={'short':f'M{hx-21},{hy-2} C{hx-23},{hy-20} {hx-10},{hy-28} {hx+2},{hy-28} C{hx+16},{hy-28} {hx+24},{hy-18} {hx+21},{hy-2} L{hx+16},{hy-12} L{hx+11},{hy-6} L{hx+7},{hy-14} L{hx+1},{hy-8} L{hx-4},{hy-15} L{hx-9},{hy-8} L{hx-14},{hy-14} Z',
        'bun':f'M{hx-21},{hy-1} C{hx-22},{hy-18} {hx-10},{hy-26} {hx+2},{hy-26} C{hx+16},{hy-26} {hx+23},{hy-16} {hx+21},{hy-1} C{hx+14},{hy-10} {hx+6},{hy-15} {hx-2},{hy-15} C{hx-10},{hy-13} {hx-16},{hy-8} {hx-21},{hy-1} Z',
        'long':f'M{hx-21},{hy+4} C{hx-23},{hy-18} {hx-10},{hy-27} {hx+2},{hy-27} C{hx+16},{hy-27} {hx+23},{hy-16} {hx+21},{hy+4} L{hx+16},{hy-10} C{hx+8},{hy-14} {hx-6},{hy-16} {hx-14},{hy-10} Z',
        'perm':None,'bald':f'M{hx-21},{hy+2} C{hx-23},{hy-6} {hx-20},{hy-12} {hx-16},{hy-12} C{hx-14},{hy-4} {hx-16},{hy+2} {hx-18},{hy+6} Z M{hx+21},{hy+2} C{hx+23},{hy-6} {hx+20},{hy-12} {hx+16},{hy-12} C{hx+14},{hy-4} {hx+16},{hy+2} {hx+18},{hy+6} Z'}.get(hs)
    if fr: F.part(fr,uid+'hair',cel=(1.2,1)); o.append(F.flush())
    if hs=='perm':
        o.append(f'<g>'+''.join(f'<circle cx="{hx+dx}" cy="{hy+dy}" r="5.4" fill="{hc[0]}" stroke="{hc[3]}" stroke-width="1"/>' for dx,dy in [(-14,-14),(-6,-20),(4,-20),(13,-15),(-18,-6),(18,-7)])+'</g>')
    o.append(cfg.get('headX',''))
    if cfg.get('glow'):
        o=[f'<defs><radialGradient id="{uid}gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#BFE6FF" stop-opacity=".7"/><stop offset="1" stop-color="#BFE6FF" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="100" rx="70" ry="96" fill="url(#{uid}gl)"/><g opacity=".88">']+o+['</g>']
    return ''.join(o)

SK=('#FFE2CE','#F2BCA6','#E09A88','#C9786A')
NPCS={
 'uncle':dict(top=('#8A9098','#6A7078','#545A62','#3A4048'),bottom=('#7A5A44','#5E4434','#4A3428','#3A2820'),shoe=('#4A3A30','#36281E','#2A2018','#1E1610'),
   hair=('bald',('#F4F2EA','#D8D4CA','#BEB8AC','#8A847A')),eyes='hidden',joints=dict(head=(100,40),neck=(100,62),shL=(80,72),shR=(120,72),elL=(74,98),elR=(126,96),wrL=(72,120),wrR=(130,114),hipL=(91,124),hipR=(109,124),knL=(90,154),knR=(110,154),anL=(89,180),anR=(111,180)),
   headX='<path d="M78,38 C84,32 92,32 98,36 C92,38 86,40 80,42 Z M122,38 C116,32 108,32 102,36 C108,38 114,40 120,42 Z" fill="#F4F2EA" stroke="#8A847A" stroke-width="1"/><path d="M86,50 C88,64 94,72 100,74 C106,72 112,64 114,50 C108,54 92,54 86,50 Z" fill="#F4F2EA" stroke="#8A847A" stroke-width="1.2"/><path d="M60,22 C72,14 128,14 140,22 C130,26 70,26 60,22 Z M80,20 C84,6 116,6 120,20 Z" fill="#E8C878" stroke="#5A2C34" stroke-width="1.8" stroke-linejoin="round"/><path d="M84,16 L116,16" stroke="#B88A3A" stroke-width="1.4"/>',
   front='<path d="M130,90 C132,120 134,150 136,186" stroke="#5A2C34" stroke-width="5.4" stroke-linecap="round" fill="none"/><path d="M130,90 C132,120 134,150 136,186" stroke="#A8784E" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M128,90 C126,84 132,80 136,84" stroke="#A8784E" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
   mouth='',skinN=SK),
 'clerk':dict(top=('#F4F4F0','#D8D8D4','#C0C0BC','#8A8A86'),bottom=('#3A3E4A','#2A2E38','#20242C','#14161C'),shoe=('#2A2A30','#1E1E24','#16161A','#0E0E12'),
   hair=('short',('#3A2A24','#26180F','#1A100A','#120A06')),eyes='closed',iris='#3A2A1A',
   torsoX='<path d="M82,60 L118,60 L118,122 L82,122 Z" fill="#2E9A5A"/>'+''.join(f'<path d="M80,{y} L120,{y}" stroke="#F28A3A" stroke-width="4"/>' for y in (74,90,106))+'<path d="M96,56 L100,122 L104,56" fill="#F4F4F0"/><rect x="104" y="70" width="10" height="5" rx="1" fill="#FFF" stroke="#8A8A86" stroke-width=".6"/>',
   front='<path d="M120,112 L134,104 L138,110 L126,118 Z" fill="#3A3E4A" stroke="#5A2C34" stroke-width="1.4"/><circle cx="136" cy="106" r="2" fill="#FF4D4D"/>',
   mouth='<path d="M94,44 C97,49 103,49 106,44" stroke="#7A2A32" stroke-width="1.4" fill="#A83E48"/>',skinN=SK),
 'announcer':dict(top=('#DDF0FF','#B8DCF8','#9AC8F0','#6A9ACC'),bottom=('#C8E6FF','#A8D0F4','#8ABCEC','#6A9ACC'),shoe=('#9AC8F0','#7AB0E0','#5A98D0','#3A78B0'),
   hair=('long',('#C8E0FF','#A8C8F4','#8AB0E8','#6A90C8')),eyes='closed',glow=True,skinN=('#F4FAFF','#DCEAF8','#C4D8F0','#8AA8D0'),
   headX='<path d="M80,10 C86,0 114,0 120,10 L122,16 L78,16 Z" fill="#E8F6FF" stroke="#8AC8FF" stroke-width="1.6"/><rect x="76" y="14" width="48" height="5" rx="2" fill="#BFE6FF" stroke="#8AC8FF" stroke-width="1.2"/><circle cx="100" cy="8" r="2.6" fill="#FFE9A0"/>',
   front='<path d="M78,116 L72,104" stroke="#8AC8FF" stroke-width="2"/><circle cx="71" cy="102" r="3.4" fill="#E8F6FF" stroke="#8AC8FF" stroke-width="1.2"/>',
   mouth='<path d="M97,44 C99,46 101,46 103,44" stroke="#6A90C8" stroke-width="1.3" fill="none" stroke-linecap="round"/>'),
 'backpacker':dict(top=('#3E9A8A','#2E7A6E','#226056','#164A42'),bottom=('#C8B48A','#A8946C','#8A7854','#6A5A3E'),shoe=('#6A4A34','#4E3424','#3A261A','#2A1A10'),
   hair=('short',('#E8C878','#C8A858','#A88A40','#7A6430')),iris='#3A7AC8',
   back='<path d="M74,46 C62,48 56,64 56,92 C56,116 64,128 80,128 L120,128 C136,128 144,116 144,92 C144,64 138,48 126,46 Z" fill="#E8833A" stroke="#5A2C34" stroke-width="2.6"/><path d="M74,46 C80,40 120,40 126,46 L124,56 L76,56 Z" fill="#C8662A" stroke="#5A2C34" stroke-width="2"/><rect x="58" y="96" width="12" height="22" rx="4" fill="#C8662A" stroke="#5A2C34" stroke-width="1.6"/><rect x="130" y="96" width="12" height="22" rx="4" fill="#C8662A" stroke="#5A2C34" stroke-width="1.6"/>',
   front='<path d="M70,104 L130,98 L134,128 L74,134 Z" fill="#F4EAD0" stroke="#5A2C34" stroke-width="1.8" stroke-linejoin="round"/><path d="M86,104 L90,132 M102,102 L106,130 M118,100 L122,128" stroke="#C8B48A" stroke-width="1"/><path d="M80,118 C90,112 104,124 124,114" stroke="#4A8BDA" stroke-width="1.6" fill="none"/><text x="102" y="126" text-anchor="middle" font-family="Fredoka" font-size="6" fill="#8A5E1E" transform="rotate(180 102 120)">MAP</text>',
   headX='<path d="M70,14 C76,8 124,8 130,14 C122,18 78,18 70,14 Z M82,12 C84,0 116,0 118,12 Z" fill="#E8D8A8" stroke="#5A2C34" stroke-width="1.6"/>',skinN=('#F6D8C4','#E6B8A0','#D49A84','#B8786A')),
 'mom':dict(top=('#C8B8E8','#A898D0','#8E7EBC','#6A5A98'),bottom=('#C8B8E8','#A898D0','#8E7EBC','#6A5A98'),shoe=('#F4E6F0','#DCC8D8','#C8B0C4','#8A7090'),
   hair=('bun',('#4A3028','#321E18','#22140F','#160C08')),eyes='closed',torsoX=''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#FFF4FF"/>' for x,y in [(90,76),(108,84),(94,100),(110,106),(100,90)]),
   mouth='<path d="M97,44 C99,46.6 101,46.6 103,44" stroke="#7A2A32" stroke-width="1.3" fill="none" stroke-linecap="round"/>',skinN=SK),
 'dad':dict(top=('#6A88B8','#506C98','#3E5680','#2A3C5E'),bottom=('#8A8A86','#6E6E6A','#5A5A56','#3A3A38'),shoe=('#3A6AB8','#2A5498','#1E4078','#142C58'),
   hair=('short',('#2A2020','#1A1212','#120C0C','#0A0606')),eyes='closed',
   headX='<g fill="none" stroke="#2A2A30" stroke-width="1.4"><circle cx="92" cy="33" r="5.6"/><circle cx="108" cy="33" r="5.6"/><path d="M97.6,33 L102.4,33"/></g><g fill="#5A4A4A" opacity=".5">'+''.join(f'<circle cx="{x}" cy="{y}" r=".6"/>' for x,y in [(90,46),(93,48),(96,49),(100,50),(104,49),(107,48),(110,46)])+'</g>',
   front='<rect x="118" y="108" width="7" height="16" rx="2" fill="#2A2A30" stroke="#5A2C34" stroke-width="1.2" transform="rotate(-20 121 116)"/><circle cx="121" cy="112" r="1.2" fill="#FF4D4D"/>',
   mouth='<path d="M96,45 C98,46 102,46 104,45" stroke="#7A2A32" stroke-width="1.3" fill="none" stroke-linecap="round"/>',skinN=SK),
 'grandma':dict(top=('#E87A8A','#C85A6E','#A84458','#7A2E3E'),bottom=('#6A5A7A','#54466A','#423656','#2E2440'),shoe=('#3A2E30','#2A2022','#1E1618','#120C0E'),
   hair=('perm',('#D8D4DC','#B8B4C0','#9A96A6','#6E6A7A')),iris='#5A3A2A',
   torsoX=''.join(f'<circle cx="{x}" cy="{y}" r="2.4" fill="#FFE08A"/><circle cx="{x}" cy="{y}" r="1" fill="#FF9A6A"/>' for x,y in [(90,74),(108,80),(96,96),(112,100),(88,110),(104,114)])+'<path d="M84,60 L92,122 M116,60 L108,122" stroke="#F4E6D0" stroke-width="6"/>',
   headX='<g fill="none" stroke="#B88A3A" stroke-width="1.2"><circle cx="92" cy="33" r="5.4"/><circle cx="108" cy="33" r="5.4"/><path d="M97.4,33 L102.6,33 M86.6,34 C84,44 86,54 92,60 M113.4,34 C116,44 114,54 108,60"/></g>',
   front='<path d="M72,112 L64,96 L84,92 Z" fill="#F4E6C8" stroke="#5A2C34" stroke-width="1.4" stroke-linejoin="round"/><path d="M72,112 L68,98 M72,112 L74,95 M72,112 L80,94" stroke="#C8A878" stroke-width=".9"/>',
   mouth='<path d="M95,44 C98,47.4 102,47.4 105,44" stroke="#7A2A32" stroke-width="1.4" fill="none" stroke-linecap="round"/>',skinN=('#F8DCC8','#E8BCA6','#D8A08A','#B87C6A')),
}
if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/cast/'
    for k,cfg in NPCS.items(): open(D+f'npc-{k}.svg','w').write(svg(adult(cfg,'np'+k)))
