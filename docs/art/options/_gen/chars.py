"""Characters for option B (paper-cut) and C (neon sign), sharing the geometry of option A."""
# --- shared geometry (from reference/baokaka-crawl.svg and mocha-cat.svg)
BK = dict(
 body="M17,62 C17,50 30,45 42,49 C52,52 60,56 64,63 C67,70 63,79 55,81 C44,83 30,82 22,78 C17,74 16,68 17,62 Z",
 head="M70,23.5 C83,23.5 92.5,32 92.5,44 C92.5,56 83,65 70,65 C57,65 48,56.5 48,44.5 C48,32 57.5,23.5 70,23.5 Z",
 legs="M19,70 C14,79 18,89.4 29,89.8 C38,90.2 45,88.4 45,82.6 C45,76.4 39,72 31,70 Z",
 armFar="M55,66 C57,74 57,81 56,86", armNear="M62,66 C66,74 67,81 67,86",
 hairZig="M48.6,42 C48,30 57,22.4 70,22.4 C82,22.4 92,29.6 92.2,39 L88,35 L85,39 L81,34 L77,38.6 L73,33.6 L69,38.4 L65,34 L61,38.6 L57.6,35 L54,40 L51.6,37.6 Z",
 hairSoft="M48.6,42 C48,30 57,22.4 70,22.4 C82,22.4 92,29.6 92.2,39 C89.6,35.6 86,34.2 82.4,35 C80.4,32.4 76.8,32 74,34 C71.4,31.4 67,31.8 64.8,34.6 C61,32.8 56.6,34.4 54.8,37.6 C52,38 50,39.6 48.6,42 Z",
 sprout="M70.4,23 C69,17 72.6,13.6 77.4,14.8 C74.6,15.8 73.4,18.6 74.4,22.8",
)
MC = dict(
 body="M29,90.5 C25.5,77 29.5,63.5 41,58 C49,54.4 60,55 67,60.5 C75.5,67 78,80 73.5,90.5 C62,92.2 40,92.2 29,90.5 Z",
 head="M50,17 C63,17 72.5,24 74.5,34 C77.5,36.5 78,41 75.2,43 C73.5,52 63.5,58 50,58 C36.5,58 26.5,52 24.8,43.4 C22,41.4 22.4,37 25.4,34.4 C27.4,24 37,17 50,17 Z",
 earL="M27.6,30 C26.4,21 27.4,13 30.4,9.6 C35.4,11.4 41,16.4 43.4,21.4 Z",
 earR="M58.4,20.6 C62,15.6 67.4,11.4 72,10 C74.4,13.6 75,21 73.4,29.4 Z",
 tail="M68,88 C82,89 89,81 88,70 C87,62 82,58 84,50 C85.5,45 89,42.5 92,43.5",
 bib="M40,62 C44,60 54,60 58,62.5 C59.5,70 58.5,78 57,90.4 L41.6,90.4 C39.6,79 38.8,70 40,62 Z",
 muzzle="M52.4,40 C58.8,40 64,44 63.4,49 C62.8,54 57.6,56 52.4,56 C47.2,56 41.6,54 41.2,49 C40.8,44 46,40 52.4,40 Z",
 bandana="M33,55 C42,60.4 58,60.4 67.4,55 L66,60 C60,62.4 55,63 50,70.5 C45,63 40,62.4 34.4,60 Z",
 eyeL="M35,37.6 C35.6,32.4 39.6,30.4 43,30.8 C46.6,31.4 48.6,34.6 48,38.6 C47.4,42.6 44.2,44.4 41.2,44 C37.6,43.4 34.6,41 35,37.6 Z",
 eyeR="M56.4,38.6 C55.8,34.6 57.8,31.4 61.2,30.8 C64.4,30.4 67.8,32.4 68.2,37.4 C68.6,40.8 66,43.4 62.6,44 C59.4,44.4 56.8,42.4 56.4,38.6 Z",
)
def star(x,y,s,fill,op=1):
    return f'<path d="M{x},{y-s} L{x+s*0.3},{y-s*0.3} L{x+s},{y} L{x+s*0.3},{y+s*0.3} L{x},{y+s} L{x-s*0.3},{y+s*0.3} L{x-s},{y} L{x-s*0.3},{y-s*0.3} Z" fill="{fill}" opacity="{op}"/>'

