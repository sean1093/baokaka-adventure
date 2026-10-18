O='/home/user/baokaka-adventure/docs/art/options/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">'
OPTS=[
 ('a-picture-book-diorama','A','繪本立體 Picture-Book Diorama','Soft-lit vector · warm plum line · AO + rim light · floating dioramas',
  'radial-gradient(circle at 50% 30%,#3B3C7A,#141A44 75%)','#FBF4E6','#2E2235',
  [('#141A44','night'),('#2E2F6E','indigo'),('#FFD05A','pajama'),('#CC8C52','tabby'),('#3D7CC9','MRT blue'),('#FFD9A0','lamp'),('#D8F0FF','rim'),('#3A2838','line')]),
 ('b-paper-cut-night','B','剪紙夜燈 Paper-Cut Night','Flat cut paper · no outlines · stacked drop shadows · 布袋戲 stage framing',
  '#22246A','#F3E6CC','#2A2050',
  [('#22246A','night paper'),('#30338A','indigo'),('#FFF1C9','moon'),('#FFCB4F','butter'),('#E8553D','vermilion'),('#2FA39A','teal'),('#C8925A','kraft'),('#0E0B26','shadow')]),
 ('c-neon-sign-taipei','C','霓虹夜光 Neon-Sign Taipei','Dark city · neon-tube outlines · glow by stacked strokes · signage UI',
  'radial-gradient(circle at 50% 40%,#1E1446,#070920 75%)','#0A0B24','#F2F4FF',
  [('#090A20','void'),('#1C2050','street'),('#FFC94A','warm tube'),('#FF4D8D','pink'),('#4DE3FF','cyan'),('#4DFFB0','green'),('#B57BFF','violet'),('#FFF6D6','core')]),
]
DOPT=('d-anime','D','動漫 Anime Cel','TV-anime cel shading · layered glossy eyes · anime-film night lighting · gold JRPG UI')
for slug,K,name,tag,bg,pagebg,ink,sw in OPTS:  # D has its own sheet_d.py
    html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Option {K} Characters</title>{FONT}<style>
*{{box-sizing:border-box;margin:0}}body{{width:600px;background:{pagebg};color:{ink};font-family:'Chiron GoRound TC',sans-serif;padding:20px}}
h1{{font-size:24px;font-weight:900}}p{{font:500 13px Fredoka;opacity:.75;margin:2px 0 12px}}
.stage{{height:300px;border-radius:24px;background:{bg};display:flex;align-items:flex-end;justify-content:center;gap:0;padding-bottom:18px;position:relative;overflow:hidden}}
.stage img{{display:block}}
.row{{display:flex;gap:10px;margin-top:12px;align-items:center}}
.t{{width:70px;height:70px;border-radius:14px;display:grid;place-items:center}}
.t img{{width:48px;height:48px}}.sil img{{filter:brightness(0)}}
.sw{{display:flex;gap:6px;margin-top:12px}}.sw span{{flex:1;font:600 10px Fredoka;opacity:.85}}.sw span i{{display:block;height:30px;border-radius:8px;margin-bottom:3px;box-shadow:inset 0 0 0 1px rgba(128,128,128,.25)}}
</style></head><body><h1>{K} · {name}</h1><p>{tag}</p>
<div class="stage"><img src="baokaka-crawl.svg" width="290"><img src="mocha-cat.svg" width="210"></div>
<div class="row"><div class="t" style="background:#E9E1D3"><img src="baokaka-crawl.svg"></div><div class="t" style="background:#E9E1D3"><img src="mocha-cat.svg"></div><div class="t" style="background:#141A44"><img src="baokaka-crawl.svg"></div><div class="t" style="background:#141A44"><img src="mocha-cat.svg"></div><div class="t sil" style="background:#fff"><img src="baokaka-crawl.svg"></div><div class="t sil" style="background:#fff"><img src="mocha-cat.svg"></div></div>
<p style="margin-top:6px">48px on light / night / silhouette</p>
<div class="sw">{''.join(f'<span><i style="background:{c}"></i>{n}<br>{c}</span>' for c,n in sw)}</div></body></html>'''
    open(O+slug+'/characters.html','w').write(html)

# comparison sheet
cols=''.join(f'''<div class="col"><img src="{slug}/characters.png" class="c"><div class="pair"><img src="{slug}/iso.png"><img src="{slug}/battle.png"></div></div>''' for slug,K,name,tag,*_ in OPTS+[DOPT])
open(O+'comparison.html','w').write(f'''<!doctype html><html><head><meta charset="utf-8"><title>Art Options Comparison</title>{FONT}<style>
*{{box-sizing:border-box;margin:0}}body{{background:#EFE7D8;font-family:'Chiron GoRound TC',sans-serif;color:#2E2235;padding:28px;width:2560px}}
h1{{font-size:34px;font-weight:900}}.sub{{font:500 16px Fredoka;opacity:.7;margin:4px 0 20px}}
.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}}.col{{background:#FFF9EE;border-radius:28px;padding:18px;box-shadow:0 14px 30px -18px rgba(46,34,53,.4)}}
h2{{font-size:24px;font-weight:900}}.col p{{font:500 14px Fredoka;opacity:.7;margin:2px 0 12px}}
.c{{width:100%;border-radius:16px;display:block}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;align-items:start}}.pair img{{width:100%;border-radius:14px;display:block}}
</style></head><body><h1>寶咖咖抓周大冒險 · Art Direction Options (A–D)</h1><p class="sub">Same comparison set in every style: Baokaka (crawling, pajamas) + Mocha Cat · midnight iso patch with Taipei 101 · battle mock at 士林夜市 03:40</p>
<div class="grid">{cols}</div></body></html>''')
