"""Option D (anime cel style). Characters on a 200-unit canvas.
Line system: pass 1 draws every silhouette part with a thick dark warm stroke (SIL); pass 2 draws the
fills with thin strokes tinted from each material, so outer contours read thick and inner lines thin."""
SIL='#5A2C34'
M={ # material: base, shade(cel), deep(occlusion), line tint, light
 'skin':('#FFE7D6','#F8C3AE','#EBA190','#C9786A','#FFF6EE'),
 'pj':('#FFD86A','#F2AE4A','#D98A3A','#B86E2A','#FFF0B0'),
 'hair':('#6A4234','#46281F','#2E1913','#2A1612','#A8705A'),
 'cream':('#FFF6E6','#EED9BC','#D9BC98','#B08A64','#FFFFFF'),
 'bear':('#B98058','#93603E','#744628','#5A3420','#D8A47C'),
 'red':('#FF6E5E','#D94A44','#B23436','#8A2A2C','#FFB2A2'),
}
def part(d,mat,sil=True,lw=1.3,extra=''):
    b,s,dp,ln,lt=M[mat]
    return (f'<path d="{d}" fill="none" stroke="{SIL}" stroke-width="3.4" stroke-linejoin="round"{extra}/>' if sil else '', f'<path d="{d}" fill="{b}" stroke="{ln}" stroke-width="{lw}" stroke-linejoin="round"{extra}/>')
class Layer:
    def __init__(s): s.sil=[]; s.body=[]
    def add(s,d,mat,**k):
        a,b=part(d,mat,**k); s.sil.append(a); s.body.append(b)
    def raw(s,x): s.body.append(x)
    def out(s): return ''.join(s.sil)+''.join(s.body)

def eye(cx,cy,flip=False,expr='happy',iris=('#2E1A12','#7A4628','#D99A56','#F7D49A'),uid='e'):
    """Anime eye: sclera, gradient iris + ring, lid shadow, pupil, reflected light, two speculars, tapered lash."""
    sx=-1 if flip else 1
    if expr=='laugh':
        return f'<path d="M{cx-9},{cy+2} C{cx-6},{cy-7} {cx+6},{cy-7} {cx+9},{cy+2} C{cx+5},{cy-3.4} {cx-5},{cy-3.4} {cx-9},{cy+2} Z" fill="#2E1A12"/>'
    g=f'<defs><linearGradient id="{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{iris[0]}"/><stop offset=".45" stop-color="{iris[1]}"/><stop offset="1" stop-color="{iris[2]}"/></linearGradient></defs>'
    o=[g]
    o.append(f'<path d="M{cx-9.6},{cy} C{cx-9.6},{cy-10} {cx+9.6},{cy-10} {cx+9.6},{cy} C{cx+9.6},{cy+10.6} {cx-9.6},{cy+10.6} {cx-9.6},{cy} Z" fill="#FFFFFF"/>')
    irx,iry=(6.0,7.2) if expr=='surprised' else (8.2,9.6)
    o.append(f'<ellipse cx="{cx+0.6*sx}" cy="{cy+1}" rx="{irx}" ry="{iry}" fill="url(#{uid})" stroke="#2A140E" stroke-width="0.9"/>')
    o.append(f'<path d="M{cx-8},{cy-3} C{cx-6},{cy-9} {cx+7},{cy-9} {cx+9},{cy-3} C{cx+5},{cy-6} {cx-4},{cy-6} {cx-8},{cy-3} Z" fill="#1A0C08" opacity=".55"/>')
    o.append(f'<ellipse cx="{cx+0.6*sx}" cy="{cy+1.6}" rx="{2.2 if expr=="surprised" else 3.4}" ry="{3 if expr=="surprised" else 4.6}" fill="#140A06"/>')
    o.append(''.join(f'<path d="M{cx+0.6*sx+3.6*__import__("math").cos(a)},{cy+1.6+4.6*__import__("math").sin(a)} L{cx+0.6*sx+7.4*__import__("math").cos(a)},{cy+1+9*__import__("math").sin(a)}" stroke="{iris[3]}" stroke-width=".7" opacity=".55"/>' for a in [0.35,0.9,1.4,1.9,2.4,2.8]))
    o.append(f'<path d="M{cx-5.6},{cy+6.4} C{cx-3},{cy+9.4} {cx+4},{cy+9.4} {cx+6.6},{cy+6.2} C{cx+3},{cy+7.6} {cx-2.4},{cy+7.8} {cx-5.6},{cy+6.4} Z" fill="{iris[3]}" opacity=".95"/>')
    if expr=='teary':
        o.append(f'<path d="M{cx-9},{cy+7} C{cx-4},{cy+11} {cx+5},{cy+11} {cx+9.4},{cy+6.6}" stroke="#BFE8FF" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>')
        o.append(f'<ellipse cx="{cx-3.2*sx}" cy="{cy-3}" rx="3.8" ry="4.6" fill="#fff"/><circle cx="{cx+3.6*sx}" cy="{cy+4.4}" r="2.2" fill="#fff"/><circle cx="{cx-4*sx}" cy="{cy+4}" r="1.2" fill="#fff"/><circle cx="{cx+4*sx}" cy="{cy-4}" r="1.1" fill="#fff"/>')
    else:
        o.append(f'<ellipse cx="{cx-3.4*sx}" cy="{cy-3.2}" rx="3.2" ry="4" transform="rotate({-20*sx} {cx-3.4*sx} {cy-3.2})" fill="#fff"/><circle cx="{cx+3.8*sx}" cy="{cy+4.2}" r="1.6" fill="#fff"/><circle cx="{cx+1*sx}" cy="{cy-5.6}" r=".8" fill="#fff"/>')
    # tapered upper lash, thicker at the outer corner, with a soft flick
    ox=cx+9.6*sx; ix=cx-9.6*sx
    o.append(f'<path d="M{ix},{cy+0.4} C{ix+1*sx},{cy-9.4} {ox-2*sx},{cy-10.6} {ox+1.4*sx},{cy-3.4} L{ox+2.6*sx},{cy-4.6} C{ox+0.6*sx},{cy-12.4} {ix-0.4*sx},{cy-12} {ix-0.6*sx},{cy+0.4} Z" fill="#2E1A12"/>')
    o.append(f'<path d="M{cx+2*sx},{cy+10.6} C{cx+5*sx},{cy+10.4} {cx+7.6*sx},{cy+8.6} {cx+8.8*sx},{cy+6.4}" stroke="#C9786A" stroke-width="0.9" fill="none" stroke-linecap="round"/>')
    return ''.join(o)

