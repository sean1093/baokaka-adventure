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
    R=R[::-1]
    return f'M{P(L[0])} {crs(L)} A{f(rs[-1])},{f(rs[-1])} 0 0 1 {P(R[0])} {crs(R)} A{f(rs[0])},{f(rs[0])} 0 0 1 {P(L[0])} Z'
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

def hand(F,wrist,ang,s=1.0,pose='open',mat='skin'):
    """Toddler hand: chubby palm + 4 short fingers + thumb. ang = direction wrist->fingers (deg)."""
    a=math.radians(ang); ux,uy=math.cos(a),math.sin(a); vx,vy=-uy,ux
    def at(u,v): return (wrist[0]+ux*u*s+vx*v*s, wrist[1]+uy*u*s+vy*v*s)
    if pose=='fist':
        F.part(blob([at(0,-4.4),at(5,-5.6),at(10,-4.6),at(11.4,0),at(10,4.6),at(5,5.6),at(0,4.4)]),mat,cel=(1.2,1.0),lw=1)
        for v in (-3,-0.6,1.8): F.raw(crease(at(8.4,v),at(10.6,v+0.6),0.5,'#C9786A'))
        F.part(limb([at(3,-4),at(7,-6.2)],[1.9*s,1.7*s]),mat,cel=None,lw=1)
        return
    # palm
    F.part(blob([at(0,-4),at(4.6,-5.4),at(8.6,-4.8),at(9.6,0),at(8.6,4.8),at(4.6,5.4),at(0,4)]),mat,cel=(1.2,1.0),lw=1)
    if pose=='open':
        spread=[(-15,6.2),(-5,7.0),(5,6.6),(14,5.4)]
    elif pose=='flat':
        spread=[(-10,5.2),(-3,5.8),(4,5.6),(11,4.8)]
    else: # grab: fingers curl forward
        spread=[(-12,4.2),(-4,4.6),(4,4.4),(12,3.8)]
    for i,(da,ln) in enumerate(spread):
        b=math.radians(ang+da); base=at(8.4,-3.6+i*2.4)
        tip=(base[0]+math.cos(b)*ln*s, base[1]+math.sin(b)*ln*s)
        if pose=='grab':
            mid=tip; tip=(mid[0]+vx*2.2*s,mid[1]+vy*2.2*s)
            F.part(limb([base,mid,tip],[1.55*s,1.45*s,1.3*s]),mat,cel=None,lw=0.9)
        else:
            F.part(limb([base,tip],[1.55*s,1.3*s]),mat,cel=None,lw=0.9)
    # thumb from the side of the palm
    tb=at(3,-4.6); tt=at(8,-8.6 if pose!='grab' else -6.4)
    F.part(limb([tb,tt],[1.9*s,1.5*s]),mat,cel=None,lw=0.9)

