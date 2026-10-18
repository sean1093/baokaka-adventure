import sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from anime2 import bk_stand, bk_sit, bk_crawl, mc_sit, mc_walk
OUT='/home/user/baokaka-adventure/docs/art/options/d-anime/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@700&family=Noto+Serif+TC:wght@900&display=swap" rel="stylesheet">'
poses=[('寶咖咖・學步站姿','終章第一次站起來；寬腳距、手張開保持平衡、膝蓋微彎',bk_stand),('寶咖咖・坐姿（戰鬥）','屁股著地、背微圓、一腳伸直一腳屈膝、手抓積木',bk_sit),('寶咖咖・爬行（地圖）','手臂直撐在肩下、大腿垂直在髖下、背平、抬頭向前',bk_crawl),
       ('摩卡貓・坐姿','肩胛突起、前腳直立有手腕、大腿肉團在後、後腳掌收在前',mc_sit),('摩卡貓・走路（地圖）','趾行；後腳跗關節向後折、對側腳同步、尾巴從脊椎延伸',mc_walk)]
cells=''
for i,(t,n,fn) in enumerate(poses):
    a=f'<svg viewBox="0 0 200 200" width="250" height="250">{fn(uid="an%d"%i)}</svg>'
    b=f'<svg viewBox="0 0 200 200" width="250" height="250"><g opacity=".35">{fn(uid="ab%d"%i)}</g>{fn(uid="ac%d"%i,skel=True).split("<line",1)[0][-0:] if False else ""}</svg>'
    sk=fn(uid="ak%d"%i,skel=True); skel=sk[sk.index('<line x1'):]
    b=f'<svg viewBox="0 0 200 200" width="250" height="250"><g opacity=".3">{fn(uid="ab%d"%i)}</g>{skel}</svg>'
    s1=f'<svg viewBox="0 0 200 200" width="70" height="70" style="filter:brightness(0)">{fn(uid="as%d"%i)}</svg>'
    s2=f'<svg viewBox="0 0 200 200" width="60" height="60">{fn(uid="am%d"%i)}</svg>'
    cells+=f'<div class="c"><h3>{t}</h3><p>{n}</p><div class="r">{a}{b}<div class="sm">{s1}<span>剪影</span>{s2}<span>地圖 60px</span></div></div></div>'
html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Anatomy Sheet</title>{FONT}<style>
*{{box-sizing:border-box;margin:0}}body{{width:1240px;padding:28px;font-family:'Chiron GoRound TC';color:#3A2A20;background:radial-gradient(ellipse at 50% 30%,#FBF3E2,#EBDBBC)}}
h1{{font:900 34px 'Noto Serif TC';letter-spacing:.1em}}.s{{font:700 14px 'Chiron GoRound TC';color:#7A5A3E;margin:4px 0 18px}}
.g{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}.c{{border:1.6px solid #3A2A20;border-radius:8px;padding:12px 14px;background:rgba(255,250,238,.6)}}
h3{{font:900 19px 'Noto Serif TC';letter-spacing:.08em}}.c p{{font:700 12.5px 'Chiron GoRound TC';color:#7A5A3E;margin:2px 0 4px}}
.r{{display:flex;align-items:center;gap:6px}}.sm{{display:flex;flex-direction:column;align-items:center;gap:2px;font:700 11px 'Chiron GoRound TC';color:#7A5A3E}}
</style></head><body><h1>D 動漫風・人體結構表</h1><p class="s">流程：動態線 → 骨架（脊椎・肩帶・骨盆・肘膝）→ 體積 → 衣服 → 賽璐璐陰影 → 線稿。左：完成圖｜右：骨架檢查｜剪影與 60px 地圖尺寸檢查</p>
<div class="g">{cells}</div></body></html>'''
open(OUT+'anatomy-sheet.html','w').write(html)
