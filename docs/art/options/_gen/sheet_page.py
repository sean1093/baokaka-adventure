import re, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from anime2 import bk_stand, bk_sit, bk_crawl, mc_sit, mc_walk
A='/home/user/baokaka-adventure/docs/art/options/d-anime/sheet/'
OUT='/home/user/baokaka-adventure/docs/art/options/d-anime/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600&display=swap" rel="stylesheet">'
def inline(name,w,h):
    s=open(A+name+'.svg').read()
    s=re.sub(r' width="[\d.]+" height="[\d.]+"',f' width="{w}" height="{h}"',s,count=1)
    return s
def fig(inner,w,h,vb="0 0 200 200"): return f'<svg viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'
CSS='''*{box-sizing:border-box;margin:0}
body{width:1000px;height:1190px;position:relative;overflow:hidden;font-family:'Chiron GoRound TC',sans-serif;color:#3A2A20;
background:radial-gradient(ellipse at 50% 40%,#FBF3E2 0%,#F3E6CC 60%,#E6D2AE 100%)}
.paper{position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='3' seed='2'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .42 0 0 0 0 .25 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
.a{position:absolute}
h1{position:absolute;left:36px;top:24px;font:900 44px 'Noto Serif TC';letter-spacing:.08em}
h1 small{font:700 18px 'Noto Serif TC';letter-spacing:.2em;margin-left:12px;color:#7A5A3E}
.sub{position:absolute;left:38px;top:84px;font:700 14px 'Chiron GoRound TC';color:#7A5A3E;letter-spacing:.06em}
h2{position:absolute;font:900 24px 'Noto Serif TC';letter-spacing:.14em;border-bottom:2px solid #3A2A20;padding-bottom:2px}
.lb{position:absolute;font:700 14px 'Chiron GoRound TC';line-height:1.35;text-align:center}
.lb i{display:block;font:500 11.5px 'Chiron GoRound TC';font-style:normal;color:#7A5A3E}
.frame{position:absolute;border:2px solid #3A2A20;box-shadow:3px 3px 0 rgba(58,42,32,.18);overflow:hidden;background:#fff}
.box{position:absolute;border:1.6px solid #3A2A20;border-radius:6px;background:rgba(255,250,238,.55)}
.notes{position:absolute;font:500 13px/1.6 'Chiron GoRound TC'}
.notes b{font:900 15px 'Noto Serif TC';letter-spacing:.1em;display:block;margin-bottom:4px}
.pal{position:absolute;display:flex;gap:6px}.pal span{width:64px;font:600 10px Fredoka;color:#5A4A3A;text-align:center}.pal span i{display:block;height:22px;border-radius:4px;border:1px solid rgba(58,42,32,.35);margin-bottom:2px}
.ruler{position:absolute;width:14px;border-left:2px solid #3A2A20}.ruler div{position:absolute;left:-6px;width:12px;border-top:2px solid #3A2A20}
.ruler span{position:absolute;left:10px;font:700 11px Fredoka;color:#7A5A3E;white-space:nowrap}
'''
def arrows(paths):
    o='<svg class="a" style="left:0;top:0;pointer-events:none" width="1000" height="1190" viewBox="0 0 1000 1190"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#3A2A20"/></marker></defs>'
    o+=''.join(f'<path d="{d}" stroke="#3A2A20" stroke-width="2.2" fill="none" stroke-linecap="round" marker-end="url(#ah)"/>' for d in paths)
    return o+'</svg>'
def pal(items,x,y): return f'<div class="pal" style="left:{x}px;top:{y}px">'+''.join(f'<span><i style="background:{c}"></i>{n}<br>{c}</span>' for c,n in items)+'</div>'
def page(title,body):
    return f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>{title}</title>{FONT}<style>{CSS}</style></head><body><div class="paper"></div>{body}</body></html>'