# ================= B: PAPER-CUT =================
PSH='#1B1433'
class Paper:
    def __init__(s,ox=1.3,oy=1.8,op=0.32): s.o=[];s.ox,s.oy,s.op=ox,oy,op
    def p(s,d,fill,sh=True):
        if sh: s.o.append(f'<path d="{d}" fill="{PSH}" opacity="{s.op}" transform="translate({s.ox} {s.oy})"/>')
        s.o.append(f'<path d="{d}" fill="{fill}"/>')
    def e(s,cx,cy,rx,ry,fill,sh=True,rot=0):
        t=f' transform="rotate({rot} {cx} {cy})"' if rot else ''
        if sh: s.o.append(f'<g transform="translate({s.ox} {s.oy})"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{PSH}" opacity="{s.op}"{t}/></g>')
        s.o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{t}/>')
    def st(s,d,w,col,sh=True,cap='round'):
        if sh: s.o.append(f'<path d="{d}" stroke="{PSH}" opacity="{s.op}" stroke-width="{w}" stroke-linecap="{cap}" fill="none" transform="translate({s.ox} {s.oy})"/>')
        s.o.append(f'<path d="{d}" stroke="{col}" stroke-width="{w}" stroke-linecap="{cap}" fill="none"/>')
    def raw(s,x): s.o.append(x)
    def out(s): return '\n'.join(s.o)

def paper_baokaka():
    P=Paper()
    P.raw('<ellipse cx="50" cy="91" rx="36" ry="4.4" fill="#1B1433" opacity="0.28"/>')
    P.e(20,77,5,6.4,'#E9D6B4',rot=-24)
    P.st(BK['armFar'],7.6,'#E3A23A'); P.e(56.4,88,3.4,3.4,'#EDB49C')
    P.p(BK['legs'],'#F2B440')
    P.e(14.6,84,5.6,7,'#FFF3DC',rot=-18)
    for x,y in [(13.4,81),(15.6,83.6),(13.8,86.4)]: P.e(x,y,1,1,'#E8963A',sh=False)
    P.p(BK['body'],'#FFCB4F')
    P.p("M22,72 C32,80 50,81 63,72 C62,77 59,80 55,81 C44,83 30,82 22,78 C19,76 18,74 18,72 Z",'#F2AE3A',sh=False)
    for (x,y,s_) in [(30,58,2.4),(42,55,1.9),(27,70,1.9),(38,67,2.4)]: P.raw(star(x,y,s_,'#FFF4D6'))
    P.e(48.4,68,2,2,'#9C6A48',sh=False);P.e(55.6,68,2,2,'#9C6A48',sh=False)
    P.e(52,72,5,5,'#B57E56'); P.e(52,73.6,2.6,2,'#F6E2C4',sh=False)
    P.e(50.2,71,0.75,0.75,'#2A1F3D',sh=False);P.e(53.8,71,0.75,0.75,'#2A1F3D',sh=False)
    P.st(BK['armNear'],7.8,'#FFCB4F'); P.e(67.6,88.4,4.4,3.4,'#FFE0C8')
    P.st("M63.8,85.4 C65.6,86.4 69.4,86.4 71,85.4",1.8,'#E8553D',sh=False)
    P.e(49.6,46.4,4,5,'#FFD6BC')
    P.p(BK['head'],'#FFE0C8')
    P.p("M86,30 C95,40 93,58 76,65 C85,60 90,50 88,38 Z",'#F7C6AE',sh=False)
    P.st(BK['sprout'],2.8,'#5A3A2E')
    P.p(BK['hairZig'],'#5A3A2E')
    P.e(60.4,53.6,3.6,2.4,'#F59AA8',sh=False); P.e(86.4,52.6,3,2.1,'#F59AA8',sh=False)
    for (x,y,rx,ry) in [(65.6,47.6,3,3.9),(81,47.2,2.8,3.8)]:
        P.e(x,y,rx,ry,'#2A1F3D',sh=False); P.e(x+1.1,y-1.6,1.2,1.2,'#FFFFFF',sh=False)
    P.p("M70.2,55 C71.6,58.8 76.8,58.8 78.2,55 Z",'#C8443E',sh=False)
    return P.out()