def footie(F,heel,toe,w=6.2,sole_view=False,mat='pj'):
    """Footie-pajama foot: heel -> ball -> toe cap, wider at the toes; optional sole facing the viewer."""
    dx,dy=toe[0]-heel[0],toe[1]-heel[1]; l=math.hypot(dx,dy); ux,uy=dx/l,dy/l; vx,vy=-uy,ux
    def at(u,v): return (heel[0]+ux*u*l+vx*v, heel[1]+uy*u*l+vy*v)
    d=blob([at(-0.08,0),at(0.1,-w*0.85),at(0.55,-w*0.95),at(0.95,-w*0.7),at(1.06,0),at(0.95,w*0.75),at(0.55,w),at(0.1,w*0.85)])
    if sole_view:
        F.part(d,'cream',cel=(1.4,1.2))
        F.raw(''.join(f'<circle cx="{f(at(u,v)[0])}" cy="{f(at(u,v)[1])}" r="1.2" fill="#F09A3A"/>' for u,v in [(0.15,0),(0.45,-w*0.4),(0.45,w*0.4),(0.78,-w*0.3),(0.78,w*0.3)]))
    else:
        F.part(d,mat,cel=(1.6,1.4))
        F.raw(crease(at(0.62,-w*0.5),at(0.62,w*0.5),0.5,'#B06A28'))

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
    J=dict(head=(100,44),neck=(100,76),shL=(84,84),shR=(117,83),elL=(70,99),elR=(132,95),wrL=(62,111),wrR=(143,103),
           chest=(100,92),pel=(100,128),hipL=(91,131),hipR=(110,131),knL=(85,156),knR=(117,155),anL=(82,178),anR=(121,177))
    F=Fig(uid); o=[shadow(101,190,44,6,uid)]
    # far (right) arm behind torso
    F.part(limb([J['shR'],J['elR'],J['wrR']],[6.6,5.4,4.4]),'pj2',cel=(2,1.8))
    F.raw(crease((128,92),(131,99),0.9,'#A0602A'))
    hand(F,(J['wrR'][0]+1.6,J['wrR'][1]+0.6),-18,1.1,'open')
    # far leg
    F.part(limb([J['hipR'],J['knR'],J['anR']],[9.6,6.8,5.2]),'pj2',cel=(2.4,2))
    F.raw(crease((114,153),(121,152),0.9,'#A0602A'))
    footie(F,(121,181),(132,191),6.4,mat='pj2')
    o.append(F.flush())
    # near leg
    F.part(limb([J['hipL'],J['knL'],J['anL']],[10,7,5.4]),'pj',cel=(2.6,2))
    F.raw(crease((80,153),(89,154),1,'#B06A28')); F.raw(crease((84,166),(80,172),0.7,'#B06A28'))
    footie(F,(82,181),(70,192),6.6)
    o.append(F.flush())
    # torso: sloping shoulders, pot belly, diaper-padded hips (pajama over it)
    T=blob([(100,76),(112,78),(121,86),(124,100),(126,114),(122,128),(112,137),(100,139),(88,137),(78,128),(75,114),(77,100),(80,86),(89,78)])
    F.part(T,'pj',cel=(4,3.4),deep='<ellipse cx="100" cy="80" rx="16" ry="6" fill="#D6863A"/>')
    F.raw('<g opacity=".95">'+stars([(86,100,2.6),(90,124,2.2),(117,120,2.4),(112,104,2)])+'</g>')
    F.raw(bear_patch(101,110,0.95))
    F.raw(crease((84,130),(96,134),0.9)+crease((104,134),(116,130),0.9))
    o.append(F.flush())
    # near arm (out for balance) + open hand
    F.part(limb([J['shL'],J['elL'],J['wrL']],[6.8,5.6,4.6]),'pj',cel=(2,1.8))
    F.raw(crease((73,94),(70,101),0.9))
    F.raw('<path d="M64,108 C62,111 61,114 62,116" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    hand(F,(J['wrL'][0]-1.4,J['wrL'][1]+1),118,1.1,'open')
    o.append(F.flush())
    # collar + neck + head
    F.part('M86,78 C92,84 108,84 114,78 C117,80 116,85 112,86 C104,89 96,89 88,86 C84,85 83,80 86,78 Z','cream',cel=(1,1))
    o.append(F.flush())
    o.append(f'<g transform="translate({J["head"][0]} {J["head"][1]}) scale({HS})">{head(expr,uid+"h")}</g>')
    if skel: o.append(skeleton(J,[('head','neck'),('neck','shL'),('neck','shR'),('shL','elL'),('elL','wrL'),('shR','elR'),('elR','wrR'),('neck','pel'),('pel','hipL'),('pel','hipR'),('hipL','knL'),('knL','anL'),('hipR','knR'),('knR','anR')]))
    return ''.join(o)

if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
    open(D+'baokaka-stand.svg','w').write(svg(bk_stand()))
    open('/tmp/claude-0/-home-user-baokaka-adventure/9cc42ba2-43c5-5cc1-b2da-d64373ca9aef/scratchpad/stand-skel.svg','w').write(svg(bk_stand(skel=True,uid='sk')))
