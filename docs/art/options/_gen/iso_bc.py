import random, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from chars import glow
HW,HH=36,18; OX,OY=195,318; N=5; D=34
GRID=["GGGWW","GGGWW","BBBBB","RRXRR","BBBBP"]
def scr(c,r): return OX+(c-r)*HW, OY+(c+r)*HH
def f(v): return ('%.1f'%v).rstrip('0').rstrip('.')
def pts(L): return ' '.join(f(x)+','+f(y) for x,y in L)
def dia(x,y,hw=HW,hh=HH): return [(x,y-hh),(x+hw,y),(x,y+hh),(x-hw,y)]
def dpath(L): return 'M'+' L'.join(f(x)+','+f(y) for x,y in L)+' Z'
top=scr(0,0); l0=scr(0,N-1); l0=(l0[0]-HW,l0[1]); b=scr(N-1,N-1); b=(b[0],b[1]+HH); r0=scr(N-1,0); r0=(r0[0]+HW,r0[1])
x0,y0=scr(0,0)
STACK=[(0,30,16,30)]+[(16,19,70,17)]+[(70+19*i,15,89+19*i,20.5) for i in range(8)]+[(222,12,231,13),(231,8,239,9)]
def faces(h0,w0,h1,w1):
    a=(x0-w1,y0-h1); bb=(x0,y0-h1+w1/2); cc=(x0,y0-h0+w0/2); d=(x0-w0,y0-h0); e=(x0+w1,y0-h1); g=(x0+w0,y0-h0)
    return [a,bb,cc,d],[bb,e,g,cc],[(x0-w1,y0-h1),(x0,y0-h1-w1/2),(x0+w1,y0-h1),(x0,y0-h1+w1/2)]
def q(x,y,u,v): return (x+(u-v)*HW, y+(u+v)*HH)