def paper_mocha():
    P=Paper()
    P.raw('<ellipse cx="51" cy="92.2" rx="28" ry="4.2" fill="#1B1433" opacity="0.28"/>')
    P.st(MC['tail'],7.6,'#D08A4E')
    P.raw(f'<path d="{MC["tail"]}" stroke="#8E5530" stroke-width="7.6" stroke-dasharray="3.2 5.4" stroke-dashoffset="-6" fill="none"/>')
    P.p(MC['body'],'#D08A4E')
    P.p("M58,66 C70,62 78,72 75,90.6 L58,91.4 Z",'#B8723E',sh=False)
    for d in ["M66,64 C69,68 70,72 69.4,76","M71.6,70 C73.6,74 74.2,78 73.4,82","M31.4,72 C30.4,76 30.6,80 31.6,84"]:
        P.st(d,2.8,'#8E5530',sh=False)
    P.p(MC['bib'],'#FFF3DE')
    P.p("M38.6,90.6 C38.6,86.6 41.4,85.6 44.4,85.6 C47.6,85.6 49.4,87 49.4,90.6 Z",'#FFFFFF')
    P.p("M49.6,90.6 C49.6,86.8 52.2,85.8 55,85.8 C58,85.8 59.8,87.2 59.8,90.6 Z",'#F2E4D2')
    P.p(MC['bandana'],'#2F6FC0')
    for (x,y) in [(42,60.6),(50,64.6),(57.6,60.8)]: P.e(x,y,1.1,1.1,'#FFF3DE',sh=False)
    P.e(50,70.6,3,3,'#F7CF5A')
    P.p(MC['earL'],'#D08A4E'); P.p("M30.4,26 C30,20 30.4,15.6 31.8,13.4 C35,15 38,18 39.6,21.4 Z",'#F59AA8',sh=False)
    P.p(MC['earR'],'#B8723E'); P.p("M62.4,20.6 C64.8,17.6 67.8,15.2 70.4,14 C71.6,17 71.8,21 71,25 Z",'#E88A98',sh=False)
    P.p(MC['head'],'#D89058')
    P.p("M70,26 C79,36 76,52 60,58 C70,52 74,44 72,34 Z",'#BC7840',sh=False)
    for d,w in [("M43.4,27.6 L46.4,21.4 L50.8,26.4 L55.2,21.2 L58.2,27.4",2.6),("M24.6,38.4 C27.4,38.6 30,39.6 31.4,41.4",2.2),("M75.6,38 C73.4,38.2 71.4,39.2 70.2,40.8",2)]:
        P.raw(f'<path d="{d}" stroke="#8E5530" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>')
    P.p(MC['muzzle'],'#FFF3DE',sh=False)
    P.p("M49.8,44.6 C50.6,43.4 54.2,43.4 55,44.6 C54.6,46.2 53.2,47.2 52.4,47.2 C51.6,47.2 50.2,46.2 49.8,44.6 Z",'#F0828A',sh=False)
    P.raw('<path d="M48.8,49.2 C50,51 51.8,50.8 52.4,49 C53,50.8 54.8,51 56,49.2" stroke="#6E3A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>')
    for d,cx in [(MC['eyeL'],42),(MC['eyeR'],62.4)]:
        P.p(d,'#B9CC4C',sh=False); P.e(cx,37.6,2.4,4.2,'#2A1F3D',sh=False); P.e(cx+1.8,34.6,1.4,1.4,'#FFFFFF',sh=False)
    P.e(38,48.6,3.2,2,'#F59AA8',sh=False); P.e(66.4,48.4,2.8,1.8,'#F59AA8',sh=False)
    return P.out()

