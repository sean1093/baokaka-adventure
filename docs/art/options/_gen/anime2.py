"""Option D v2: anatomy-first construction. Skeleton (joints) -> tapered limb volumes -> clothing -> cel -> lines.
Limbs are generated from joint lists with per-joint radii, so elbows/knees/wrists/ankles exist in the geometry."""
import math, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from anime import head, mocha_head, SIL

def f(v): return ('%.2f'%v).rstrip('0').rstrip('.')
def P(p): return f'{f(p[0])},{f(p[1])}'
def crs(pts):
    """Catmull-Rom through pts -> cubic segments (no initial M)."""
    o=[]
    for i in range(len(pts)-1):
        p0=pts[i-1] if i>0 else pts[i]; p1=pts[i]; p2=pts[i+1]; p3=pts[i+2] if i+2<len(pts) else pts[i+1]
        c1=(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6); c2=(p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6)
        o.append(f'C{P(c1)} {P(c2)} {P(p2)}')
    return ' '.join(o)
def limb(pts,rs):
    """Closed outline of a tapered capsule along joints pts with radii rs (round caps)."""
    n=len(pts); L=[];R=[]
    for i in range(n):
        a=pts[max(i-1,0)]; b=pts[min(i+1,n-1)]
        tx,ty=b[0]-a[0],b[1]-a[1]; l=math.hypot(tx,ty) or 1; nx,ny=-ty/l,tx/l
        L.append((pts[i][0]+nx*rs[i],pts[i][1]+ny*rs[i])); R.append((pts[i][0]-nx*rs[i],pts[i][1]-ny*rs[i]))
    def tan(i,j):
        tx,ty=pts[j][0]-pts[i][0],pts[j][1]-pts[i][1]; l=math.hypot(tx,ty) or 1; return tx/l,ty/l
    te=tan(n-2,n-1); ts=tan(1,0); k=1.33
    Le,Re=L[-1],R[-1]; Ls,Rs=L[0],R[0]
    cap_e=f'C{f(Le[0]+te[0]*rs[-1]*k)},{f(Le[1]+te[1]*rs[-1]*k)} {f(Re[0]+te[0]*rs[-1]*k)},{f(Re[1]+te[1]*rs[-1]*k)} {P(Re)}'
    cap_s=f'C{f(Rs[0]+ts[0]*rs[0]*k)},{f(Rs[1]+ts[1]*rs[0]*k)} {f(Ls[0]+ts[0]*rs[0]*k)},{f(Ls[1]+ts[1]*rs[0]*k)} {P(Ls)}'
    R=R[::-1]
    return f'M{P(L[0])} {crs(L)} {cap_e} {crs(R)} {cap_s} Z'
def blob(pts):
    """Closed smooth shape through pts."""
    q=pts+pts[:3]
    o=[]
    for i in range(1,len(pts)+1):
        p0,p1,p2,p3=q[i-1],q[i],q[i+1],q[i+2]
        c1=(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6); c2=(p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6)
        o.append(f'C{P(c1)} {P(c2)} {P(p2)}')
    return f'M{P(pts[1])} '+' '.join(o)+' Z'

MAT={ # base, cel shade, deep, line tint
 'skin':('#FFE7D6','#F6C0AA','#E89E8C','#C9786A'),
 'pj':('#FFD86A','#EFA846','#D6863A','#B06A28'),
 'pj2':('#F4C458','#DE9640','#C47634','#A0602A'),   # far-side limbs, a touch darker
 'cream':('#FFF6E6','#EBD3B4','#D6B48E','#A8825E'),
 'fur':('#D7975E','#AE6C3E','#8A5232','#6E3A22'),
 'fur2':('#C4844E','#9C5E34','#7A4628','#5E3020'),
 'fcream':('#FFF5E8','#EAD2B8','#D6B898','#A8866A'),
 'bear':('#B98058','#93603E','#744628','#5A3420'),
 'red':('#FF6E5E','#D94A44','#B23436','#8A2A2C'),
}
class Fig:
    """Two-pass figure: every added part contributes a thick contour (pass 1) and a fill+thin line+cel (pass 2)."""
    def __init__(s,uid): s.sil=[]; s.top=[]; s.uid=uid; s.k=0
    def part(s,d,mat,cel=(2.6,2.2),lw=1.2,sil=True,deep=None,extra=''):
        b,sh,dp,ln=MAT[mat]; s.k+=1; cid=f'{s.uid}c{s.k}'
        if sil: s.sil.append(f'<path d="{d}" fill="{SIL}" stroke="{SIL}" stroke-width="3.2" stroke-linejoin="round"/>')
        o=f'<path d="{d}" fill="{b}"/>'
        if cel:
            dx,dy=cel
            o+=f'<clipPath id="{cid}"><path d="{d}"/></clipPath><g clip-path="url(#{cid})"><rect x="-50" y="-50" width="300" height="300" fill="{sh}"/><path d="{d}" fill="{b}" transform="translate({-dx} {-dy})"/>{deep or ""}{extra}</g>'
        o+=f'<path d="{d}" fill="none" stroke="{ln}" stroke-width="{lw}" stroke-linejoin="round"/>'
        s.top.append(o)
    def raw(s,x): s.top.append(x)
    def flush(s):
        """Commit pass so far (contours under fills) and start a new depth group."""
        out=''.join(s.sil)+''.join(s.top); s.sil=[]; s.top=[]; return out

