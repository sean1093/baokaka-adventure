D='/home/user/baokaka-adventure/docs/art/options/d-anime/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">'
def bust(src,label,w=170,l=-39,t=-12):
    return f'<figure><div class="b"><img src="{src}" style="width:{w}px;left:{l}px;top:{t}px"></div><figcaption>{label}</figcaption></figure>'
sw=[('#0B1238','night'),('#26307A','sky'),('#E88E8A','city glow'),('#FFD86A','pajama'),('#F2AE4A','pajama cel'),('#FFE7D6','skin'),('#D7975E','tabby'),('#86AE2A','cat iris'),('#4A8BDA','bandana'),('#E8C77A','UI gold'),('#8AF0E0','101 rim'),('#5A2C34','line')]
html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Option D Characters</title>{FONT}<style>
*{{box-sizing:border-box;margin:0}}body{{width:600px;background:#0A0B24;color:#F4F2FF;font-family:'Chiron GoRound TC',sans-serif;padding:20px}}
h1{{font:900 24px 'Noto Serif TC';letter-spacing:.04em}}p.s{{font:500 13px Fredoka;color:#BFC2EA;margin:2px 0 12px}}
.card{{position:relative;border-radius:10px;border:1px solid #E8C77A;box-shadow:inset 0 0 0 4px #0A0B24,inset 0 0 0 5px rgba(232,199,122,.3);background:radial-gradient(circle at 50% 20%,#3A4A9A,#1A2A6A 45%,#0B1238 85%);overflow:hidden}}
.row{{display:flex;align-items:flex-end;justify-content:center}}
figure{{text-align:center}}.b{{position:relative;width:92px;height:92px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#6A7AD8,#1E2462);box-shadow:0 0 0 1.5px #E8C77A,0 0 0 4px #0A0B24,0 0 0 5px rgba(232,199,122,.4);margin:0 auto}}
.b img{{position:absolute}}figcaption{{font:700 12px 'Chiron GoRound TC';color:#E8C77A;margin-top:6px;letter-spacing:.1em}}
.t{{width:66px;height:66px;border-radius:8px;display:grid;place-items:center}}.t img{{width:48px;height:48px}}.sil img{{filter:brightness(0)}}
.sw{{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:12px}}.sw span{{font:600 10px Fredoka;color:#BFC2EA}}.sw i{{display:block;height:24px;border-radius:4px;margin-bottom:2px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}}
</style></head><body><h1>D · 動漫 Anime Cel</h1><p class="s">TV-anime cel shading · tinted line art (thick contour, thin interior) · layered glossy eyes · clumped hair with angel ring · anime-film night lighting</p>
<div class="card"><div class="row" style="height:300px;padding-bottom:6px"><img src="baokaka.svg" width="280"><img src="mocha-cat.svg" width="250"></div></div>
<div class="row" style="gap:14px;margin-top:14px;justify-content:space-between">
{bust("baokaka.svg","開心")}{bust("baokaka-laugh.svg","大笑")}{bust("baokaka-teary.svg","淚汪汪")}
{bust("mocha-cat.svg","平常",170,-39,-14)}{bust("mocha-smug.svg","得意",170,-39,-14)}
</div>
<div class="row" style="gap:10px;margin-top:14px;justify-content:flex-start;align-items:center">
<div class="card" style="width:170px;height:96px;display:grid;place-items:center"><img src="baokaka-crawl.svg" width="104" style="margin-top:4px"></div>
<div class="t" style="background:#E9E1D3"><img src="baokaka-crawl.svg"></div><div class="t" style="background:#141A44"><img src="baokaka-crawl.svg"></div><div class="t" style="background:#141A44"><img src="mocha-cat.svg"></div><div class="t sil" style="background:#fff"><img src="baokaka-crawl.svg"></div><div class="t sil" style="background:#fff"><img src="mocha-happy.svg"></div></div>
<p class="s" style="margin-top:6px">Map pose (crawl) · 48px on light / night / silhouette</p>
<div class="sw">{''.join(f'<span><i style="background:{c}"></i>{n} {c}</span>' for c,n in sw)}</div></body></html>'''
open(D+'characters.html','w').write(html)