# ================= C: NEON SIGN =================
def glow(d,col,core='#FFFFFF',w=1.6,kind='path',extra=''):
    """Neon tube: 3 stacked strokes, no filters."""
    return (f'<path d="{d}" stroke="{col}" stroke-width="{w*4.4}" opacity="0.14" fill="none" stroke-linecap="round" stroke-linejoin="round"{extra}/>'
            f'<path d="{d}" stroke="{col}" stroke-width="{w*2.2}" opacity="0.5" fill="none" stroke-linecap="round" stroke-linejoin="round"{extra}/>'
            f'<path d="{d}" stroke="{core}" stroke-width="{w}" fill="none" stroke-linecap="round" stroke-linejoin="round"{extra}/>')
def ell(cx,cy,rx,ry,rot=0):
    # ellipse as path so glow() can stroke it
    import math
    return f'M{cx-rx},{cy} a{rx},{ry} 0 1,0 {2*rx},0 a{rx},{ry} 0 1,0 {-2*rx},0 Z' if not rot else f'M{cx-rx},{cy} a{rx},{ry} {rot} 1,0 {2*rx},0 a{rx},{ry} {rot} 1,0 {-2*rx},0 Z'

def neon_baokaka():
    Y='#FFC94A'; CORE='#FFF6D6'
    o=[]
    o.append('<ellipse cx="50" cy="91" rx="36" ry="4.6" fill="#FFC94A" opacity="0.16"/>')
    o.append(f'<ellipse cx="20" cy="77" rx="5" ry="6.4" transform="rotate(-24 20 77)" fill="#3A2E4E"/>')
    o.append(f'<path d="{BK["armFar"]}" stroke="#7A5A2E" stroke-width="7" stroke-linecap="round" fill="none"/>')
    o.append(f'<path d="{BK["legs"]}" fill="#A87A2E"/>'); o.append(glow(BK['legs'],Y,CORE,1.2))
    o.append(f'<ellipse cx="14.6" cy="84" rx="5.6" ry="7" transform="rotate(-18 14.6 84)" fill="#5A4A66"/>')
    o.append(glow(ell(14.6,84,5.6,7),Y,CORE,1.1,extra=' transform="rotate(-18 14.6 84)"'))
    o.append(f'<path d="{BK["body"]}" fill="#C8952E"/>')
    o.append(f'<path d="M22,72 C32,80 50,81 63,72 C62,77 59,80 55,81 C44,83 30,82 22,78 C19,76 18,74 18,72 Z" fill="#A87A2E"/>')
    for (x,y,s_) in [(30,58,2.2),(42,55,1.8),(27,70,1.8),(38,67,2.2)]: o.append(star(x,y,s_,'#FFF2B0',0.95))
    o.append(glow(BK['body'],Y,CORE,1.4))
    o.append(glow("M48,70 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0",'#FF9A4D','#FFE4C8',1))
    o.append(f'<path d="{BK["armNear"]}" stroke="#C8952E" stroke-width="7.4" stroke-linecap="round" fill="none"/>')
    o.append(glow(BK['armNear'],Y,CORE,1.2))
    o.append('<ellipse cx="67.6" cy="88.4" rx="4.4" ry="3.4" fill="#E9B8A6"/>')
    o.append(glow("M63.8,85.4 C65.6,86.4 69.4,86.4 71,85.4",'#FF4D8D','#FFD0E0',1.2))
    o.append('<ellipse cx="49.6" cy="46.4" rx="4" ry="5" fill="#E2AE9A"/>')
    o.append(f'<path d="{BK["head"]}" fill="#F2C2AE"/>')
    o.append(f'<path d="{BK["hairSoft"]}" fill="#3A2830"/>')
    o.append(glow(BK['head'],Y,CORE,1.4))
    o.append(glow(BK['sprout'],Y,CORE,1.5))
    for (x,y,rx,ry) in [(65.6,47.6,3,3.9),(81,47.2,2.8,3.8)]:
        o.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#1A1430"/><circle cx="{x+1.1}" cy="{y-1.5}" r="1.3" fill="#FFFFFF"/>')
    o.append('<ellipse cx="60.4" cy="53.6" rx="3.8" ry="2.4" fill="#FF6FA0" opacity="0.55"/><ellipse cx="86.4" cy="52.6" rx="3" ry="2" fill="#FF6FA0" opacity="0.55"/>')
    o.append(glow("M70.6,55.4 C72,58.4 76.6,58.4 78,55.4",'#FF4D8D','#FFD0E0',1.2))
    return '\n'.join(o)