def baokaka():
    b=[]
    b.append('<h1>寶咖咖<small>角色設定・BAOKAKA</small></h1><div class="sub">明天就滿一歲｜動漫化 3.4 頭身（真人約 4 頭身）｜主角・全隊前排｜還不會走路，用爬的</div>')
    # height ruler: head = 54*2.1 = 113px
    b.append('<div class="ruler" style="left:300px;top:150px;height:383px">'+''.join(f'<div style="top:{int(i*113)}px"></div><span style="top:{int(i*113)-7}px">{i}</span>' for i in range(4))+'<div style="top:383px"></div><span style="top:368px;left:12px">3.4 頭身</span></div>')
    b.append(f'<div class="a" style="left:300px;top:112px">{fig(bk_stand("happy","sp1"),420,420)}</div>')
    b.append('<div class="lb" style="left:388px;top:528px;width:240px">正面全身・學步（終章第一次站起來）</div>')
    b.append('<h2 style="left:30px;top:118px">服裝分層</h2>')
    b.append(f'<div class="a" style="left:34px;top:160px">{inline("pajama",200,311)}</div><div class="lb" style="left:20px;top:470px;width:230px">星星連身包腳睡衣<i>刷毛布・前襟暗扣・腳底止滑點</i></div>')
    b.append(f'<div class="a" style="left:28px;top:540px">{inline("bib",124,110)}</div><div class="lb" style="left:14px;top:650px;width:150px">口水巾<i>阿嬤給的初期裝備（防禦+3）</i></div>')
    b.append(f'<div class="a" style="left:168px;top:556px">{inline("bracelet",92,64)}</div><div class="lb" style="left:150px;top:622px;width:130px">紅線手環<i>右手腕・金珠一顆</i></div>')
    b.append(f'<div class="a" style="left:40px;top:700px">{inline("lock",110,105)}</div><div class="lb" style="left:150px;top:722px;width:130px">金鎖片<i>阿嬤的禮物<br>（劇情道具，終章才戴上）</i></div>')
    b.append('<h2 style="left:744px;top:110px">表情集</h2>')
    for i,(e,n) in enumerate([('happy','開心（預設）'),('laugh','大笑'),('teary','淚汪汪'),('surprised','驚訝')]):
        x=730+(i%2)*130; y=150+(i//2)*150
        b.append(f'<div class="a" style="left:{x}px;top:{y}px">{inline("head-"+e,122,126)}</div><div class="lb" style="left:{x-6}px;top:{y+122}px;width:134px">{n}</div>')
    b.append('<h2 style="left:744px;top:460px">材質特寫</h2>')
    for i,(k,n) in enumerate([('fleece','睡衣刷毛'),('felt','小熊不織布'),('cord','紅線編繩'),('gold','金鎖片 金屬')]):
        x=730+(i%2)*134; y=502+(i//2)*112
        b.append(f'<div class="frame" style="left:{x}px;top:{y}px;width:118px;height:76px">{inline("sw-"+k,118,76)}</div><div class="lb" style="left:{x-6}px;top:{y+80}px;width:130px">{n}</div>')
    b.append('<div class="box" style="left:300px;top:566px;width:420px;height:262px"></div><h2 style="left:316px;top:552px;background:#F6ECD8;padding:0 8px;border:0">其他姿勢</h2>')
    b.append(f'<div class="a" style="left:306px;top:592px">{fig(bk_sit("happy","sp2"),210,210)}</div><div class="a" style="left:506px;top:600px">{fig(bk_crawl("happy","sp3"),210,210)}</div>')
    b.append('<div class="lb" style="left:316px;top:792px;width:190px">戰鬥：坐姿・舉起積木</div><div class="lb" style="left:516px;top:792px;width:200px">地圖：爬行（手掌與膝蓋著地）</div>')
    b.append('<h2 style="left:300px;top:858px">關聯物品</h2>')
    props=[('blocks',150,125,'積木','武器・「丟積木」'),('ticket',150,100,'月亮票','月亮線車票（第3章）'),('stampbook',104,108,'集章本','十站紀念章'),('redenv',70,99,'阿嬤的紅包','第一筆銅板')]
    x=300
    for n,w,h,t,s in props:
        b.append(f'<div class="a" style="left:{x}px;top:{1010-h}px">{inline(n,w,h)}</div><div class="lb" style="left:{x-10}px;top:1018px;width:{w+20}px">{t}<i>{s}</i></div>'); x+=w+40
    b.append('''<div class="notes" style="left:34px;top:850px;width:236px"><b>設計重點</b>
・真人一歲比例再動漫化：大頭、短脖子、溜肩、圓肚子<br>・四肢肉肉但有關節：手肘、手腕褶、膝蓋、腳踝<br>・手：短胖四指＋拇指，一筆輪廓<br>・包腳睡衣要看得出腳跟、腳背、腳趾<br>・線：外框粗 3.2、內線細 1.2，線色取自固有色<br>・陰影：硬邊二階賽璐璐，光源左上<br>・地圖用 60px 簡化版：省略星星與手指縫</div>''')
    b.append('<div class="lb" style="left:740px;top:740px;width:236px;text-align:left;font-size:13px;line-height:1.6"><b style="font:900 15px Noto Serif TC;letter-spacing:.1em">口頭禪</b><br>「要！」「不要！」「抱抱」「ㄋㄟㄋㄟ」<br>勝利時：「哇！」</div>')
    b.append(pal([('#FFD86A','睡衣'),('#EFA846','睡衣影'),('#FFE7D6','膚色'),('#F6C0AA','膚影'),('#6A4234','髮色'),('#B98058','小熊'),('#E5483E','紅線'),('#F2C24A','金'),('#5A2C34','線稿')],300,1100))
    b.append(arrows(['M236,300 C300,280 360,300 418,330','M214,552 C228,480 320,410 424,370','M604,326 C660,340 680,520 724,540']))
    open(OUT+'sheet-baokaka.html','w').write(page('Baokaka Design Sheet',''.join(b)))

def mocha():
    b=[]
    b.append('<h1>摩卡貓<small>角色設定・MOCHA</small></h1><div class="sub">七歲棕色虎斑公貓｜寶咖咖的「大哥」｜快攻＋單體治療｜口頭禪「……好啦。」</div>')
    b.append(f'<div class="a" style="left:290px;top:104px">{fig(mc_sit("content","ms1"),430,430)}</div>')
    b.append('<div class="lb" style="left:296px;top:516px;width:110px;text-align:left">正面坐姿<i>戰鬥待機</i></div>')
    b.append('<h2 style="left:30px;top:118px">配件分解</h2>')
    b.append(f'<div class="a" style="left:28px;top:166px">{inline("bandana",240,120)}</div><div class="lb" style="left:20px;top:290px;width:250px">捷運藍點點領巾<i>棉布・左側打結・尾端兩角</i></div>')
    b.append(f'<div class="a" style="left:110px;top:350px">{inline("tag",72,86)}</div><div class="lb" style="left:40px;top:440px;width:210px">小魚金牌<i>掛在領巾尖端（不是鈴鐺，安靜派）</i></div>')
    b.append('<div class="notes" style="left:34px;top:500px;width:236px"><b>結構重點</b>・肩胛骨在背上突起<br>・前腳直，有手腕，圓腳掌＋三道趾縫<br>・坐姿：大腿肉團在後，後腳掌收在前腳旁<br>・尾巴從脊椎末端長出，繞到前面<br>・走路：趾行，後腳有「腳跟」（跗關節）向後折<br>・白襪子：四腳皆白，胸口奶油色圍兜毛</div>')
    b.append('<h2 style="left:744px;top:110px">表情集</h2>')
    for i,(e,n) in enumerate([('content','平常'),('smug','得意（翻譯時）'),('happy','開心'),('surprised','驚訝')]):
        x=730+(i%2)*130; y=152+(i//2)*140
        b.append(f'<div class="a" style="left:{x}px;top:{y}px">{inline("mhead-"+e,124,110)}</div><div class="lb" style="left:{x-6}px;top:{y+110}px;width:136px">{n}</div>')
    b.append('<h2 style="left:744px;top:440px">毛色特寫</h2>')
    for i,(k,n) in enumerate([('tabbyM','額頭 M 字'),('stripes','鯖魚紋＋白肚'),('ring','環紋尾巴'),('beans','粉紅肉球')]):
        x=730+(i%2)*134; y=482+(i//2)*112
        b.append(f'<div class="frame" style="left:{x}px;top:{y}px;width:118px;height:76px">{inline("sw-"+k,118,76)}</div><div class="lb" style="left:{x-6}px;top:{y+80}px;width:130px">{n}</div>')
    b.append('<div class="box" style="left:290px;top:566px;width:440px;height:262px"></div><h2 style="left:306px;top:552px;background:#F6ECD8;padding:0 8px;border:0">走路（地圖用）</h2>')
    b.append(f'<div class="a" style="left:300px;top:578px">{fig(mc_walk("content","ms2"),250,250)}</div>')
    b.append(f'<div class="a" style="left:548px;top:610px">{fig(mc_sit("happy","ms3"),170,170)}</div>')
    b.append('<div class="lb" style="left:306px;top:796px;width:240px">四分之三側面・對側腳同步</div><div class="lb" style="left:548px;top:796px;width:170px">開心坐姿</div>')
    b.append('<h2 style="left:300px;top:858px">關聯物品</h2>')
    props=[('fish',140,73,'小魚乾','最愛的零食'),('tray',190,124,'抓周盤','他「顧規暝」的那一盤'),('catnip',72,100,'貓草','才藝「貓草狂歡」')]
    x=300
    for n,w,h,t,s in props:
        b.append(f'<div class="a" style="left:{x}px;top:{1010-h}px">{inline(n,w,h)}</div><div class="lb" style="left:{x-10}px;top:1018px;width:{w+20}px">{t}<i>{s}</i></div>'); x+=w+44
    b.append('<div class="lb" style="left:740px;top:740px;width:236px;text-align:left;font-size:13px;line-height:1.6"><b style="font:900 15px Noto Serif TC;letter-spacing:.1em">個性</b><br>嘴硬心軟、討厭水、會「翻譯」寶咖咖的一個字。尾巴說的比嘴巴誠實。</div>')
    b.append(pal([('#D7975E','毛色'),('#AE6C3E','毛影'),('#7A4628','條紋'),('#FFF5E8','白毛'),('#86AE2A','眼睛'),('#4A8BDA','領巾'),('#FFD66A','金牌'),('#F4A0A8','肉球'),('#5A2C34','線稿')],300,1100))
    b.append(arrows(['M268,226 C320,226 380,268 440,300','M182,392 C260,400 400,360 488,352','M572,252 C650,280 670,500 724,520','M604,500 C650,560 690,640 724,632']))
    open(OUT+'sheet-mocha.html','w').write(page('Mocha Design Sheet',''.join(b)))
baokaka(); mocha()