def head(expr='happy',uid='h'):
    """Head at local origin (0,0), ~104 wide. Light from upper-left."""
    L=Layer(); o=[]
    HEAD="M0,-50 C30,-50 52,-30 52,-3 C52,22 37,44 0,46 C-37,44 -52,22 -52,-3 C-52,-30 -30,-50 0,-50 Z"
    # back hair mass + ears go behind the face
    L.add("M-54,-4 C-58,-34 -34,-58 0,-58 C34,-58 58,-34 54,-4 C50,-24 30,-40 0,-40 C-30,-40 -50,-24 -54,-4 Z",'hair')
    L.add("M-47,4 C-58,-2 -60,16 -48,20 C-46,14 -46,9 -47,4 Z",'skin')
    L.add("M47,4 C58,-2 60,16 48,20 C46,14 46,9 47,4 Z",'skin')
    L.add(HEAD,'skin')
    o.append(L.out())
    o.append(f'<clipPath id="{uid}-hc"><path d="{HEAD}"/></clipPath><g clip-path="url(#{uid}-hc)">')
    # cel shade: far cheek + under-fringe shadow, hard edges
    o.append('<path d="M30,-40 C50,-20 52,10 36,34 C28,42 14,46 4,46 L60,60 L60,-50 Z" fill="#F8C3AE"/>')
    o.append('<path d="M-52,-14 C-40,-20 -30,-14 -22,-18 C-14,-12 -4,-16 4,-12 C12,-16 22,-10 30,-14 C38,-10 46,-16 54,-10 L54,-30 L-52,-30 Z" fill="#F8C3AE"/>')
    o.append('<path d="M44,20 C40,34 28,42 12,45 L60,60 Z" fill="#EBA190"/>')
    o.append('<path d="M-46,10 C-46,24 -40,32 -30,38" stroke="#FFF6EE" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')
    o.append('<path d="M50,-14 C53,0 51,16 44,28" stroke="#CFEAFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".9"/>')
    o.append('</g>')
    # blush: soft gradient + three hatch strokes
    o.append(f'<defs><radialGradient id="{uid}-bl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF7F86" stop-opacity=".6"/><stop offset="1" stop-color="#FF7F86" stop-opacity="0"/></radialGradient></defs>')
    for bx in (-30,32):
        o.append(f'<ellipse cx="{bx}" cy="20" rx="13" ry="7" fill="url(#{uid}-bl)"/>')
        o.append(''.join(f'<path d="M{bx-6+k*4},{23} l2.4,-5" stroke="#F06A74" stroke-width="1" stroke-linecap="round" opacity=".8"/>' for k in range(3)))
    # eyes (big, low on the face)
    if expr=='teary':
        o.append(eye(-20,8,False,'teary',uid=uid+'eL')+eye(22,8,True,'teary',uid=uid+'eR'))
    else:
        o.append(eye(-20,8,False,expr,uid=uid+'eL')+eye(22,8,True,expr,uid=uid+'eR'))
    # brows
    if expr=='teary':
        o.append('<path d="M-28,-10 C-24,-14 -18,-15 -13,-14 M15,-14 C20,-15 26,-14 30,-10" stroke="#8A5040" stroke-width="1.6" stroke-linecap="round" fill="none"/>')
    elif expr=='surprised':
        o.append('<path d="M-29,-17 C-25,-21 -18,-22 -12,-20 M14,-20 C20,-22 27,-21 31,-17" stroke="#8A5040" stroke-width="1.6" stroke-linecap="round" fill="none"/>')
    else:
        o.append('<path d="M-28,-13 C-24,-16 -18,-17 -13,-16 M15,-16 C20,-17 26,-16 30,-13" stroke="#8A5040" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".85"/>')
    o.append('<path d="M1,20 C2,21.4 3.6,21.4 4.4,20.4" stroke="#D98A7A" stroke-width="1.2" stroke-linecap="round" fill="none"/>')
    # mouth
    if expr=='happy':
        o.append('<path d="M-7,27 C-6,36 10,36 11,27 C6,29 -2,29 -7,27 Z" fill="#A83E48" stroke="#7A2A32" stroke-width="1" stroke-linejoin="round"/><path d="M-3,32.6 C0,35 6,35 8,32.4 C5,31 0,31 -3,32.6 Z" fill="#FF8F98"/><path d="M-5,27.6 C-1,29 5,29 9,27.6" stroke="#fff" stroke-width="1.2" opacity=".85" fill="none"/>')
    elif expr=='laugh':
        o.append('<path d="M-10,25 C-9,40 13,40 14,25 C8,28 -4,28 -10,25 Z" fill="#A83E48" stroke="#7A2A32" stroke-width="1" stroke-linejoin="round"/><path d="M-5,33 C-1,38 8,38 10,33 C6,31 -1,31 -5,33 Z" fill="#FF8F98"/>')
        o.append('<path d="M-34,8 l-6,-3 M-34,12 l-7,1 M38,8 l6,-3 M38,12 l7,1" stroke="#F06A74" stroke-width="1.2" stroke-linecap="round"/>')
    elif expr=='surprised':
        o.append('<ellipse cx="2" cy="31" rx="4.6" ry="5.6" fill="#A83E48" stroke="#7A2A32" stroke-width="1"/><ellipse cx="2" cy="33.4" rx="2.6" ry="2" fill="#FF8F98"/>')
        o.append('<path d="M-44,-28 l-4,-6 M-48,-20 l-7,-2 M48,-28 l4,-6 M52,-20 l7,-2" stroke="#7A2A32" stroke-width="1.4" stroke-linecap="round"/>')
    else:
        o.append('<path d="M-6,30 C-3,27 0,28 2,30 C4,28 7,27 10,30" stroke="#7A2A32" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        o.append('<path d="M-38,20 C-39,26 -36,30 -33,28 C-31,26 -34,22 -38,20 Z" fill="#BFE8FF" stroke="#7AB8E0" stroke-width=".8"/>')
    # front hair: pointed clumps (anime fringe), side tufts, ahoge, angel ring
    FR="M-50,-6 C-52,-36 -30,-55 0,-55 C30,-55 52,-36 50,-8 Q47,-18 42,-22 Q38,-14 33,-9 Q32,-21 28,-25 Q24,-17 18,-12 Q17,-22 13,-27 Q9,-19 4,-14 Q4,-21 1,-25 Q-3,-14 -8,-7 Q-8,-18 -11,-25 Q-15,-17 -20,-12 Q-21,-21 -24,-25 Q-28,-16 -33,-10 Q-35,-18 -38,-22 Q-42,-14 -46,-8 Q-48,-7 -50,-6 Z"
    o.append(f'<g clip-path="url(#{uid}-hc)"><path d="{FR}" fill="#EBA190" transform="translate(2 5)"/><path d="{FR}" fill="#F8C3AE" transform="translate(1 3)" opacity=".0"/></g>')
    F=Layer()
    F.add("M-50,-8 C-56,0 -55,10 -51,18 Q-49,8 -46,4 Q-47,0 -44,-4 Z",'hair')
    F.add("M50,-10 C56,-2 55,8 51,16 Q50,6 47,2 Q47,-2 45,-6 Z",'hair')
    F.add(FR,'hair')
    F.add("M-2,-54 C-6,-65 2,-73 12,-71 C6,-69 3,-65 5,-59 C8,-63 14,-63 17,-59 C10,-59 6,-57 4,-53 Z",'hair')
    o.append(F.out())
    o.append(f'<clipPath id="{uid}-fc"><path d="{FR}"/></clipPath><g clip-path="url(#{uid}-fc)">')
    o.append('<path d="M16,-56 C38,-50 54,-32 50,-6 L64,-6 L64,-64 Z" fill="#46281F"/>')
    o.append('<path d="M30,-30 C34,-26 38,-22 42,-20 L50,-8 L50,-30 Z" fill="#2E1913" opacity=".6"/>')
    # clump separation strokes (tapered fills)
    for x0,y0,x1,y1 in [(-20,-48,-24,-25),(-6,-50,-11,-25),(8,-50,13,-27),(22,-46,28,-25),(-34,-40,-38,-22),(34,-40,42,-22)]:
        o.append(f'<path d="M{x0},{y0} Q{(x0+x1)/2+1.6},{(y0+y1)/2} {x1},{y1} Q{(x0+x1)/2-0.4},{(y0+y1)/2} {x0},{y0} Z" fill="#2E1913"/>')
    # angel ring: a band that follows the skull, jagged lower edge
    zz=''.join(f' L{x},{-38.5+((i%2)*3.2)+abs(x)*0.1}' for i,x in enumerate(range(38,-43,-5)))
    o.append(f'<path d="M-42,-33 C-32,-44 -14,-48.5 0,-48.5 C16,-48.5 32,-44 40,-35{zz} Z" fill="#8E5A46"/>')
    o.append('<path d="M-32,-40 C-27,-43.4 -22,-45 -17,-46 M-7,-47 C-3,-47.4 1,-47.4 5,-47.2 M15,-46 C20,-45 24,-43.4 28,-41" stroke="#F0C4AC" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
    o.append('</g>')
    o.append('<path d="M2,-57 C1,-63 5,-68 10,-69" stroke="#B47C64" stroke-width="1.2" fill="none" stroke-linecap="round"/>')
    return ''.join(o)

def baokaka_seated(expr='happy',uid='bs'):
    L=Layer(); o=[]
    o.append(f'<defs><radialGradient id="{uid}-sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E1430" stop-opacity=".45"/><stop offset="1" stop-color="#1E1430" stop-opacity="0"/></radialGradient></defs>')
    o.append(f'<ellipse cx="100" cy="186" rx="76" ry="10" fill="url(#{uid}-sh)"/>')
    # back arm, legs
    L.add("M128,122 C140,128 146,142 142,156 C140,162 132,164 128,158 C130,148 128,138 122,130 Z",'pj')
    L.add("M70,160 C58,166 46,172 38,178 C32,186 40,194 50,190 C60,186 72,180 84,176 Z",'pj')
    L.add("M130,160 C142,166 154,172 162,178 C168,186 160,194 150,190 C140,186 128,180 116,176 Z",'pj')
    L.add("M70,112 C56,126 52,152 60,172 C76,184 124,184 140,172 C148,152 144,126 130,112 Z",'pj')
    o.append(L.out())
    # cel shading on torso + legs (hard-edged)
    o.append(f'<clipPath id="{uid}-tc"><path d="M70,112 C56,126 52,152 60,172 C76,184 124,184 140,172 C148,152 144,126 130,112 Z"/></clipPath><g clip-path="url(#{uid}-tc)">')
    o.append('<path d="M118,108 C134,124 140,150 132,180 L160,180 L160,100 Z" fill="#F2AE4A"/>')
    o.append('<path d="M66,108 C80,124 120,124 134,108 L134,100 L66,100 Z" fill="#D98A3A"/>')
    o.append('<path d="M62,166 C80,176 120,176 138,166 L140,190 L60,190 Z" fill="#F2AE4A"/>')
    o.append('<path d="M64,132 C62,146 62,158 66,168" stroke="#FFF0B0" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>')
    # star print (hard little 4-point stars, some in shadow tone)
    for x,y,s,c in [(78,138,4,'#FFF6DA'),(92,124,3,'#FFF6DA'),(84,160,3.4,'#FFF6DA'),(124,140,3.4,'#FFE3A0'),(116,164,4,'#FFE3A0'),(70,150,2.4,'#FFF6DA')]:
        o.append(f'<path d="M{x},{y-s} Q{x+.6},{y-.6} {x+s},{y} Q{x+.6},{y+.6} {x},{y+s} Q{x-.6},{y+.6} {x-s},{y} Q{x-.6},{y-.6} {x},{y-s} Z" fill="{c}"/>')
    # folds (tapered)
    o.append('<path d="M92,170 C98,174 106,174 112,170 C106,172.6 98,172.6 92,170 Z" fill="#B86E2A"/>')
    o.append('<path d="M128,130 C132,138 133,146 132,152 C131,146 129,138 126,132 Z" fill="#B86E2A"/>')
    o.append('</g>')
    # leg shading + soles
    o.append('<path d="M46,188 C56,184 66,180 78,176 L84,176 C72,182 60,188 50,191 Z" fill="#D98A3A"/>')
    o.append('<path d="M150,188 C140,184 130,180 118,176 L116,176 C128,182 140,188 152,191 Z" fill="#D98A3A"/>')
    S=Layer()
    S.add("M30,178 C26,166 38,160 48,168 C54,174 52,190 42,192 C34,192 31,186 30,178 Z",'cream')
    S.add("M170,178 C174,166 162,160 152,168 C146,174 148,190 158,192 C166,192 169,186 170,178 Z",'cream')
    o.append(S.out())
    o.append('<path d="M46,170 C52,176 51,188 43,191 C47,184 47,176 46,170 Z" fill="#EED9BC"/><path d="M164,168 C170,174 170,186 160,191 C165,184 166,176 164,168 Z" fill="#EED9BC"/>')
    o.append(''.join(f'<circle cx="{x}" cy="{y}" r="1.7" fill="#F09A3A"/>' for x,y in [(38,172),(42,178),(37,183),(44,184),(162,172),(158,178),(163,183),(156,184)]))
    # bear patch
    B=Layer(); B.add("M88,138 a5,5 0 1,1 0.1,0 Z",'bear'); B.add("M112,138 a5,5 0 1,1 0.1,0 Z",'bear'); B.add("M100,140 C110,140 116,146 116,153 C116,161 109,166 100,166 C91,166 84,161 84,153 C84,146 90,140 100,140 Z",'bear')
    o.append(B.out().replace('stroke-width="3.4"','stroke-width="2.2"'))
    o.append('<path d="M108,142 C114,146 116,154 112,162 C110,156 110,148 106,143 Z" fill="#93603E"/>')
    o.append('<ellipse cx="100" cy="157" rx="7" ry="5" fill="#F6E2C6"/><circle cx="94.6" cy="150" r="1.7" fill="#2A1612"/><circle cx="105.4" cy="150" r="1.7" fill="#2A1612"/><ellipse cx="100" cy="155" rx="2" ry="1.4" fill="#2A1612"/><circle cx="95.2" cy="149.4" r=".6" fill="#fff"/><circle cx="106" cy="149.4" r=".6" fill="#fff"/>')
    # collar
    C=Layer(); C.add("M72,110 C82,122 118,122 128,110 C134,114 132,122 126,124 C112,130 88,130 74,124 C68,122 66,114 72,110 Z",'cream'); o.append(C.out())
    o.append('<path d="M74,120 C88,127 112,127 126,120 C112,124 88,124 74,120 Z" fill="#EED9BC"/>')
    # head
    o.append(f'<g transform="translate(100 66) scale(0.98)">{head(expr,uid+"h")}</g>')
    # raised arm with block
    A=Layer()
    A.add("M28,74 L40,66 L64,66 L52,74 Z",'red'); A.add("M52,74 L64,66 L64,90 L52,98 Z",'red'); A.add("M28,74 L52,74 L52,98 L28,98 Z",'red')
    o.append(A.out())
    o.append('<path d="M52,74 L64,66 L64,90 L52,98 Z" fill="#B23436"/><path d="M28,74 L40,66 L64,66 L52,74 Z" fill="#FFB2A2"/>')
    o.append('<path d="M40,78 l2.6,5.4 6,.8 -4.4,4 1.2,6 -5.4,-3 -5.4,3 1.2,-6 -4.4,-4 6,-.8 Z" fill="#FFF6E6"/>')
    o.append('<path d="M31,77 L31,95" stroke="#FFD0C4" stroke-width="1.6" stroke-linecap="round"/>')
    R=Layer()
    R.add("M76,120 C66,118 56,110 50,100 C46,94 52,88 58,92 C64,100 72,106 82,110 Z",'pj')
    R.add("M44,98 C38,94 40,84 48,84 C56,84 60,92 56,99 C53,103 47,102 44,98 Z",'skin')
    o.append(R.out())
    o.append('<path d="M50,98 C54,102 64,108 76,114 L78,118 C66,114 56,108 50,100 Z" fill="#F2AE4A"/>')
    o.append('<path d="M45,92 C46,88 49,86 52,86" stroke="#C9786A" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M54,96 C56,94 57,90 56,88 C58,92 58,96 54,99 Z" fill="#F8C3AE"/>')
    o.append('<path d="M47,103 C51,105 57,104 60,101" stroke="#E5483E" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="53" cy="104.4" r="1.6" fill="#F7CF5A" stroke="#B88A2A" stroke-width=".5"/>')
    return ''.join(o)

def svg(inner,vb="0 0 200 200",w=400,h=400): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'
if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
    open(D+'baokaka.svg','w').write(svg(baokaka_seated('happy')))
    open(D+'baokaka-laugh.svg','w').write(svg(baokaka_seated('laugh','bl')))
    open(D+'baokaka-teary.svg','w').write(svg(baokaka_seated('teary','bt')))

M.update({
 'fur':('#D7975E','#B07040','#8A5232','#6E3A22','#F2C08A'),
 'fcream':('#FFF5E8','#EFD8C0','#DDBD9E','#A8866A','#FFFFFF'),
 'blue':('#4A8BDA','#2F62B0','#234A8A','#1E3E78','#9CC4FF'),
 'gold':('#FFD66A','#E0A83A','#B8822A','#8A5E1E','#FFF2B8'),
})
def cat_eye(cx,cy,flip,expr,uid):
    sx=-1 if flip else 1
    if expr=='happy':
        return f'<path d="M{cx-10},{cy+3} C{cx-6},{cy-7} {cx+6},{cy-7} {cx+10},{cy+3} C{cx+5},{cy-2.6} {cx-5},{cy-2.6} {cx-10},{cy+3} Z" fill="#2E1A12"/>'
    o=[f'<defs><linearGradient id="{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E4A12"/><stop offset=".45" stop-color="#86AE2A"/><stop offset="1" stop-color="#ECEC72"/></linearGradient></defs>']
    E=f"M{cx-11},{cy+1} C{cx-9},{cy-9} {cx+9},{cy-10} {cx+11},{cy-1} C{cx+9},{cy+9} {cx-8},{cy+10} {cx-11},{cy+1} Z"
    o.append(f'<path d="{E}" fill="#FFFDF6"/>')
    o.append(f'<clipPath id="{uid}c"><path d="{E}"/></clipPath><g clip-path="url(#{uid}c)">')
    o.append(f'<circle cx="{cx+0.6*sx}" cy="{cy}" r="9.6" fill="url(#{uid})" stroke="#24380E" stroke-width=".9"/>')
    import math
    o.append(''.join(f'<path d="M{cx+3*math.cos(a)},{cy+5*math.sin(a)} L{cx+8.4*math.cos(a)},{cy+8.4*math.sin(a)}" stroke="#F4F49A" stroke-width=".7" opacity=".5"/>' for a in [0.3,0.8,1.3,1.8,2.3,2.8]))
    o.append(f'<ellipse cx="{cx+0.6*sx}" cy="{cy}" rx="{6 if expr=="surprised" else 2.6}" ry="{6.6 if expr=="surprised" else 7.4}" fill="#120A06"/>')
    o.append(f'<path d="M{cx-12},{cy-12} L{cx+12},{cy-12} L{cx+12},{cy-3} C{cx+5},{cy-7} {cx-5},{cy-7} {cx-12},{cy-3} Z" fill="#1A2A08" opacity=".45"/>')
    if expr=='smug':
        o.append(f'<path d="M{cx-13},{cy-14} L{cx+13},{cy-14} L{cx+13},{cy-1} C{cx+6},{cy-3} {cx-6},{cy-3} {cx-13},{cy-1} Z" fill="#D7975E"/>')
    o.append(f'<path d="M{cx-6},{cy+6} C{cx-2},{cy+9} {cx+4},{cy+9} {cx+7},{cy+5.6} C{cx+3},{cy+7} {cx-2},{cy+7.2} {cx-6},{cy+6} Z" fill="#FBFFB0"/>')
    hy=cy-1 if expr=='smug' else cy-4
    o.append(f'<ellipse cx="{cx-3.6*sx}" cy="{hy}" rx="2.8" ry="3.4" fill="#fff"/><circle cx="{cx+4*sx}" cy="{cy+4}" r="1.5" fill="#fff"/>')
    o.append('</g>')
    top_y=cy-1 if expr=='smug' else cy-9
    if expr=='smug':
        o.append(f'<path d="M{cx-12},{cy+1} C{cx-6},{cy-3.6} {cx+6},{cy-3.6} {cx+12},{cy-0.6} L{cx+12.6},{cy-2.6} C{cx+6},{cy-6} {cx-6},{cy-6} {cx-12.4},{cy-1} Z" fill="#2E1A12"/>')
    else:
        o.append(f'<path d="M{cx-11.4},{cy+1} C{cx-9},{cy-10} {cx+9},{cy-11} {cx+12},{cy-1.4} L{cx+13.6*1},{cy-3} C{cx+9},{cy-13.4} {cx-10},{cy-12.6} {cx-12},{cy+1} Z" fill="#2E1A12" transform="{"" if not flip else f"translate({2*cx} 0) scale(-1 1)"}"/>')
    o.append(f'<path d="M{cx-7},{cy+9.4} C{cx-2},{cy+11} {cx+5},{cy+10.4} {cx+9},{cy+6.6}" stroke="#8A5232" stroke-width=".9" fill="none" stroke-linecap="round"/>')
    return ''.join(o)

def mocha_head(expr='content',uid='mh'):
    L=Layer(); o=[]
    EARL="M-44,-16 C-49,-36 -47,-52 -40,-62 C-29,-57 -19,-49 -13,-40 Z"
    EARR="M13,-40 C21,-50 31,-58 42,-62 C47,-52 47,-36 43,-16 Z"
    HEAD="M0,-44 C26,-44 44,-30 48,-12 L55,-7 L49,-3 L56,3 L48,7 L53,12 L45,13 C38,28 22,38 0,38 C-22,38 -38,28 -45,13 L-53,12 L-48,7 L-56,3 L-49,-3 L-55,-7 L-48,-12 C-44,-30 -26,-44 0,-44 Z"
    L.add(EARL,'fur'); L.add(EARR,'fur'); L.add(HEAD,'fur')
    o.append(L.out())
    o.append('<path d="M-40,-22 C-43,-36 -42,-48 -38,-55 C-31,-51 -25,-45 -21,-39 Z" fill="#F4A6A4"/><path d="M21,-39 C26,-46 32,-51 38,-54 C41,-46 41,-34 39,-22 Z" fill="#E58E92"/>')
    o.append('<path d="M-36,-26 L-37,-40 M-31,-30 L-31,-42 M-27,-34 L-26,-42 M33,-28 L34,-40 M29,-32 L29,-42" stroke="#FFF2E6" stroke-width="1" stroke-linecap="round"/>')
    o.append('<path d="M30,-56 C40,-48 44,-36 43,-18 L47,-18 C48,-38 46,-52 42,-62 Z" fill="#8A5232"/>')
    o.append(f'<clipPath id="{uid}-c"><path d="{HEAD}"/></clipPath><g clip-path="url(#{uid}-c)">')
    o.append('<path d="M22,-42 C44,-30 50,-6 42,14 C34,28 20,36 6,38 L70,50 L70,-50 Z" fill="#B07040"/>')
    o.append('<path d="M40,6 C36,22 26,32 12,37 L70,50 Z" fill="#8A5232"/>')
    for d in ["M1,-45 C4.6,-38 4.6,-32 2,-24 C-0.4,-32 -1.6,-38 1,-45 Z","M-9,-43 C-4.6,-37 -4.6,-31 -8,-24 C-9.6,-31 -10.6,-37 -9,-43 Z","M11,-43 C13.6,-37 13.6,-31 11,-24 C8.6,-31 8.4,-37 11,-43 Z","M-21,-37 C-15.6,-32 -14.6,-26 -17.6,-20 C-19.6,-26 -21.6,-32 -21,-37 Z","M23,-37 C26,-32 26,-26 23,-20 C20.6,-26 20.6,-32 23,-37 Z"]:
        o.append(f'<path d="{d}" fill="#7A4628" stroke="#7A4628" stroke-width="0.8" stroke-linejoin="round"/>')
    for d in ["M-56,-2 C-46,-4 -38,-2 -32,2 C-38,0 -46,0 -56,2 Z","M-54,8 C-46,6 -40,8 -34,11 C-40,10 -46,10 -54,10 Z","M56,-2 C47,-4 40,-2 35,2 C40,0 47,0 56,2 Z","M54,8 C47,6 41,8 36,11 C41,10 47,10 54,10 Z"]:
        o.append(f'<path d="{d}" fill="#7A4628" stroke="#7A4628" stroke-width="1.6" stroke-linejoin="round"/>')
    o.append('<path d="M-44,-14 C-46,-4 -45,6 -42,12" stroke="#F8D2A2" stroke-width="2.6" fill="none" stroke-linecap="round"/>')
    o.append('<path d="M46,-10 C48,0 47,8 44,14" stroke="#CFEAFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    o.append('</g>')
    MZ="M2,4 C14,4 23,12 21,22 C19,30 10,33 2,33 C-6,33 -16,30 -18,22 C-20,12 -10,4 2,4 Z"
    o.append(f'<path d="{MZ}" fill="#FFF5E8"/><path d="M14,8 C22,14 22,26 14,31 C18,24 18,16 14,8 Z" fill="#EFD8C0"/>')
    o.append('<g transform="translate(-19 -5) scale(1.25) translate(19 5)">'+cat_eye(-19,-5,False,expr,uid+'L')+'</g><g transform="translate(21 -5) scale(1.25) translate(-21 5)">'+cat_eye(21,-5,True,expr,uid+'R')+'</g>')
    o.append('<path d="M-2,12 C0,10 6,10 8,12 C7,15 4,17 3,17 C2,17 -1,15 -2,12 Z" fill="#F0848C" stroke="#A84A54" stroke-width=".8" stroke-linejoin="round"/><path d="M0,12 C1.4,11.4 3.4,11.4 4.4,11.8" stroke="#fff" stroke-width=".8" stroke-linecap="round"/>')
    if expr=='surprised':
        o.append('<path d="M3,17 L3,19" stroke="#6E2A2A" stroke-width="1.2"/><ellipse cx="3" cy="23" rx="3.6" ry="4.2" fill="#A83E48" stroke="#6E2A2A" stroke-width="1"/>')
        o.append('<path d="M-40,-40 l-3,-6 M-44,-32 l-6,-2 M44,-40 l3,-6 M48,-32 l6,-2" stroke="#6E2A2A" stroke-width="1.4" stroke-linecap="round"/>')
    elif expr=='happy':
        o.append('<path d="M3,17 L3,20 M-4,20 C-2,25 2,25 3,20 C4,25 8,25 10,20 C8,27 -2,27 -4,20 Z" fill="#A83E48" stroke="#6E2A2A" stroke-width="1" stroke-linejoin="round"/>')
    else:
        o.append('<path d="M3,17 L3,20 M-3,20 C-1,23.4 2,23.4 3,20 C4,23.4 7,23.4 9,20" stroke="#6E2A2A" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    o.append('<ellipse cx="-30" cy="16" rx="7" ry="3.6" fill="#FF8A8A" opacity=".35"/><ellipse cx="34" cy="16" rx="6" ry="3.4" fill="#FF8A8A" opacity=".35"/>')
    o.append('<g stroke="#FFFBF2" stroke-width=".8" stroke-linecap="round"><path d="M-16,18 C-30,16 -44,17 -60,21"/><path d="M-16,22 C-30,22 -44,25 -58,30"/><path d="M20,18 C34,16 48,17 62,20"/><path d="M20,22 C34,22 46,25 60,29"/></g>')
    return ''.join(o)

def mocha_body(expr='content',uid='mc'):
    o=[f'<defs><radialGradient id="{uid}-sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E1430" stop-opacity=".45"/><stop offset="1" stop-color="#1E1430" stop-opacity="0"/></radialGradient></defs>',f'<ellipse cx="102" cy="186" rx="58" ry="9" fill="url(#{uid}-sh)"/>']
    T="M138,178 C164,180 178,166 176,146 C175,132 166,124 170,110 C173,100 180,95 186,97"
    o.append(f'<path d="{T}" stroke="{SIL}" stroke-width="19" fill="none" stroke-linecap="round"/><path d="{T}" stroke="#6E3A22" stroke-width="15.6" fill="none" stroke-linecap="round"/><path d="{T}" stroke="#D7975E" stroke-width="13.4" fill="none" stroke-linecap="round"/>')
    o.append(f'<path d="{T}" stroke="#7A4628" stroke-width="13.4" fill="none" stroke-dasharray="5 9" stroke-dashoffset="-8"/>')
    o.append('<path d="M144,182 C170,182 184,166 181,146 C180,134 172,126 175,112" stroke="#8A5232" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>')
    o.append('<path d="M140,174 C160,175 171,164 170,148 C169,136 162,128 165,114" stroke="#F2C08A" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>')
    L=Layer()
    BODY="M58,182 C50,152 58,126 82,116 C96,110 116,112 130,118 C150,128 156,156 148,182 C126,186 80,186 58,182 Z"
    L.add(BODY,'fur'); o.append(L.out())
    o.append(f'<clipPath id="{uid}-bc"><path d="{BODY}"/></clipPath><g clip-path="url(#{uid}-bc)">')
    o.append('<path d="M116,132 C142,128 156,150 152,190 L116,190 Z" fill="#B07040"/>')
    o.append('<path d="M122,140 C130,138 140,146 144,158" stroke="#F2C08A" stroke-width="2" fill="none" stroke-linecap="round"/>')
    for d in ["M128,124 C134,132 136,140 134,148 C133,140 130,132 125,126 Z","M140,136 C145,144 146,152 144,160 C143,152 141,144 137,138 Z","M62,146 C60,154 60,162 62,170 C63,162 64,154 66,148 Z","M70,132 C66,138 64,146 64,152 C66,146 68,140 72,135 Z"]:
        o.append(f'<path d="{d}" fill="#7A4628"/>')
    o.append('<path d="M60,174 C80,180 120,180 150,172 L150,190 L60,190 Z" fill="#8A5232" opacity=".55"/>')
    o.append('</g>')
    B=Layer()
    BIB="M80,122 L84,128 L88,122 L92,129 L97,122 L101,130 L106,122 L110,129 L115,122 L119,128 L121,124 C124,142 122,162 118,182 L84,182 C79,162 77,142 80,122 Z"
    B.add(BIB,'fcream'); o.append(B.out().replace('stroke-width="3.4"','stroke-width="0"'))
    o.append('<path d="M112,132 C118,148 118,166 114,182 L118,182 C122,164 122,146 116,130 Z" fill="#EFD8C0"/>')
    o.append('<path d="M92,150 C94,156 94,162 92,168 M102,146 C104,152 104,158 102,164" stroke="#DDBD9E" stroke-width="1.1" fill="none" stroke-linecap="round"/>')
    P=Layer(); P.add("M76,183 C76,175 81,172 88,172 C95,172 99,175 99,183 Z",'fcream'); P.add("M101,183 C101,175 106,172 112,172 C119,172 122,175 122,183 Z",'fcream'); o.append(P.out())
    o.append('<path d="M83,176 L83,182 M90,175.4 L90,182 M108,176 L108,182 M115,175.4 L115,182" stroke="#C8A88A" stroke-width="1" stroke-linecap="round"/>')
    # bandana with folds
    BD="M66,112 C82,124 120,124 138,112 L134,122 C124,128 112,130 101,146 C90,130 78,128 68,122 Z"
    K=Layer(); K.add(BD,'blue'); K.add("M66,114 C58,110 52,116 54,124 C60,124 64,121 68,118 Z",'blue'); o.append(K.out())
    o.append('<path d="M101,146 C108,134 118,128 134,122 L136,116 C120,126 108,130 101,146 Z" fill="#2F62B0"/>')
    o.append('<path d="M84,124 C90,130 96,136 101,146 M116,126 C110,132 105,138 101,146" stroke="#1E3E78" stroke-width="1" fill="none"/>')
    o.append(''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="#FFF5E2"/>' for x,y in [(82,122),(94,128),(108,128),(120,122),(101,138)]))
    o.append('<path d="M72,116 C88,124 116,124 132,116" stroke="#9CC4FF" stroke-width="1.4" fill="none" opacity=".8"/>')
    G=Layer(); G.add("M95,148 a6,6 0 1,1 12,0 a6,6 0 1,1 -12,0 Z",'gold'); o.append(G.out().replace('stroke-width="3.4"','stroke-width="2.4"'))
    o.append('<path d="M98,145.6 C99,144 101,143.4 102.6,143.8" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><path d="M101,151 C103,151.4 105,150 106,148" stroke="#B8822A" stroke-width="1" fill="none"/>')
    o.append(f'<g transform="translate(100 70)">{mocha_head(expr,uid+"h")}</g>')
    return ''.join(o)

if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
    open(D+'mocha-cat.svg','w').write(svg(mocha_body('content')))
    open(D+'mocha-smug.svg','w').write(svg(mocha_body('smug','ms')))
    open(D+'mocha-happy.svg','w').write(svg(mocha_body('happy','mp')))

def tube(d,mat,w):
    b,s,dp,ln,lt=M[mat]
    return (f'<path d="{d}" stroke="{SIL}" stroke-width="{w+4.4}" fill="none" stroke-linecap="round"/>', f'<path d="{d}" stroke="{ln}" stroke-width="{w+1.6}" fill="none" stroke-linecap="round"/><path d="{d}" stroke="{b}" stroke-width="{w}" fill="none" stroke-linecap="round"/>')
def baokaka_crawl(expr='happy',uid='bc'):
    o=[f'<defs><radialGradient id="{uid}-sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E1430" stop-opacity=".45"/><stop offset="1" stop-color="#1E1430" stop-opacity="0"/></radialGradient></defs>',f'<ellipse cx="100" cy="182" rx="80" ry="10" fill="url(#{uid}-sh)"/>']
    L=Layer()
    L.add("M30,154 C24,142 34,134 44,140 C52,146 52,160 44,166 C38,170 32,164 30,154 Z",'cream')
    a,b=tube("M110,132 C114,148 114,162 112,172",'pj',13); L.sil.append(a); L.body.append(b.replace('#FFD86A','#F2AE4A'))
    L.add("M38,140 C28,158 36,178.8 58,179.6 C76,180.4 90,176.8 90,165.2 C90,152.8 78,144 62,140 Z",'pj')
    L.add("M20,170 C14,158 24,150 34,156 C42,162 42,178 32,182 C25,184 21,178 20,170 Z",'cream')
    L.add("M34,124 C34,100 60,90 84,98 C104,104 120,112 128,126 C134,140 126,158 110,162 C88,166 60,164 44,156 C34,148 32,136 34,124 Z",'pj')
    o.append(L.out())
    o.append('<path d="M36,170 C40,176 37,182 31,182 C34,178 35,174 36,170 Z" fill="#EED9BC"/>')
    o.append(''.join(f'<circle cx="{x}" cy="{y}" r="1.7" fill="#F09A3A"/>' for x,y in [(26,164),(30,170),(26,175),(32,176)]))
    o.append('<path d="M44,174 C56,178 74,178 86,172 C82,178 70,180 58,179.6 C50,179.4 46,177 44,174 Z" fill="#D98A3A"/>')
    BODY="M34,124 C34,100 60,90 84,98 C104,104 120,112 128,126 C134,140 126,158 110,162 C88,166 60,164 44,156 C34,148 32,136 34,124 Z"
    o.append(f'<clipPath id="{uid}-c"><path d="{BODY}"/></clipPath><g clip-path="url(#{uid}-c)">')
    o.append('<path d="M30,146 C60,166 104,166 132,138 L140,180 L20,180 Z" fill="#F2AE4A"/>')
    o.append('<path d="M100,104 C116,112 126,124 128,136 L140,120 L120,96 Z" fill="#D98A3A"/>')
    o.append('<path d="M44,112 C52,102 66,97 80,99" stroke="#FFF0B0" stroke-width="4" fill="none" stroke-linecap="round"/>')
    for x,y,sz,c in [(58,116,4,'#FFF6DA'),(82,110,3.2,'#FFF6DA'),(52,138,3.4,'#FFF6DA'),(76,132,4,'#FFF6DA'),(96,148,3,'#FFE3A0')]:
        o.append(f'<path d="M{x},{y-sz} Q{x+.6},{y-.6} {x+sz},{y} Q{x+.6},{y+.6} {x},{y+sz} Q{x-.6},{y+.6} {x-sz},{y} Q{x-.6},{y-.6} {x},{y-sz} Z" fill="{c}"/>')
    o.append('<path d="M60,156 C70,160 84,160 94,156 C84,158.6 70,158.6 60,156 Z" fill="#B86E2A"/>')
    o.append('</g>')
    B=Layer(); B.add("M96,136 a4,4 0 1,1 .1,0 Z",'bear'); B.add("M112,136 a4,4 0 1,1 .1,0 Z",'bear'); B.add("M104,138 C111,138 115,143 115,148 C115,154 110,157 104,157 C98,157 93,154 93,148 C93,143 97,138 104,138 Z",'bear')
    o.append(B.out().replace('stroke-width="3.4"','stroke-width="2"'))
    o.append('<ellipse cx="104" cy="151" rx="5" ry="3.6" fill="#F6E2C6"/><circle cx="100.4" cy="146" r="1.3" fill="#2A1612"/><circle cx="107.6" cy="146" r="1.3" fill="#2A1612"/><ellipse cx="104" cy="149.6" rx="1.4" ry="1" fill="#2A1612"/>')
    A=Layer()
    a,b=tube("M124,132 C132,148 134,162 134,172",'pj',14); A.sil.append(a); A.body.append(b)
    A.add("M126,176 C126,170 132,168 137,169 C143,170 145,175 143,179 C140,183 130,183 126,176 Z",'skin')
    o.append(A.out())
    o.append('<path d="M126,140 C130,150 132,158 132,166" stroke="#FFF0B0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>')
    o.append('<path d="M126,170 C130,172.6 138,172.6 142,170" stroke="#E5483E" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="134" cy="172.4" r="1.6" fill="#F7CF5A"/>')
    o.append(f'<g transform="translate(140 86) scale(0.86)">{head(expr,uid+"h")}</g>')
    return ''.join(o)

if __name__=='__main__':
    D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
    open(D+'baokaka-crawl.svg','w').write(svg(baokaka_crawl('happy')))