def neon_mocha():
    O='#FF9A4D'; CORE='#FFE9D2'; C='#4DE3FF'
    o=[]
    o.append('<ellipse cx="51" cy="92.2" rx="28" ry="4.4" fill="#FF9A4D" opacity="0.16"/>')
    o.append(f'<path d="{MC["tail"]}" stroke="#9A5A30" stroke-width="7" stroke-linecap="round" fill="none"/>')
    o.append(f'<path d="{MC["tail"]}" stroke="#5E3420" stroke-width="7" stroke-dasharray="3.2 5.4" stroke-dashoffset="-6" fill="none"/>')
    o.append(f'<path d="{MC["body"]}" fill="#9A5A30"/>')
    o.append(f'<path d="{MC["bib"]}" fill="#E6D2BE"/>')
    o.append(f'<path d="{MC["earL"]}" fill="#9A5A30"/><path d="{MC["earR"]}" fill="#86492A"/>')
    o.append(f'<path d="{MC["head"]}" fill="#A8663A"/>')
    o.append(f'<path d="{MC["muzzle"]}" fill="#EAD8C4"/>')
    o.append(f'<path d="{MC["bandana"]}" fill="#1F3E80"/>')
    for d in [MC['body'],MC['head'],MC['earL'],MC['earR']]: o.append(glow(d,O,CORE,1.4))
    o.append(glow(MC['tail'],O,CORE,1.2))
    o.append(glow("M43.4,27.6 L46.4,21.4 L50.8,26.4 L55.2,21.2 L58.2,27.4",O,CORE,1.4))
    o.append(glow(MC['bandana'],C,'#D8FBFF',1.2))
    o.append(glow("M47,70.6 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0",'#FFE24D','#FFFBD8',1))
    for d,cx in [(MC['eyeL'],42),(MC['eyeR'],62.4)]:
        o.append(f'<path d="{d}" fill="#C8F04A"/><ellipse cx="{cx}" cy="37.6" rx="2.3" ry="4.2" fill="#14102A"/><circle cx="{cx+1.8}" cy="34.6" r="1.4" fill="#FFFFFF"/>')
        o.append(glow(d,'#C8F04A','#F4FFD0',0.9))
    o.append('<path d="M49.8,44.6 C50.6,43.4 54.2,43.4 55,44.6 C54.6,46.2 53.2,47.2 52.4,47.2 C51.6,47.2 50.2,46.2 49.8,44.6 Z" fill="#FF7FA0"/>')
    o.append(glow("M48.8,49.2 C50,51 51.8,50.8 52.4,49 C53,50.8 54.8,51 56,49.2",'#FF4D8D','#FFD0E0',0.9))
    for d in ["M42,48 C35,46.6 28,46.8 20.6,48.6","M62.6,47.6 C68.6,46.4 74.4,46.6 80,48"]:
        o.append(glow(d,'#FFFFFF','#FFFFFF',0.6))
    return '\n'.join(o)

def svg(inner,vb="0 0 100 100",w=400,h=400): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'
if __name__=='__main__':
    import sys
    O='/home/user/baokaka-adventure/docs/art/options/'
    open(O+'b-paper-cut-night/baokaka-crawl.svg','w').write(svg(paper_baokaka()))
    open(O+'b-paper-cut-night/mocha-cat.svg','w').write(svg(paper_mocha()))
    open(O+'c-neon-sign-taipei/baokaka-crawl.svg','w').write(svg(neon_baokaka()))
    open(O+'c-neon-sign-taipei/mocha-cat.svg','w').write(svg(neon_mocha()))