def crease(p0,p1,w=1.2,col='#B06A28'):
    """Tapered fold mark (thick middle, pointed ends)."""
    mx,my=(p0[0]+p1[0])/2,(p0[1]+p1[1])/2; dx,dy=p1[0]-p0[0],p1[1]-p0[1]; l=math.hypot(dx,dy) or 1; nx,ny=-dy/l*w,dx/l*w
    return f'<path d="M{P(p0)} Q{f(mx+nx)},{f(my+ny)} {P(p1)} Q{f(mx-nx*0.2)},{f(my-ny*0.2)} {P(p0)} Z" fill="{col}"/>'

HAND={
 'open':[(0,-4.4),(4.2,-5.4),(6.4,-8.2),(8.6,-9.2),(9.8,-8),(8.6,-5.8),(11,-5.4),(13.8,-4.8),(14.2,-3.2),(11.8,-2.6),(14.6,-2.2),(15,-0.5),(12.2,0),
         (14.4,0.6),(14.4,2.3),(11.8,2.6),(12.9,3.2),(12.5,4.7),(10,5.1),(8,5.8),(4,5.6),(0,4.4)],
 'flat':[(0,-4.4),(4.2,-5.4),(6.6,-7),(9,-7.2),(9.6,-5.8),(8.6,-4.8),(11.6,-4.4),(13.6,-3.6),(13.6,-2.4),(11.6,-2.2),(14.2,-1.6),(14.4,-0.2),(12,0.1),
         (14,0.6),(14,2),(11.8,2.2),(12.8,2.8),(12.4,4.2),(10,4.6),(8,5.4),(4,5.6),(0,4.4)],
 'grab':[(0,-4.4),(4.2,-5.6),(6.8,-8.2),(9.4,-8.6),(10.4,-7),(9,-5.4),(10.8,-5),(12.6,-3.8),(12.4,-2.4),(10.9,-2),(13,-1.2),(12.8,0.4),(11,0.6),
         (12.8,1.4),(12.4,2.8),(10.8,3),(11.6,3.6),(11,4.8),(9.4,5),(7.6,5.8),(4,5.6),(0,4.4)],
}
VALLEYS={'open':[(11.8,-2.6),(12.2,0),(11.8,2.6)],'flat':[(11.6,-2.2),(12,0.1),(11.8,2.2)],'grab':[(10.9,-2),(11,0.6),(10.8,3)]}
def hand(F,wrist,ang,s=1.0,pose='open',mat='skin'):
    """Toddler hand as ONE clean contour: chubby palm, short fat fingers, thumb; finger splits as short creases."""
    a=math.radians(ang); ux,uy=math.cos(a),math.sin(a); vx,vy=-uy,ux
    def at(u,v): return (wrist[0]+ux*u*s+vx*v*s, wrist[1]+uy*u*s+vy*v*s)
    if pose=='fist':
        F.part(blob([at(0,-4.6),at(5,-6),at(10.4,-5),at(12,0),at(10.4,5),at(5,6),at(0,4.6)]),mat,cel=(1.2,1.0),lw=1)
        for v in (-2.6,0,2.6): F.raw(crease(at(9,v),at(11.6,v+0.4),0.5,'#C9786A'))
        F.raw(crease(at(4,-5),at(9,-4.4),0.6,'#C9786A'))
        return
    pts=[at(u,v) for u,v in HAND[pose]]
    F.part(blob(pts),mat,cel=(1.3,1.1),lw=1)
    for u,v in VALLEYS[pose]: F.raw(crease(at(u-2.6,v),at(u+0.2,v),0.45,'#C9786A'))
    F.raw(crease(at(5.6,-5.2),at(8.4,-6.4),0.45,'#C9786A'))