# ======================= B: PAPER =======================
def paper_iso():
    random.seed(5); o=[]; A=o.append
    SH='#120E2E'
    def sh(d,dx=2,dy=3,op=0.35): A(f'<path d="{d}" fill="{SH}" opacity="{op}" transform="translate({dx} {dy})"/>')
    A('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 600" width="390" height="600">')
    A('<defs><filter id="pp-fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.2  0 0 0 0.7 0"/></filter></defs>')
    A('<rect width="390" height="600" fill="#20225E"/>')
    # moon + stars (cut paper)
    A('<circle cx="82" cy="100" r="30" fill="#2A2D70"/><circle cx="82" cy="100" r="22" fill="#33377E"/>')
    sh('M82,82 a18,18 0 1,0 0.01,0 Z',2,3); A('<circle cx="82" cy="100" r="18" fill="#FFF1C9"/><circle cx="76" cy="95" r="3" fill="#F3DDA6"/><circle cx="88" cy="106" r="2" fill="#F3DDA6"/>')
    for _ in range(22):
        x,y,s=random.uniform(10,380),random.uniform(10,220),random.choice([1.6,2.2,3])
        A(f'<path d="M{f(x)},{f(y-s)} L{f(x+s*.3)},{f(y-s*.3)} L{f(x+s)},{f(y)} L{f(x+s*.3)},{f(y+s*.3)} L{f(x)},{f(y+s)} L{f(x-s*.3)},{f(y+s*.3)} L{f(x-s)},{f(y)} L{f(x-s*.3)},{f(y-s*.3)} Z" fill="#FFE9B0" opacity="{random.choice([0.6,0.9])}"/>')
    # paper cloud
    cl='M268,78 C268,68 282,64 290,70 C296,60 316,60 320,72 C332,70 340,80 334,88 L272,88 C264,88 262,80 268,78 Z'
    sh(cl,2,3); A(f'<path d="{cl}" fill="#3B3F8C"/>')
    # layered mountains + skyline, each a sheet with its own drop shadow
    m1='M0,236 C40,206 74,198 112,216 C150,186 196,180 236,204 C274,192 306,196 338,210 C360,204 378,208 390,214 L390,320 L0,320 Z'
    sh(m1,0,-3,0.3); A(f'<path d="{m1}" fill="#2C2F74"/>')
    sk=[]; x=-4
    while x<394:
        w=random.choice([10,14,18,22,26]); h=random.randint(22,66)
        if random.random()<0.35: sk.append(f'M{x+3},{300-h-7} h{w-6} v7 h-{w-6} Z')
        sk.append(f'M{x},{300-h} h{w} v{h} h-{w} Z'); x+=w+random.choice([0,2,3])
    d=' '.join(sk); sh(d,2,-3,0.4); A(f'<path d="{d}" fill="#373B86"/>')
    A('<g fill="#FFD670">'+''.join(f'<rect x="{random.uniform(0,386):.0f}" y="{random.uniform(240,294):.0f}" width="2.4" height="2.4"/>' for _ in range(34))+'</g>')
    A('<rect y="296" width="390" height="304" fill="#1B1C50"/>')
    # island skirt: stacked board layers
    for i,col in enumerate(['#C8925A','#9C6A4A','#7A5038']):
        y1=i*11; y2=y1+11
        A(f'<polygon points="{pts([(l0[0],l0[1]+y1),(b[0],b[1]+y1),(b[0],b[1]+y2),(l0[0],l0[1]+y2)])}" fill="{col}"/>')
        A(f'<polygon points="{pts([(b[0],b[1]+y1),(r0[0],r0[1]+y1),(r0[0],r0[1]+y2),(b[0],b[1]+y2)])}" fill="{col}" opacity="0.82"/>')
        A(f'<polygon points="{pts([(b[0],b[1]+y1),(r0[0],r0[1]+y1),(r0[0],r0[1]+y2),(b[0],b[1]+y2)])}" fill="#120E2E" opacity="0.18"/>')
    A(f'<ellipse cx="{f(b[0])}" cy="{f(b[1]+D+10)}" rx="170" ry="12" fill="#0E0B26" opacity="0.5"/>')
    # board under tiles (shows through the seams)
    A(f'<polygon points="{pts([(top[0],top[1]-HH),r0,b,l0])}" fill="#2A2050"/>')
    T={'G':('#4F9A6E','#5AA478'),'B':('#C25E50','#B95749'),'R':('#4A4E86','#464A80'),'X':('#4A4E86','#4A4E86'),'W':('#3D86C2','#3A80BA'),'P':('#4F9A6E','#4F9A6E')}
    for r in range(N):
        for c in range(N):
            t=GRID[r][c]
            if t=='P': continue
            x,y=scr(c,r); col=T[t][(c*7+r*3)%2]
            A(f'<polygon points="{pts(dia(x,y,HW-1.2,HH-0.6))}" fill="{col}"/>')
            if t=='G':
                for _ in range(3):
                    gx,gy=x+random.uniform(-16,16),y+random.uniform(-5,5)
                    A(f'<path d="M{f(gx-3)},{f(gy)} l1.5,-4 l1.5,3 l1.5,-4 l1.5,5 Z" fill="#3E8058"/>')
            if t=='B':
                for v in (-0.25,0,0.25):
                    a=q(x,y,-0.47,v); e=q(x,y,0.47,v); A(f'<path d="M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}" stroke="#2A2050" stroke-width="0.9" opacity="0.55"/>')
            if t=='X':
                for v in (-0.36,-0.12,0.12,0.36):
                    A(f'<polygon points="{pts([q(x,y,-0.32,v-0.065),q(x,y,0.32,v-0.065),q(x,y,0.32,v+0.065),q(x,y,-0.32,v+0.065)])}" fill="#FFF1C9"/>')
            if t=='R' and c!=2:
                a=q(x,y,-0.2,0); e=q(x,y,0.2,0); A(f'<path d="M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}" stroke="#FFF1C9" stroke-width="2" stroke-linecap="round"/>')
            if t=='W':
                A(f'<path d="M{f(x-14)},{f(y-2)} q6,-3 12,0 M{f(x+2)},{f(y+6)} q5,-2.5 10,0" stroke="#BFE4FF" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    # moon reflection on the pond
    x,y=scr(3.5,0.6); A(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="10" ry="4" fill="#FFF1C9" opacity="0.8"/>')
    # planter
    x,y=scr(4,4); h=18
    A(f'<polygon points="{pts([(x-HW,y-h),(x,y+HH-h),(x,y+HH),(x-HW,y)])}" fill="#E8D8BC"/>')
    A(f'<polygon points="{pts([(x,y+HH-h),(x+HW,y-h),(x+HW,y),(x,y+HH)])}" fill="#B9A586"/>')
    A(f'<polygon points="{pts(dia(x,y-h))}" fill="#4F9A6E"/>')
    for dx,dy,col in [(-10,-2,'#F59AA8'),(0,-6,'#FFD670'),(10,-1,'#F59AA8')]:
        A(f'<circle cx="{f(x+dx+1)}" cy="{f(y-h+dy+1.5)}" r="3.4" fill="{SH}" opacity="0.3"/><circle cx="{f(x+dx)}" cy="{f(y-h+dy)}" r="3.4" fill="{col}"/>')
    # 101: flat paper sections, each casting a paper shadow on the one below
    A(f'<ellipse cx="{f(x0+6)}" cy="{f(y0+6)}" rx="40" ry="14" fill="{SH}" opacity="0.35"/>')
    for i,(h0,w0,h1,w1) in enumerate(STACK):
        L,R,Tp=faces(h0,w0,h1,w1)
        podium=i==0
        A(f'<polygon points="{pts(L)}" fill="{"#E8D8BC" if podium else "#9ACBD6"}"/>')
        A(f'<polygon points="{pts(R)}" fill="{"#B9A586" if podium else "#5E8EAE"}"/>')
        if not podium and i>1:
            # shadow of the flare above onto this section's top part
            A(f'<polygon points="{pts([L[0],L[1],R[1],R[2]])}" fill="none"/>')
        A(f'<polygon points="{pts(Tp)}" fill="#FFF1C9"/>')
        if i>=1:
            hh=(h0+h1)/2
            for k in range(3):
                wx=x0-w0+3+k*4; A(f'<rect x="{f(wx)}" y="{f(y0-hh+k*2-1)}" width="2.2" height="2.2" fill="#FFD670"/>')
    for i,(h0,w0,h1,w1) in enumerate(STACK[2:-2]):
        # paper ledge shadow under each flare
        A(f'<path d="M{f(x0-w0)},{f(y0-h0)} L{f(x0)},{f(y0-h0+w0/2)} L{f(x0+w0)},{f(y0-h0)} L{f(x0+w0)},{f(y0-h0+3)} L{f(x0)},{f(y0-h0+w0/2+3)} L{f(x0-w0)},{f(y0-h0+3)} Z" fill="{SH}" opacity="0.3"/>')
    A(f'<rect x="{f(x0-1.2)}" y="{f(y0-273)}" width="2.4" height="34" fill="#E8D8BC"/><circle cx="{f(x0)}" cy="{f(y0-275)}" r="2.6" fill="#E8553D"/>')
    # trees: stacked paper discs
    def tree(c,r,s=1):
        x,y=scr(c,r); A(f'<ellipse cx="{f(x+5*s)}" cy="{f(y+3)}" rx="{f(20*s)}" ry="{f(7*s)}" fill="{SH}" opacity="0.35"/>')
        A(f'<rect x="{f(x-2.6*s)}" y="{f(y-26*s)}" width="{f(5.2*s)}" height="{f(26*s)}" fill="#A8744E"/>')
        for (dx,dy,rr,col) in [(-11,-38,14,'#3E8058'),(10,-40,13,'#3E8058'),(0,-50,15,'#4F9A6E'),(-4,-34,12,'#5AA478'),(9,-30,10,'#4F9A6E')]:
            A(f'<circle cx="{f(x+dx*s+1.5)}" cy="{f(y+dy*s+2.5)}" r="{f(rr*s)}" fill="{SH}" opacity="0.3"/><circle cx="{f(x+dx*s)}" cy="{f(y+dy*s)}" r="{f(rr*s)}" fill="{col}"/>')
    tree(1.6,0.6); tree(0.5,1.7,0.72)
    def box(c,r,col,top_):
        x,y=scr(c,r); A(f'<rect x="{f(x-3)}" y="{f(y-19)}" width="10" height="20" rx="2" fill="{SH}" opacity="0.35"/>')
        A(f'<rect x="{f(x-5)}" y="{f(y-20)}" width="10" height="20" rx="2" fill="{col}"/><path d="M{f(x-6)},{f(y-20)} C{f(x-6)},{f(y-28)} {f(x+6)},{f(y-28)} {f(x+6)},{f(y-20)} Z" fill="{top_}"/>')
    box(0.45,2.1,'#D9483A','#EE6A58'); box(0.9,2.1,'#3E9A5C','#58B674')
    x,y=scr(4,2)
    for rr,op in [(30,0.12),(20,0.16),(11,0.3)]: A(f'<circle cx="{f(x+11)}" cy="{f(y-45)}" r="{rr}" fill="#FFE9A8" opacity="{op}"/>')
    A(f'<ellipse cx="{f(x+8)}" cy="{f(y+2)}" rx="30" ry="12" fill="#FFE9A8" opacity="0.18"/>')
    A(f'<rect x="{f(x-1.4)}" y="{f(y-48)}" width="2.8" height="48" fill="#2A2050"/><rect x="{f(x+5)}" y="{f(y-51)}" width="12" height="5" rx="1.5" fill="#2A2050"/><circle cx="{f(x+11)}" cy="{f(y-44.5)}" r="3" fill="#FFE9A8"/>')
    def hero(href,c,r,size):
        x,y=scr(c,r); A(f'<image href="{href}" x="{f(x-size/2)}" y="{f(y-size*0.94)}" width="{size}" height="{size}"/>')
    hero('baokaka-crawl.svg',1.75,2.25,62); hero('mocha-cat.svg',2.85,1.95,46)
    A('<rect width="390" height="600" filter="url(#pp-fiber)" opacity="0.3" style="mix-blend-mode:multiply"/>')
    A('</svg>'); return '\n'.join(o)

# ======================= C: NEON =======================
def neon_iso():
    random.seed(9); o=[]; A=o.append
    A('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 600" width="390" height="600">')
    A('''<defs><linearGradient id="ne-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080A22"/><stop offset="0.6" stop-color="#14123A"/><stop offset="1" stop-color="#2A1548"/></linearGradient>
    <radialGradient id="ne-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ne-pink" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF4D8D" stop-opacity=".45"/><stop offset="1" stop-color="#FF4D8D" stop-opacity="0"/></radialGradient>
    <radialGradient id="ne-cyan" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4DE3FF" stop-opacity=".4"/><stop offset="1" stop-color="#4DE3FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="ne-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFC94A" stop-opacity=".6"/><stop offset="1" stop-color="#FFC94A" stop-opacity="0"/></radialGradient>
    <radialGradient id="ne-green" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6BFFB8" stop-opacity=".35"/><stop offset="1" stop-color="#6BFFB8" stop-opacity="0"/></radialGradient></defs>''')
    A('<rect width="390" height="600" fill="url(#ne-sky)"/>')
    A('<g fill="#FFFFFF">'+''.join(f'<circle cx="{random.uniform(0,390):.0f}" cy="{random.uniform(0,230):.0f}" r="{random.choice([0.5,0.8,1])}" opacity="{random.choice([0.4,0.7,1])}"/>' for _ in range(46))+'</g>')
    A('<circle cx="78" cy="96" r="40" fill="url(#ne-warm)" opacity="0.5"/>'); A(glow('M64,96 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0','#FFE9A8','#FFF8E0',1.4))
    A(glow('M0,236 C40,206 74,198 112,216 C150,186 196,180 236,204 C274,192 306,196 338,210 C360,204 378,208 390,214','#8A5BFF','#C9B0FF',0.9))
    sk=[]; x=-4
    while x<394:
        w=random.choice([10,14,18,22,26]); h=random.randint(22,66); sk.append(f'M{x},{300-h} h{w} v{h} h-{w} Z'); x+=w+random.choice([2,3,4])
    A('<path d="'+' '.join(sk)+'" fill="#0E1030"/>')
    A('<g>'+''.join(f'<rect x="{random.uniform(0,386):.0f}" y="{random.uniform(240,294):.0f}" width="2" height="2" fill="{random.choice(["#FF4D8D","#4DE3FF","#FFC94A","#FFC94A"])}" opacity=".9"/>' for _ in range(46))+'</g>')
    A('<rect y="298" width="390" height="302" fill="#0A0B24"/>')
    # skirt
    A(f'<polygon points="{pts([l0,b,(b[0],b[1]+D),(l0[0],l0[1]+D)])}" fill="#121436"/><polygon points="{pts([b,r0,(r0[0],r0[1]+D),(b[0],b[1]+D)])}" fill="#0C0E2A"/>')
    A(glow(f'M{f(l0[0])},{f(l0[1])} L{f(b[0])},{f(b[1])} L{f(r0[0])},{f(r0[1])}','#4DE3FF','#D8FBFF',1.3))
    A(glow(f'M{f(b[0])},{f(b[1])} L{f(b[0])},{f(b[1]+D)}','#4DE3FF','#D8FBFF',0.8))
    T={'G':('#153E38','#4DFFB0'),'B':('#3E1C44','#FF4D8D'),'R':('#1C2050','#4DE3FF'),'X':('#1C2050','#4DE3FF'),'W':('#11306A','#4D9BFF'),'P':('#153E38','#4DFFB0')}
    for r in range(N):
        for c in range(N):
            t=GRID[r][c]
            if t=='P': continue
            x,y=scr(c,r); A(f'<polygon points="{pts(dia(x,y))}" fill="{T[t][0]}"/>')
    # grid lines in material colours (one thin tube per tile edge, low intensity)
    for r in range(N):
        for c in range(N):
            t=GRID[r][c]; x,y=scr(c,r); col=T[t][1]
            A(f'<path d="M{f(x-HW)},{f(y)} L{f(x)},{f(y-HH)} L{f(x+HW)},{f(y)}" stroke="{col}" stroke-width="1" opacity="0.7" fill="none"/>')
            if t=='X':
                for v in (-0.36,-0.12,0.12,0.36):
                    a=q(x,y,-0.32,v); e=q(x,y,0.32,v); A(glow(f'M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}','#FFFFFF','#FFFFFF',1.2))
            if t=='R' and c!=2:
                a=q(x,y,-0.25,0); e=q(x,y,0.25,0); A(glow(f'M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}','#4DE3FF','#D8FBFF',1.1))
            if t=='W': A(glow(f'M{f(x-14)},{f(y-2)} q6,-3 12,0 M{f(x+2)},{f(y+6)} q5,-2.5 10,0','#4D9BFF','#CFE4FF',0.8))
            if t=='G' and random.random()<0.6:
                gx,gy=x+random.uniform(-14,14),y+random.uniform(-4,4); A(glow(f'M{f(gx-3)},{f(gy)} l1.5,-4 l1.5,3 l1.5,-4 l1.5,4','#4DFFB0','#D8FFEE',0.6))
    # light pools
    x,y=scr(0.7,2.1); A(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="40" ry="18" fill="url(#ne-pink)"/>')
    x,y=scr(2,3); A(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="60" ry="24" fill="url(#ne-cyan)" opacity=".6"/>')
    x,y=scr(4,2); A(f'<ellipse cx="{f(x+8)}" cy="{f(y+2)}" rx="44" ry="20" fill="url(#ne-warm)"/>')
    A(f'<ellipse cx="{f(x0)}" cy="{f(y0)}" rx="50" ry="22" fill="url(#ne-green)"/>')
    # planter
    x,y=scr(4,4); h=18
    A(f'<polygon points="{pts([(x-HW,y-h),(x,y+HH-h),(x,y+HH),(x-HW,y)])}" fill="#16183E"/><polygon points="{pts([(x,y+HH-h),(x+HW,y-h),(x+HW,y),(x,y+HH)])}" fill="#0E1030"/><polygon points="{pts(dia(x,y-h))}" fill="#0F2A2A"/>')
    A(glow(dpath(dia(x,y-h)),'#4DFFB0','#D8FFEE',1))
    A(glow(f'M{f(x-HW)},{f(y-h)} L{f(x-HW)},{f(y)} L{f(x)},{f(y+HH)} L{f(x+HW)},{f(y)} L{f(x+HW)},{f(y-h)} M{f(x)},{f(y+HH)} L{f(x)},{f(y+HH-h)}','#4DFFB0','#D8FFEE',0.7))
    for dx,dy,col in [(-10,-2,'#FF4D8D'),(0,-6,'#FFC94A'),(10,-1,'#FF4D8D')]:
        A(glow(f'M{f(x+dx-2.6)},{f(y-h+dy)} a2.6,2.6 0 1,0 5.2,0 a2.6,2.6 0 1,0 -5.2,0',col,'#FFFFFF',0.8))
    # 101 in neon
    for i,(h0,w0,h1,w1) in enumerate(STACK):
        L,R,Tp=faces(h0,w0,h1,w1)
        A(f'<polygon points="{pts(L)}" fill="#1A2350"/><polygon points="{pts(R)}" fill="#10163A"/>')
    for i,(h0,w0,h1,w1) in enumerate(STACK):
        L,R,Tp=faces(h0,w0,h1,w1)
        col='#FFC94A' if i==0 else '#6BFFB8'
        A(glow(f'M{f(x0-w1)},{f(y0-h1)} L{f(x0)},{f(y0-h1+w1/2)} L{f(x0+w1)},{f(y0-h1)}',col,'#F0FFF8' if i else '#FFF6D6',1.1))
        A(glow(f'M{f(x0-w1)},{f(y0-h1)} L{f(x0-w0)},{f(y0-h0)} M{f(x0+w1)},{f(y0-h1)} L{f(x0+w0)},{f(y0-h0)}',col,'#F0FFF8' if i else '#FFF6D6',0.7))
    A(glow(f'M{f(x0)},{f(y0-239)} L{f(x0)},{f(y0-273)}','#FFFFFF','#FFFFFF',1.2)); A(f'<circle cx="{f(x0)}" cy="{f(y0-275)}" r="3" fill="#FF4D8D"/>')
    def tree(c,r,s=1):
        x,y=scr(c,r)
        A(f'<rect x="{f(x-2*s)}" y="{f(y-26*s)}" width="{f(4*s)}" height="{f(26*s)}" fill="#1A1430"/>')
        blobs=[(-11,-38,14),(10,-40,13),(0,-50,15),(-4,-34,12),(9,-30,10)]
        for dx,dy,rr in blobs: A(f'<circle cx="{f(x+dx*s)}" cy="{f(y+dy*s)}" r="{f(rr*s)}" fill="#0E2626"/>')
        A(glow(f'M{f(x-24*s)},{f(y-36*s)} C{f(x-28*s)},{f(y-52*s)} {f(x-12*s)},{f(y-68*s)} {f(x)},{f(y-65*s)} C{f(x+14*s)},{f(y-66*s)} {f(x+26*s)},{f(y-52*s)} {f(x+23*s)},{f(y-38*s)} C{f(x+22*s)},{f(y-24*s)} {f(x+10*s)},{f(y-20*s)} {f(x)},{f(y-24*s)} C{f(x-10*s)},{f(y-20*s)} {f(x-22*s)},{f(y-24*s)} {f(x-24*s)},{f(y-36*s)} Z','#4DFFB0','#D8FFEE',0.9))
    tree(1.6,0.6); tree(0.5,1.7,0.72)
    def box(c,r,col):
        x,y=scr(c,r); A(f'<rect x="{f(x-5)}" y="{f(y-20)}" width="10" height="20" rx="2" fill="#16122E"/>')
        A(glow(f'M{f(x-5)},{f(y)} L{f(x-5)},{f(y-20)} C{f(x-5)},{f(y-27)} {f(x+5)},{f(y-27)} {f(x+5)},{f(y-20)} L{f(x+5)},{f(y)} Z',col,'#FFFFFF',0.9))
    box(0.45,2.1,'#FF4D5E'); box(0.9,2.1,'#4DFF8A')
    x,y=scr(4,2); A(f'<circle cx="{f(x+11)}" cy="{f(y-45)}" r="16" fill="url(#ne-warm)"/>')
    A(glow(f'M{f(x)},{f(y)} L{f(x)},{f(y-46)} q0,-6 7,-6 h8','#FFC94A','#FFF6D6',1.1))
    def hero(href,c,r,size):
        x,y=scr(c,r); A(f'<image href="{href}" x="{f(x-size/2)}" y="{f(y-size*0.94)}" width="{size}" height="{size}"/>')
    hero('baokaka-crawl.svg',1.75,2.25,62); hero('mocha-cat.svg',2.85,1.95,46)
    A('</svg>'); return '\n'.join(o)

if __name__=='__main__':
    O='/home/user/baokaka-adventure/docs/art/options/'
    open(O+'b-paper-cut-night/iso.svg','w').write(paper_iso())
    open(O+'c-neon-sign-taipei/iso.svg','w').write(neon_iso())
