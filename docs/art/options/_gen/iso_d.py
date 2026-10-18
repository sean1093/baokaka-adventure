"""Option D iso patch: anime-film night background art (Shinkai/Ghibli lighting) on the shared 5x5 layout."""
import random, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from iso_bc import scr,f,pts,dia,q,faces,STACK,GRID,N,HW,HH,D,top,l0,b,r0,x0,y0
def build():
    random.seed(21); o=[]; A=o.append
    A('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 600" width="390" height="600">')
    A('''<defs>
<linearGradient id="d-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1238"/><stop offset=".35" stop-color="#1A2A6A"/><stop offset=".62" stop-color="#3A4A9A"/><stop offset=".8" stop-color="#8A6AB0"/><stop offset="1" stop-color="#F0A890"/></linearGradient>
<linearGradient id="d-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3474"/><stop offset=".7" stop-color="#5A5AA4"/><stop offset="1" stop-color="#E8A8C0"/></linearGradient>
<linearGradient id="d-cloud2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E2A62"/><stop offset="1" stop-color="#4A4E96"/></linearGradient>
<radialGradient id="d-bloom" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE6B0" stop-opacity=".95"/><stop offset=".35" stop-color="#FFC27A" stop-opacity=".45"/><stop offset="1" stop-color="#FF9A6A" stop-opacity="0"/></radialGradient>
<radialGradient id="d-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF8E6" stop-opacity=".9"/><stop offset=".25" stop-color="#DDE6FF" stop-opacity=".35"/><stop offset="1" stop-color="#9AB0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="d-teal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8AF0E0" stop-opacity=".7"/><stop offset="1" stop-color="#8AF0E0" stop-opacity="0"/></radialGradient>
<linearGradient id="d-milky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C8B8FF" stop-opacity="0"/><stop offset=".5" stop-color="#C8B8FF" stop-opacity=".22"/><stop offset="1" stop-color="#C8B8FF" stop-opacity="0"/></linearGradient>
<linearGradient id="d-glassL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3E5A9A"/><stop offset="1" stop-color="#2A3E78"/></linearGradient>
<linearGradient id="d-glassR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1C2858"/><stop offset="1" stop-color="#141C44"/></linearGradient>
<linearGradient id="d-refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".75"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></linearGradient>
<linearGradient id="d-reflG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8AF0E0" stop-opacity=".55"/><stop offset="1" stop-color="#8AF0E0" stop-opacity="0"/></linearGradient>
<linearGradient id="d-skirtL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3A5E"/><stop offset="1" stop-color="#2A2040"/></linearGradient>
<linearGradient id="d-skirtR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2444"/><stop offset="1" stop-color="#1A1430"/></linearGradient>
<filter id="d-blur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="d-blurS" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="d-blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
<filter id="d-blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>''')
    A('<rect width="390" height="600" fill="url(#d-sky)"/>')
    A('<path d="M-40,40 C80,90 260,150 430,260 L430,300 C260,190 80,130 -40,90 Z" fill="url(#d-milky)" filter="url(#d-blur8)"/>')
    # stars: dots + a few 4-point sparkles
    A('<g fill="#FFFFFF">'+''.join(f'<circle cx="{random.uniform(0,390):.1f}" cy="{random.uniform(0,250):.1f}" r="{random.choice([0.4,0.6,0.6,0.9,1.2])}" opacity="{random.choice([0.4,0.7,1])}"/>' for _ in range(90))+'</g>')
    for x,y,s in [(40,60,6),(330,44,5),(240,112,4),(150,30,4.4)]:
        A(f'<path d="M{x},{y-s} Q{x+.5},{y-.5} {x+s},{y} Q{x+.5},{y+.5} {x},{y+s} Q{x-.5},{y+.5} {x-s},{y} Q{x-.5},{y-.5} {x},{y-s} Z" fill="#fff"/><circle cx="{x}" cy="{y}" r="{s*1.6}" fill="#CFE0FF" opacity=".25" filter="url(#d-blur2)"/>')
    A('<circle cx="80" cy="102" r="56" fill="url(#d-moon)"/><circle cx="80" cy="102" r="15" fill="#FFF8E6"/><circle cx="75" cy="98" r="3" fill="#EDE2C8" opacity=".7"/><circle cx="86" cy="108" r="2" fill="#EDE2C8" opacity=".6"/>')
    # luminous clouds: dark bodies, lit undersides from the city, bright rims
    for ci,(cx,cy,sc,g) in enumerate([(300,150,1.25,'d-cloud'),(110,190,1.0,'d-cloud'),(250,70,0.8,'d-cloud2'),(30,140,0.7,'d-cloud2')]):
        fx,fy=[(1,1),(-1,0.8),(-1,1.15),(1,0.7)][ci]
        A(f'<g transform="translate({cx} {cy}) scale({fx*1.15} {fy}) translate({-cx} {-cy})">')
        d=f'M{cx-60*sc},{cy} C{cx-62*sc},{cy-14*sc} {cx-44*sc},{cy-22*sc} {cx-32*sc},{cy-16*sc} C{cx-28*sc},{cy-34*sc} {cx-4*sc},{cy-38*sc} {cx+6*sc},{cy-22*sc} C{cx+16*sc},{cy-36*sc} {cx+44*sc},{cy-30*sc} {cx+44*sc},{cy-12*sc} C{cx+58*sc},{cy-14*sc} {cx+66*sc},{cy-4*sc} {cx+62*sc},{cy+4*sc} C{cx+30*sc},{cy+10*sc} {cx-30*sc},{cy+10*sc} {cx-60*sc},{cy} Z'
        A(f'<path d="{d}" fill="url(#{g})" opacity=".95" filter="url(#d-blurS)"/>')
        A(f'<path d="{d}" fill="#7A84D0" opacity=".35" transform="translate({cx} {cy}) scale(.62 .55) translate({-cx-10*sc} {-cy-14*sc})" filter="url(#d-blurS)"/>')
        A(f'<path d="{d}" fill="#A8B4F0" opacity=".25" transform="translate({cx} {cy}) scale(.34 .3) translate({-cx-26*sc} {-cy-40*sc})" filter="url(#d-blurS)"/>')
        A(f'<path d="M{cx-58*sc},{cy+1} C{cx-30*sc},{cy+8*sc} {cx+30*sc},{cy+8*sc} {cx+61*sc},{cy+3*sc}" stroke="#FFC8D8" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round" filter="url(#d-blurS)"/>')
        A(f'<path d="M{cx-30*sc},{cy-17*sc} C{cx-26*sc},{cy-32*sc} {cx-6*sc},{cy-36*sc} {cx+4*sc},{cy-24*sc} C{cx+14*sc},{cy-36*sc} {cx+40*sc},{cy-30*sc} {cx+42*sc},{cy-14*sc}" stroke="#C8D4FF" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/>')
        A('</g>')
    # far ridge + city glow + skyline + bokeh
    A('<path d="M0,240 C40,214 76,206 114,220 C150,196 196,190 238,210 C276,198 308,202 338,214 C360,208 378,212 390,218 L390,320 L0,320 Z" fill="#2A2C66"/>')
    A('<ellipse cx="195" cy="300" rx="260" ry="60" fill="#FF9A7A" opacity=".35" filter="url(#d-blur8)"/>')
    sk=[]; x=-4; wins=[]
    while x<394:
        w=random.choice([10,14,18,22,26]); h=random.randint(24,70); sk.append(f'M{x},{304-h} h{w} v{h} h-{w} Z')
        for _ in range(int(w*h/60)):
            wins.append((x+random.uniform(1,w-2),304-random.uniform(2,h-2)))
        x+=w+random.choice([0,1,3])
    A('<path d="'+' '.join(sk)+'" fill="#1E1E4E"/>')
    A('<g>'+''.join(f'<rect x="{wx:.1f}" y="{wy:.1f}" width="1.6" height="1.6" fill="{random.choice(["#FFD98A","#FFD98A","#FFE9C0","#9AE0FF"])}" opacity="{random.choice([0.5,0.8,1])}"/>' for wx,wy in wins)+'</g>')
    A('<g filter="url(#d-blur2)">'+''.join(f'<circle cx="{random.uniform(0,390):.0f}" cy="{random.uniform(272,304):.0f}" r="{random.choice([2,3,4])}" fill="{random.choice(["#FFC27A","#FF9AB0","#9AE0FF","#FFE6A0"])}" opacity=".7"/>' for _ in range(24))+'</g>')
    A('<linearGradient id="d-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A62"/><stop offset=".3" stop-color="#1E1844"/><stop offset="1" stop-color="#0E0B26"/></linearGradient><rect y="300" width="390" height="300" fill="url(#d-floor)"/>')
    A('<ellipse cx="195" cy="306" rx="240" ry="20" fill="#C87AA0" opacity=".3" filter="url(#d-blur8)"/>')
    # skirt
    A(f'<polygon points="{pts([l0,b,(b[0],b[1]+D),(l0[0],l0[1]+D)])}" fill="url(#d-skirtL)"/><polygon points="{pts([b,r0,(r0[0],r0[1]+D),(b[0],b[1]+D)])}" fill="url(#d-skirtR)"/>')
    A(f'<path d="M{f(l0[0])},{f(l0[1]+12)} L{f(b[0])},{f(b[1]+12)} L{f(r0[0])},{f(r0[1]+12)}" stroke="#6A5A86" stroke-width="1" fill="none" opacity=".6"/>')
    A(f'<path d="M{f(l0[0])},{f(l0[1])} L{f(b[0])},{f(b[1])} L{f(r0[0])},{f(r0[1])}" stroke="#AFC0FF" stroke-width="1.2" fill="none" opacity=".55"/>')
    # tiles: night-painted bases with subtle variation
    T={'G':('#2E5A58','#2A5452','#5A9A8A','#1E3E40'),'B':('#6E3A4E','#683648','#B0687A','#4A2638'),'R':('#2A2E58','#282C54','#5A6098','#1A1C3E'),'X':('#2A2E58','#2A2E58','#5A6098','#1A1C3E'),'W':('#24407E','#223C78','#7AA8E8','#14285A'),'P':('#2E5A58','#2E5A58','#5A9A8A','#1E3E40')}
    for r in range(N):
        for c in range(N):
            t=GRID[r][c]
            if t=='P': continue
            x,y=scr(c,r); bse,alt,lit,shd=T[t]
            A(f'<polygon points="{pts(dia(x,y))}" fill="{bse if (c*7+r*3)%3 else alt}"/>')
            A(f'<path d="M{f(x-HW+2)},{f(y)} L{f(x)},{f(y-HH+1)} L{f(x+HW-2)},{f(y)}" stroke="{lit}" stroke-width=".9" fill="none" opacity=".45"/>')
            if t=='G':
                for _ in range(5):
                    gx,gy=x+random.uniform(-18,18),y+random.uniform(-6,6)
                    A(f'<path d="M{f(gx-2.4)},{f(gy)} Q{f(gx-1)},{f(gy-5)} {f(gx-0.4)},{f(gy-6)} Q{f(gx)},{f(gy-3)} {f(gx+0.4)},{f(gy)} Z" fill="#4E8A7A"/><path d="M{f(gx+0.6)},{f(gy)} Q{f(gx+2)},{f(gy-4)} {f(gx+3.4)},{f(gy-4.6)} Q{f(gx+2.4)},{f(gy-2)} {f(gx+2.2)},{f(gy)} Z" fill="#6AAE92"/>')
            if t=='B':
                for v in (-0.25,0,0.25):
                    a=q(x,y,-0.47,v); e=q(x,y,0.47,v); A(f'<path d="M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}" stroke="#4A2638" stroke-width=".8" opacity=".7"/>')
            if t=='X':
                for v in (-0.36,-0.12,0.12,0.36):
                    A(f'<polygon points="{pts([q(x,y,-0.32,v-0.065),q(x,y,0.32,v-0.065),q(x,y,0.32,v+0.065),q(x,y,-0.32,v+0.065)])}" fill="#C8CCE8" opacity=".85"/>')
            if t=='R' and c!=2:
                a=q(x,y,-0.2,0); e=q(x,y,0.2,0); A(f'<path d="M{f(a[0])},{f(a[1])} L{f(e[0])},{f(e[1])}" stroke="#C8CCE8" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>')
            if t=='W':
                A(f'<path d="M{f(x-14)},{f(y-2)} q6,-3 12,0 M{f(x+2)},{f(y+6)} q5,-2.5 10,0" stroke="#AFCFFF" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>')
    # wet-ground reflections: lamp (warm) and 101 (teal) as soft vertical streaks; moon in the pond
    lx,ly=scr(4,2)
    A(f'<g filter="url(#d-blur2)"><rect x="{f(lx+7)}" y="{f(ly-2)}" width="8" height="46" fill="url(#d-refl)" transform="skewX(-8)"/></g>')
    rx_,ry_=scr(2.2,3.1); A(f'<g filter="url(#d-blur2)" opacity=".8"><rect x="{f(rx_-30)}" y="{f(ry_-8)}" width="5" height="40" fill="url(#d-reflG)"/><rect x="{f(rx_-18)}" y="{f(ry_-6)}" width="3" height="30" fill="url(#d-refl)"/></g>')
    px,py=scr(3.5,0.6); A(f'<ellipse cx="{f(px)}" cy="{f(py)}" rx="9" ry="3" fill="#FFF8E6" opacity=".85" filter="url(#d-blur2)"/><path d="M{f(px-6)},{f(py+5)} h12 M{f(px-4)},{f(py+8)} h8" stroke="#FFF8E6" stroke-width=".8" opacity=".6"/>')
    # planter
    x,y=scr(4,4); h=18
    A(f'<polygon points="{pts([(x-HW,y-h),(x,y+HH-h),(x,y+HH),(x-HW,y)])}" fill="#5A5478"/><polygon points="{pts([(x,y+HH-h),(x+HW,y-h),(x+HW,y),(x,y+HH)])}" fill="#3A3458"/><polygon points="{pts(dia(x,y-h))}" fill="#2E5A58"/>')
    A(f'<path d="M{f(x-HW)},{f(y-h)} L{f(x)},{f(y+HH-h)} L{f(x+HW)},{f(y-h)}" stroke="#AFC0FF" stroke-width="1.1" fill="none" opacity=".7"/>')
    for dx,dy,col in [(-10,-2,'#FF9AB0'),(0,-6,'#FFE08A'),(10,-1,'#FF9AB0')]:
        A(f'<circle cx="{f(x+dx)}" cy="{f(y-h+dy)}" r="3.4" fill="#2E5A4A"/><circle cx="{f(x+dx)}" cy="{f(y-h+dy-1.4)}" r="2" fill="{col}"/>')
    # 101: night glass, lit window grid, cyan rim, glowing ledges, beacon bloom
    A(f'<ellipse cx="{f(x0)}" cy="{f(y0+4)}" rx="44" ry="15" fill="#0A0820" opacity=".5"/>')
    random.seed(4)
    for i,(h0,w0,h1,w1) in enumerate(STACK):
        L,R,Tp=faces(h0,w0,h1,w1)
        A(f'<polygon points="{pts(L)}" fill="{"#8A8098" if i==0 else "url(#d-glassL)"}"/><polygon points="{pts(R)}" fill="{"#5A5070" if i==0 else "url(#d-glassR)"}"/>')
        if i>=1:
            rows=int((h1-h0)/4)
            for k in range(rows):
                hh=h0+2+k*4; ww=w0+(w1-w0)*(k+.5)/rows
                for j in range(int(ww/3.2)):
                    if random.random()<0.55:
                        t=(j+.5)/int(ww/3.2)
                        wx=x0-ww+t*ww; wy=y0-hh+t*ww/2
                        A(f'<rect x="{f(wx-0.7)}" y="{f(wy-0.9)}" width="1.4" height="1.6" fill="{random.choice(["#FFD98A","#FFE9C0","#FFC27A"])}" opacity="{random.choice([0.55,0.8,1])}"/>')
                    if random.random()<0.25:
                        t=(j+.5)/int(ww/3.2); wx=x0+t*ww; wy=y0-hh+ww/2-t*ww/2
                        A(f'<rect x="{f(wx-0.7)}" y="{f(wy-0.9)}" width="1.4" height="1.6" fill="#FFD98A" opacity=".55"/>')
        A(f'<path d="M{f(x0-w1)},{f(y0-h1)} L{f(x0)},{f(y0-h1+w1/2)} L{f(x0+w1)},{f(y0-h1)}" stroke="#8AF0E0" stroke-width="1.1" fill="none" opacity=".9"/>')
        A(f'<path d="M{f(x0+w1)},{f(y0-h1)} L{f(x0+w0)},{f(y0-h0)}" stroke="#8AF0E0" stroke-width=".9" opacity=".7"/>')
    A(f'<g filter="url(#d-blur4)" opacity=".8">'+''.join(f'<path d="M{f(x0-20.5)},{f(y0-89-19*i)} L{f(x0)},{f(y0-89-19*i+10.25)} L{f(x0+20.5)},{f(y0-89-19*i)}" stroke="#8AF0E0" stroke-width="3" fill="none"/>' for i in range(8))+'</g>')
    A(f'<path d="M{f(x0)},{f(y0-239)} L{f(x0)},{f(y0-273)}" stroke="#DDE6FF" stroke-width="1.4"/><circle cx="{f(x0)}" cy="{f(y0-275)}" r="10" fill="url(#d-bloom)"/><circle cx="{f(x0)}" cy="{f(y0-275)}" r="2" fill="#FFB0A0"/>')
    A(f'<circle cx="{f(x0)}" cy="{f(y0-200)}" r="70" fill="url(#d-teal)" opacity=".18"/>')
    # anime trees: clumped cel-shaded foliage, warm lamp rim on the right
    def tree(c,r,s=1):
        x,y=scr(c,r); A(f'<ellipse cx="{f(x)}" cy="{f(y+2)}" rx="{f(22*s)}" ry="{f(8*s)}" fill="#0A0820" opacity=".45"/>')
        A(f'<path d="M{f(x-3*s)},{f(y)} C{f(x-3*s)},{f(y-14*s)} {f(x-2*s)},{f(y-22*s)} {f(x)},{f(y-30*s)} C{f(x+2*s)},{f(y-22*s)} {f(x+3*s)},{f(y-14*s)} {f(x+3.4*s)},{f(y)} Z" fill="#3A2A3E"/>')
        def clump(cx,cy,rr,col):
            pts_=[]
            import math
            for k in range(9):
                a=math.pi*2*k/9; rad=rr*(1 if k%2 else 0.82)
                pts_.append((cx+rad*math.cos(a),cy+rad*0.85*math.sin(a)))
            d='M'+' Q'.join(f'{f(px_)},{f(py_)} {f((px_+pts_[(k+1)%9][0])/2)},{f((py_+pts_[(k+1)%9][1])/2)}' for k,(px_,py_) in enumerate(pts_))+' Z'
            A(f'<path d="{d}" fill="{col}"/>')
        for dx,dy,rr in [(-12,-38,15),(10,-40,14),(0,-52,16),(-4,-32,13),(12,-30,11)]: clump(x+dx*s,y+dy*s,rr*s,'#1E3A44')
        for dx,dy,rr in [(-14,-42,10),(-2,-56,11),(6,-44,9),(-8,-34,8)]: clump(x+dx*s,y+dy*s,rr*s,'#2E5A5E')
        for dx,dy,rr in [(-16,-46,5),(-4,-60,5.4),(4,-48,4)]: clump(x+dx*s,y+dy*s,rr*s,'#4E8A82')
        A(f'<path d="M{f(x+20*s)},{f(y-46*s)} C{f(x+25*s)},{f(y-36*s)} {f(x+22*s)},{f(y-26*s)} {f(x+16*s)},{f(y-22*s)}" stroke="#FFC890" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>')
    tree(1.6,0.6); tree(0.5,1.7,0.72)
    def box(c,r,col,deep,top_):
        x,y=scr(c,r)
        A(f'<rect x="{f(x-5)}" y="{f(y-20)}" width="10" height="20" rx="2" fill="{col}"/><rect x="{f(x+1)}" y="{f(y-20)}" width="4" height="20" rx="1.5" fill="{deep}"/><path d="M{f(x-6)},{f(y-20)} C{f(x-6)},{f(y-28)} {f(x+6)},{f(y-28)} {f(x+6)},{f(y-20)} Z" fill="{top_}"/><path d="M{f(x+5)},{f(y-24)} L{f(x+5)},{f(y-2)}" stroke="#FFC890" stroke-width=".9" opacity=".7"/>')
    box(0.45,2.1,'#A83A40','#7A2830','#C04A50'); box(0.9,2.1,'#2E7A50','#1E5A3A','#3E9A64')
    # street lamp with bloom + light cone + ground pool
    A(f'<path d="M{f(lx)},{f(ly)} L{f(lx)},{f(ly-46)} q0,-6 7,-6 h3" stroke="#20243E" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M{f(lx+6)},{f(ly-50)} h10 l-2,4 h-6 Z" fill="#20243E"/>')
    A(f'<path d="M{f(lx+8)},{f(ly-45)} L{f(lx-14)},{f(ly+6)} L{f(lx+34)},{f(ly+6)} Z" fill="#FFD9A0" opacity=".12" filter="url(#d-blur4)"/>')
    A(f'<ellipse cx="{f(lx+10)}" cy="{f(ly+3)}" rx="36" ry="13" fill="url(#d-bloom)" opacity=".55"/>')
    A(f'<circle cx="{f(lx+11)}" cy="{f(ly-45)}" r="22" fill="url(#d-bloom)"/><ellipse cx="{f(lx+11)}" cy="{f(ly-45)}" rx="3.4" ry="1.4" fill="#FFF8E6"/>')
    # heroes
    def hero(href,c,r,size):
        x,y=scr(c,r); A(f'<image href="{href}" x="{f(x-size/2)}" y="{f(y-size*0.93)}" width="{size}" height="{size}"/>')
    hero('baokaka-crawl.svg',1.75,2.25,66); hero('mocha-walk.svg',2.9,1.9,56)
    # foreground bokeh + light grain
    A('<g filter="url(#d-blur4)" opacity=".55"><circle cx="20" cy="560" r="16" fill="#FFC27A"/><circle cx="372" cy="520" r="12" fill="#9AE0FF"/><circle cx="340" cy="585" r="9" fill="#FF9AB0"/></g>')
    A('</svg>'); return '\n'.join(o)
if __name__=='__main__':
    open('/home/user/baokaka-adventure/docs/art/options/d-anime/iso.svg','w').write(build())