def footie(F,heel,toe,w=6.2,sole_view=False,mat='pj',up=1):
    """Footie foot in 3/4: rounded heel, instep rising to the ankle on the 'up' side, flat sole with a cream grip strip,
    a rounded toe cap with a big-toe bump. up=+1/-1 picks which side of heel->toe is the top of the foot."""
    dx,dy=toe[0]-heel[0],toe[1]-heel[1]; l=math.hypot(dx,dy); ux,uy=dx/l,dy/l; vx,vy=-uy*up,ux*up
    def at(u,v): return (heel[0]+ux*u*l+vx*v, heel[1]+uy*u*l+vy*v)
    if sole_view:
        d=blob([at(-0.04,0),at(0.12,-w*0.8),at(0.5,-w*0.9),at(0.9,-w*0.85),at(1.06,-w*0.2),at(1.0,w*0.55),at(0.6,w*0.9),at(0.12,w*0.8)])
        F.part(d,'cream',cel=(1.4,1.2))
        F.raw(''.join(f'<circle cx="{f(at(u,v)[0])}" cy="{f(at(u,v)[1])}" r="1.15" fill="#F09A3A"/>' for u,v in [(0.16,0),(0.42,-w*0.4),(0.42,w*0.4),(0.7,-w*0.45),(0.7,w*0.25),(0.9,-w*0.1)]))
        return
    d=blob([at(-0.06,-w*0.2),at(0.05,-w*1.2),at(0.3,-w*1.05),at(0.62,-w*0.8),at(0.92,-w*0.66),at(1.06,-w*0.1),at(1.0,w*0.55),at(0.6,w*0.72),at(0.15,w*0.7)])
    F.part(d,mat,cel=(1.6,1.4))
    F.raw(f'<path d="M{P(at(0.12,w*0.58))} C{P(at(0.4,w*0.66))} {P(at(0.75,w*0.64))} {P(at(0.98,w*0.42))}" stroke="#FFF2DC" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    F.raw(crease(at(0.78,-w*0.62),at(0.86,-w*0.1),0.5,'#B06A28'))

def stars(pts,col='#FFF6DA'):
    return ''.join(f'<path d="M{x},{y-s} Q{x+.5},{y-.5} {x+s},{y} Q{x+.5},{y+.5} {x},{y+s} Q{x-.5},{y+.5} {x-s},{y} Q{x-.5},{y-.5} {x},{y-s} Z" fill="{col}"/>' for x,y,s in pts)
def shadow(cx,cy,rx,ry,uid):
    return f'<defs><radialGradient id="{uid}sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E1430" stop-opacity=".45"/><stop offset="1" stop-color="#1E1430" stop-opacity="0"/></radialGradient></defs><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#{uid}sh)"/>'
def bear_patch(cx,cy,s=1):
    return (f'<g transform="translate({cx} {cy}) scale({s})"><circle cx="-4.4" cy="-4.6" r="2.6" fill="#9A6A48" stroke="#5A3420" stroke-width=".8"/><circle cx="4.4" cy="-4.6" r="2.6" fill="#9A6A48" stroke="#5A3420" stroke-width=".8"/>'
            f'<circle r="6.2" fill="#B98058" stroke="#5A3420" stroke-width=".9"/><path d="M2,-5.6 C6,-3 6.6,2 3.4,5.4 C4.6,1.6 4.4,-2.4 2,-5.6 Z" fill="#93603E"/><ellipse cy="2" rx="3.2" ry="2.4" fill="#F6E2C6"/>'
            f'<circle cx="-2.2" cy="-1.2" r=".9" fill="#2A1612"/><circle cx="2.2" cy="-1.2" r=".9" fill="#2A1612"/><ellipse cy="1.3" rx="1.1" ry=".8" fill="#2A1612"/></g>')
def skeleton(joints,bones,col='#FF2E7A'):
    o=''.join(f'<line x1="{f(joints[a][0])}" y1="{f(joints[a][1])}" x2="{f(joints[b][0])}" y2="{f(joints[b][1])}" stroke="{col}" stroke-width="1.4" opacity=".85"/>' for a,b in bones)
    return o+''.join(f'<circle cx="{f(p[0])}" cy="{f(p[1])}" r="2.2" fill="#fff" stroke="{col}" stroke-width="1.2"/>' for p in joints.values())
def svg(inner,vb="0 0 200 200",w=400,h=400): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'

# ============================ BAOKAKA: STANDING (wobbly first steps) ============================
HS=0.56  # head scale: head ~54 tall -> 3.3 heads total
def bk_stand(expr='happy',uid='bst',skel=False):
    J=dict(head=(100,48),neck=(100,76),shL=(83,88),shR=(117,87),elL=(71,102),elR=(131,98),wrL=(64,113),wrR=(141,106),
           pel=(100,128),hipL=(91,130),hipR=(110,130),knL=(86,152),knR=(115,151),anL=(84,172),anR=(118,171))
    F=Fig(uid); o=[shadow(101,186,44,6,uid)]
    F.part(limb([J['shR'],J['elR'],J['wrR']],[6.8,5.8,4.8]),'pj2',cel=(2,1.8))
    F.raw(crease((127,94),(130,100),0.9,'#A0602A'))
    hand(F,(J['wrR'][0]+1.4,J['wrR'][1]+0.4),-14,1.15,'open')
    F.part(limb([J['hipR'],J['knR'],(117,162),J['anR']],[12,8.8,8.2,5.8]),'pj2',cel=(2.6,2))
    F.raw(crease((111,150),(119,149),0.9,'#A0602A'))
    footie(F,(116,178),(132,184),6.8,mat='pj2',up=1)
    o.append(F.flush())
    F.part(limb([J['hipL'],J['knL'],(84,162),J['anL']],[12.4,9,8.4,6]),'pj',cel=(2.8,2))
    F.raw(crease((81,150),(90,151),1,'#B06A28')); F.raw(crease((88,160),(85,167),0.7,'#B06A28'))
    footie(F,(86,179),(70,186),7,up=-1)
    o.append(F.flush())
    F.part(limb([(100,68),(100,80)],[9.4,10]),'skin',cel=(1.4,1))
    o.append(F.flush())
    T=blob([(100,77),(110,78.6),(119,83),(124,92),(126,106),(127,118),(122,130),(111,138),(100,140),(89,138),(78,130),(73,118),(74,106),(76,92),(81,83),(90,78.6)])
    F.part(T,'pj',cel=(4,3.4),deep='<ellipse cx="100" cy="80" rx="18" ry="6.6" fill="#D6863A"/>')
    F.raw('<g opacity=".95">'+stars([(85,102,2.6),(89,126,2.2),(118,122,2.4),(114,100,2)])+'</g>')
    F.raw(bear_patch(101,111,0.95))
    F.raw(crease((83,131),(95,135),0.9)+crease((105,135),(117,131),0.9))
    F.raw(crease((79,92),(84,98),0.8)); F.raw(crease((121,91),(117,97),0.8))
    o.append(F.flush())
    F.part(limb([J['shL'],J['elL'],J['wrL']],[7,6,4.9]),'pj',cel=(2,1.8))
    F.raw(crease((74,97),(71,103),0.9))
    F.raw('<path d="M66,110 C64,113 63,116 64,118" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    hand(F,(J['wrL'][0]-1.6,J['wrL'][1]+1.2),116,1.15,'open')
    o.append(F.flush())
    F.part('M86,77 C92,83 108,83 114,77 C117,79 116,84 112,85.6 C104,88.6 96,88.6 88,85.6 C84,84 83,79 86,77 Z','cream',cel=(1,1))
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale({HS})">{head(expr,uid+"h")}</g>')
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shL'),('neck','shR'),('shL','elL'),('elL','wrL'),('shR','elR'),('elR','wrR'),('neck','pel'),('pel','hipL'),('pel','hipR'),('hipL','knL'),('knL','anL'),('hipR','knR'),('knR','anR')]))
    return ''.join(o)


def block(x,y,s=1.0):
    """Toy block (積木) held in hand: 3 faces, star on the front."""
    def T(px,py): return f'{f(x+px*s)},{f(y+py*s)}'
    return (f'<path d="M{T(-11,-6)} L{T(-5,-11)} L{T(11,-11)} L{T(5,-6)} Z" fill="#FFB2A2" stroke="{SIL}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M{T(5,-6)} L{T(11,-11)} L{T(11,5)} L{T(5,10)} Z" fill="#B23436" stroke="{SIL}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M{T(-11,-6)} L{T(5,-6)} L{T(5,10)} L{T(-11,10)} Z" fill="#F0564A" stroke="{SIL}" stroke-width="1.8" stroke-linejoin="round"/>'
            f'<path d="M{T(-3,-3)} l{f(1.7*s)},{f(3.6*s)} {f(3.9*s)},{f(.5*s)} -{f(2.8*s)},{f(2.6*s)} {f(.8*s)},{f(3.8*s)} -{f(3.6*s)},-{f(2*s)} -{f(3.6*s)},{f(2*s)} {f(.8*s)},-{f(3.8*s)} -{f(2.8*s)},-{f(2.6*s)} {f(3.9*s)},-{f(.5*s)} Z" fill="#FFF6E6"/>'
            f'<path d="M{T(-9,-4)} L{T(-9,8)}" stroke="#FFC4B8" stroke-width="{f(1.4*s)}" stroke-linecap="round"/>')

def bk_sit(expr='happy',uid='bsi',skel=False):
    J=dict(head=(102,58),neck=(102,86),shL=(86,96),shR=(119,94),elL=(77,117),elR=(135,82),wrL=(82,134),wrR=(141,64),
           pel=(103,140),hipL=(92,144),hipR=(115,143),knL=(70,158),knR=(139,132),anL=(50,165),anR=(146,160))
    F=Fig(uid); o=[shadow(100,178,70,8,uid)]
    T=blob([(102,80),(112,82),(120,88),(125,100),(129,116),(130,132),(126,146),(114,154),(100,156),(86,154),(76,146),(73,130),(74,114),(77,100),(83,88),(92,82)])
    F.part(limb([(102,72),(102,86)],[9.4,10]),'skin',cel=(1.4,1))
    F.part(T,'pj',cel=(4,3.4),deep='<ellipse cx="102" cy="84" rx="18" ry="6.4" fill="#D6863A"/>')
    F.raw('<g opacity=".95">'+stars([(84,108,2.6),(88,136,2.2),(120,130,2.4),(117,108,2)])+'</g>'+bear_patch(103,120,0.95))
    F.raw(crease((80,100),(85,106),0.8)); F.raw(crease((90,148),(112,150),0.9))
    o.append(F.flush())
    # far leg: knee up, foot flat on the floor
    F.part(limb([J['hipR'],J['knR'],(144,148),J['anR']],[12,8.8,8,5.8]),'pj2',cel=(2.4,2))
    F.raw(crease((134,134),(141,128),0.9,'#A0602A'))
    footie(F,(142,167),(160,172),6.6,mat='pj2',up=1)
    o.append(F.flush())
    # near leg: extended forward in a loose V, sole toward the viewer
    F.part(limb([J['hipL'],J['knL'],(60,162),J['anL']],[12.6,9,8.4,6]),'pj',cel=(2.8,2.2))
    F.raw(crease((72,153),(69,162),0.9))
    footie(F,(48,170),(40,153),7,sole_view=True)
    o.append(F.flush())
    # near arm resting on the thigh, open hand palm-down
    F.part(limb([J['shL'],J['elL'],J['wrL']],[7,6,4.9]),'pj',cel=(2,1.8))
    F.raw(crease((78,112),(80,119),0.9))
    F.raw('<path d="M77,132 C79,136 83,137 87,135" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    hand(F,(J['wrL'][0]+0.6,J['wrL'][1]+2),62,1.15,'flat')
    o.append(F.flush())
    F.part('M88,81 C94,87 110,87 116,81 C119,83 118,88 114,89.6 C106,92.6 98,92.6 90,89.6 C86,88 85,83 88,81 Z','cream',cel=(1,1))
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale({HS})">{head(expr,uid+"h")}</g>')
    # raised arm holding a block (in front of the head edge)
    F.part(limb([J['shR'],J['elR'],J['wrR']],[7,6,4.9]),'pj',cel=(2,1.8))
    F.raw(crease((131,86),(136,84),0.9))
    o.append(F.flush())
    o.append(block(142,40,1.0))
    hand(F,(J['wrR'][0]-0.4,J['wrR'][1]+1),-84,1.15,'grab')
    F.raw('<path d="M136,66 C139,69 144,69 147,66" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    o.append(F.flush())
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shL'),('neck','shR'),('shL','elL'),('elL','wrL'),('shR','elR'),('elR','wrR'),('neck','pel'),('pel','hipL'),('pel','hipR'),('hipL','knL'),('knL','anL'),('hipR','knR'),('knR','anR')]))
    return ''.join(o)

def bk_crawl(expr='happy',uid='bcr',skel=False):
    J=dict(head=(147,80),neck=(136,100),shN=(128,112),shF=(121,108),elN=(137,137),elF=(117,138),wrN=(146,162),wrF=(114,162),
           pel=(68,112),hipN=(72,120),hipF=(64,115),knN=(78,168),knF=(60,166),anN=(50,172),anF=(36,168))
    F=Fig(uid); o=[shadow(98,180,78,8,uid)]
    # far limbs first
    F.part(limb([J['shF'],J['elF'],J['wrF']],[6.6,5.6,4.6]),'pj2',cel=(2,1.8))
    hand(F,(J['wrF'][0]-1,J['wrF'][1]+2),8,1.05,'flat',mat='skin')
    F.part(limb([J['hipF'],J['knF'],J['anF']],[11.6,8.4,6]),'pj2',cel=(2.4,2))
    footie(F,(38,170),(22,163),6.4,sole_view=True)
    o.append(F.flush())
    # torso: flat back, belly hanging a little, diaper-padded bottom
    T=blob([(52,104),(62,96),(80,94),(100,95),(118,96),(130,100),(138,110),(136,124),(124,130),(104,134),(84,134),(66,132),(54,126),(48,116)])
    F.part(T,'pj',cel=(3.6,3.6),deep='<ellipse cx="132" cy="104" rx="10" ry="12" fill="#D6863A"/>')
    F.raw('<g opacity=".95">'+stars([(70,108,2.6),(92,104,2.2),(84,124,2.4),(108,112,2)])+'</g>'+bear_patch(118,120,0.85))
    F.raw(crease((60,124),(70,130),0.9)); F.raw(crease((96,131),(110,130),0.8))
    o.append(F.flush())
    # near leg: thigh vertical, shin on the floor, sole up
    F.part(limb([J['hipN'],J['knN'],J['anN']],[12.6,8.8,6.2]),'pj',cel=(2.8,2.2))
    F.raw(crease((74,150),(80,156),0.9))
    footie(F,(52,174),(34,168),6.8,sole_view=True)
    o.append(F.flush())
    F.part(limb([J['neck'],(141,94)],[9.4,9.6]),'skin',cel=(1.4,1.2))
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale(0.52)">{head(expr,uid+"h")}</g>')
    # near arm straight under the shoulder, palm flat on the floor
    F.part(limb([J['shN'],J['elN'],J['wrN']],[7,6,5]),'pj',cel=(2,1.8))
    F.raw(crease((130,136),(136,137),0.8))
    F.raw('<path d="M141,159 C144,162 149,162 152,159" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    hand(F,(J['wrN'][0]+0.4,J['wrN'][1]+3),6,1.15,'flat')
    o.append(F.flush())
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shN'),('neck','shF'),('shN','elN'),('elN','wrN'),('shF','elF'),('elF','wrF'),('neck','pel'),('pel','hipN'),('pel','hipF'),('hipN','knN'),('knN','anN'),('hipF','knF'),('knF','anF')]))
    return ''.join(o)

# ============================ MOCHA ============================
def stripes_clip(marks,col='#7A4628'):
    return ''.join(f'<path d="{d}" fill="{col}"/>' for d in marks)
def tapered(p0,p1,w):
    return crease(p0,p1,w,'#7A4628')
def paw(F,c,w=13,h=8.6,mat='fcream',splits=True):
    x,y=c
    d=blob([(x-w/2,y),(x-w/2+1,y-h*0.7),(x,y-h),(x+w/2-1,y-h*0.7),(x+w/2,y),(x,y+h*0.25)])
    F.part(d,mat,cel=(1.4,1.2))
    if splits: F.raw(''.join(crease((x+dx,y-h*0.25),(x+dx*1.05,y+h*0.12),0.45,'#B8987A') for dx in (-w*0.2,0,w*0.2)))

def mc_sit(expr='content',uid='msi',skel=False):
    J=dict(head=(100,60),neck=(100,92),shN=(90,106),shF=(111,104),elN=(88,132),elF=(112,130),wrN=(89,166),wrF=(113,166),
           spine=(76,104),hip=(64,146),knee=(80,160),heel=(56,176))
    F=Fig(uid); o=[shadow(98,184,62,8,uid)]
    TAIL=[(46,168),(36,180),(60,190),(98,190),(128,186),(138,178)]
    F.part(limb(TAIL,[7,7.4,7.2,6.8,6.4,5.6]),'fur',cel=(1.6,1.6),extra=''.join(f'<path d="M{a},{b-12} l3,24 l5,0 l-3,-24 Z" fill="#7A4628"/>' for a,b in [(52,186),(70,190),(88,191),(106,190),(122,186)]))
    o.append(F.flush())
    # far front leg
    F.part(limb([J['shF'],J['elF'],J['wrF']],[7.6,6.2,5.2]),'fur2',cel=(2,1.6),extra=''.join(tapered((106,y),(118,y-1),1.4) for y in (140,152)))
    paw(F,(114,177),12.6,8.4,'fcream')
    o.append(F.flush())
    # body: shoulder blades -> back -> big haunch; chest forward
    T=blob([(100,90),(110,94),(116,104),(116,122),(112,140),(106,156),(96,170),(80,178),(58,178),(42,170),(36,154),(40,136),(50,120),(62,108),(74,100),(86,94)])
    F.part(T,'fur',cel=(4,3),deep='<ellipse cx="96" cy="94" rx="16" ry="6" fill="#8A5232"/>',
           extra=stripes_clip(['M58,112 C54,122 52,132 53,142 C56,132 59,122 63,114 Z','M70,104 C66,112 64,120 64,128 C67,120 70,112 74,106 Z','M44,146 C42,154 42,162 45,168 C46,160 47,154 49,148 Z']))
    # haunch (thigh mass) as its own volume so it reads
    F.part(blob([(40,150),(48,136),(64,130),(80,136),(88,152),(84,170),(66,178),(48,174)]),'fur',cel=(3,2.6),
           extra=stripes_clip(['M54,138 C60,140 64,146 66,152 C62,148 58,143 52,141 Z','M44,152 C50,152 55,156 58,162 C54,159 49,156 43,156 Z']))
    o.append(F.flush())
    # tucked hind paw in front of the haunch
    F.part(limb([(50,176),(66,180)],[4.6,5]),'fur',cel=(1.2,1))
    paw(F,(72,183),12.4,7.6,'fcream')
    # chest fluff (cream bib) with tufted edge
    F.part('M90,96 L94,101 L98,96 L102,102 L106,96 L110,101 L112,98 C116,112 112,128 104,142 C100,148 96,150 92,146 C86,134 84,116 90,96 Z','fcream',cel=(2,1.6))
    o.append(F.flush())
    # near front leg: straight, wrist, round paw with toe splits
    F.part(limb([J['shN'],J['elN'],J['wrN']],[8,6.4,5.4]),'fur',cel=(2,1.6),extra=''.join(tapered((82,y),(95,y-1),1.4) for y in (140,152)))
    paw(F,(89,177),13.6,9,'fcream')
    o.append(F.flush())
    # bandana + tag at the neck
    BD='M74,88 C84,98 116,98 126,88 L122,98 C114,103 106,105 100,117 C94,105 86,103 78,98 Z'
    F.sil.append(f'<path d="{BD}" fill="{SIL}" stroke="{SIL}" stroke-width="3.2" stroke-linejoin="round"/>')
    F.raw(f'<path d="{BD}" fill="#4A8BDA" stroke="#1E3E78" stroke-width="1.1"/><path d="M100,117 C106,106 114,103 122,98 L124,93 C114,101 106,104 100,117 Z" fill="#2F62B0"/>'
          + ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#FFF5E2"/>' for x,y in [(84,97),(94,102),(106,102),(116,97),(100,110)])
          + '<path d="M84,100 C90,105 95,110 100,117 M116,100 C110,105 105,110 100,117" stroke="#1E3E78" stroke-width=".9" fill="none"/>'
          + f'<circle cx="100" cy="120" r="4.6" fill="#FFD66A" stroke="{SIL}" stroke-width="1.6"/><path d="M98,118.4 C99,117.2 100.6,117 101.8,117.4" stroke="#fff" stroke-width="1" stroke-linecap="round"/>')
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale(0.8)">{mocha_head(expr,uid+"h")}</g>')
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shN'),('neck','shF'),('shN','elN'),('elN','wrN'),('shF','elF'),('elF','wrF'),('neck','spine'),('spine','hip'),('hip','knee'),('knee','heel')]))
    return ''.join(o)

def mc_walk(expr='content',uid='mwk',skel=False):
    J=dict(head=(154,76),neck=(138,96),shN=(126,108),shF=(120,104),elN=(131,130),elF=(116,132),wrN=(140,146),wrF=(117,164),
           spine=(96,96),hipN=(68,104),hipF=(60,100),knN=(82,126),knF=(70,126),hkN=(66,146),hkF=(50,144),pwN=(70,170),pwF=(44,166))
    F=Fig(uid); o=[shadow(98,180,70,7,uid)]
    TAIL=[(56,98),(42,92),(32,80),(28,64),(32,50),(42,44),(48,48)]
    F.part(limb(TAIL,[7.6,7,6.6,6.2,6,5.8,5.4]),'fur',cel=(1.6,1.6),extra=''.join(tapered((x-6,y+3),(x+6,y-2),1.6) for x,y in [(36,80),(29,64),(27,50)]))
    # far legs
    F.part(limb([J['hipF'],J['knF'],J['hkF'],J['pwF']],[9,6,4.6,4.2]),'fur2',cel=(2,1.6))
    paw(F,(44,170),11,7,'fcream')
    F.part(limb([J['shF'],J['elF'],J['wrF']],[7,5.6,4.6]),'fur2',cel=(2,1.6))
    paw(F,(118,170),11,7.2,'fcream')
    o.append(F.flush())
    T=blob([(56,104),(62,92),(76,88),(96,90),(116,88),(132,92),(142,102),(140,116),(130,124),(110,126),(90,126),(72,124),(60,118)])
    F.part(T,'fur',cel=(3.4,3.4),deep='<ellipse cx="134" cy="100" rx="10" ry="10" fill="#8A5232"/>',
           extra=stripes_clip(['M80,88 C78,98 78,108 80,118 C82,108 83,98 85,90 Z','M94,89 C92,99 92,109 94,119 C96,109 97,99 99,90 Z','M108,88 C106,98 106,108 108,116 C110,108 111,98 113,90 Z','M66,94 C64,102 64,110 66,116 C68,110 69,102 71,96 Z']))
    F.part('M128,104 L132,108 L136,104 L140,110 C142,118 138,124 132,126 C126,126 122,120 124,112 Z','fcream',cel=(1.6,1.4))
    o.append(F.flush())
    # near hind (planted) and near front (stepping, paw lifted)
    F.part(limb([J['knN'],J['hkN'],J['pwN']],[6.2,4.8,4.4]),'fur',cel=(1.8,1.6))
    F.part(limb([(62,100),J['hipN'],J['knN']],[13,12.4,6.4]),'fur',cel=(2.6,2.2),extra=stripes_clip(['M62,106 C68,108 72,112 74,118 C70,114 66,111 60,110 Z','M64,94 C70,96 74,100 76,106 C72,102 68,99 62,98 Z']))
    paw(F,(72,174),12,7.6,'fcream')
    F.part(limb([J['shN'],J['elN'],J['wrN']],[7.6,6,5]),'fur',cel=(2,1.6),extra=tapered((124,128),(136,126),1.4))
    paw(F,(146,150),11.6,7.4,'fcream')
    o.append(F.flush())
    BD='M126,84 C134,96 150,98 158,90 L156,98 C150,102 144,104 140,114 C136,104 132,100 128,96 Z'
    F.sil.append(f'<path d="{BD}" fill="{SIL}" stroke="{SIL}" stroke-width="3.2"/>')
    F.raw(f'<path d="{BD}" fill="#4A8BDA" stroke="#1E3E78" stroke-width="1.1"/><circle cx="134" cy="94" r="1.4" fill="#FFF5E2"/><circle cx="146" cy="97" r="1.4" fill="#FFF5E2"/><circle cx="141" cy="117" r="3.8" fill="#FFD66A" stroke="{SIL}" stroke-width="1.4"/>')
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale(0.66)">{mocha_head(expr,uid+"h")}</g>')
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shN'),('neck','shF'),('shN','elN'),('elN','wrN'),('shF','elF'),('elF','wrF'),('neck','spine'),('spine','hipN'),('spine','hipF'),('hipN','knN'),('knN','hkN'),('hkN','pwN'),('hipF','knF'),('knF','hkF'),('hkF','pwF')]))
    return ''.join(o)

if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
    open(D+'baokaka-stand.svg','w').write(svg(bk_stand()))
    open(D+'baokaka.svg','w').write(svg(bk_sit()))
    open(D+'baokaka-laugh.svg','w').write(svg(bk_sit('laugh','bsl')))
    open(D+'baokaka-teary.svg','w').write(svg(bk_sit('teary','bst2')))
    open(D+'baokaka-crawl.svg','w').write(svg(bk_crawl()))
    open(D+'mocha-cat.svg','w').write(svg(mc_sit()))
    open(D+'mocha-smug.svg','w').write(svg(mc_sit('smug','mss')))
    open(D+'mocha-happy.svg','w').write(svg(mc_sit('happy','msh')))
    open(D+'mocha-walk.svg','w').write(svg(mc_walk()))
    SK='/tmp/claude-0/-home-user-baokaka-adventure/9cc42ba2-43c5-5cc1-b2da-d64373ca9aef/scratchpad/'
    for n,fn in [('sit',bk_sit),('crawl',bk_crawl),('msit',mc_sit),('mwalk',mc_walk)]:
        open(SK+n+'-skel.svg','w').write(svg(fn(skel=True,uid='k'+n)))
    open('/tmp/claude-0/-home-user-baokaka-adventure/9cc42ba2-43c5-5cc1-b2da-d64373ca9aef/scratchpad/stand-skel.svg','w').write(svg(bk_stand(skel=True,uid='sk')))
