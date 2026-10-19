"""sheets.py - builds the v2 character design sheets (HTML -> PNG via
../tools/render.mjs).  Format follows the owner's reference sheets:
parchment, full-body front view, 4-expression set, outfit breakdown with
arrows, material close-ups, props, Chinese annotations, palette.

usage: python3 sheets.py <out_dir>
"""
import sys
from geom import *
import baokaka as H
import baokaka_body as B
import mocha as Mo
import props as Pr

W, HT = 1000, 1290
INK = "#3A2418"
FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;900&'
         'family=Noto+Sans+TC:wght@500;700&family=Fredoka:wght@500;600&display=swap" rel="stylesheet">')
CSS = f"""*{{box-sizing:border-box;margin:0}}
body{{width:{W}px;height:{HT}px;position:relative;overflow:hidden;color:{INK};
font-family:'Noto Sans TC','WenQuanYi Zen Hei',sans-serif;
background:radial-gradient(ellipse at 45% 38%,#FBF4E4 0%,#F4E8D0 55%,#E7D4B2 100%)}}
.paper{{position:absolute;inset:0;opacity:.32;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.6' numOctaves='2' seed='3'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .43 0 0 0 0 .27 0 0 0 .45 0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")}}
.stain{{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(170,130,80,.10),rgba(170,130,80,0) 70%)}}
.a{{position:absolute}}
h1{{position:absolute;left:40px;top:26px;font:900 46px 'Noto Serif TC',serif;letter-spacing:.06em}}
h1 small{{font:600 18px 'Noto Serif TC',serif;letter-spacing:.24em;margin-left:14px;color:#7A5A3E}}
.sub{{position:absolute;left:42px;top:90px;font:500 13.5px 'Noto Sans TC';color:#6E5038;letter-spacing:.04em}}
h2{{position:absolute;font:900 23px 'Noto Serif TC',serif;letter-spacing:.16em;padding-bottom:3px;border-bottom:2px solid {INK}}}
.lb{{position:absolute;font:700 13.5px 'Noto Sans TC';line-height:1.35;text-align:center}}
.lb i{{display:block;font:500 11px 'Noto Sans TC';font-style:normal;color:#7A5A3E}}
.frame{{position:absolute;border:2px solid {INK};box-shadow:3px 3px 0 rgba(58,36,24,.18);overflow:hidden;background:#fff}}
.notes{{position:absolute;font:500 12.5px/1.65 'Noto Sans TC'}}
.notes b{{font:900 15px 'Noto Serif TC';letter-spacing:.12em;display:block;margin-bottom:3px}}
.pal{{position:absolute;display:flex;gap:6px}}.pal span{{width:62px;font:600 10px Fredoka;color:#5A4A3A;text-align:center}}
.pal span i{{display:block;height:20px;border-radius:4px;border:1px solid rgba(58,36,24,.35);margin-bottom:2px}}
.ruler{{position:absolute;width:14px;border-left:1.6px solid {INK}}}.ruler div{{position:absolute;left:-6px;width:12px;border-top:1.6px solid {INK}}}
.ruler span{{position:absolute;left:10px;font:600 11px Fredoka;color:#7A5A3E;white-space:nowrap}}
.box{{position:absolute;border:1.5px solid {INK};border-radius:8px;background:rgba(255,251,240,.5)}}
"""


def svgdoc(fn, vb, w, h, *a, **k):
    d = Doc(0, 0, vb)
    d.add(fn(d, *a, **k))
    return d.svg(f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"')


def at(x, y, inner, z=1):
    return f'<div class="a" style="left:{x}px;top:{y}px;z-index:{z}">{inner}</div>'


def arrows(paths):
    o = f'<svg class="a" style="left:0;top:0;z-index:5;pointer-events:none" width="{W}" height="{HT}" viewBox="0 0 {W} {HT}">'
    for pts in paths:
        o += P(taper(pts, 2.6, .05, .02), INK)
        (x1, y1), (x2, y2) = pts[-2], pts[-1]
        a = math.atan2(y2 - y1, x2 - x1)
        L = 13
        h1 = (x2 - L * math.cos(a - .42), y2 - L * math.sin(a - .42))
        h2 = (x2 - L * math.cos(a + .42), y2 - L * math.sin(a + .42))
        mid = (x2 - L * .6 * math.cos(a), y2 - L * .6 * math.sin(a))
        o += P(poly([(x2, y2), h1, mid, h2]), INK)
    return o + "</svg>"


def pal(items, x, y):
    return f'<div class="pal" style="left:{x}px;top:{y}px">' + "".join(
        f'<span><i style="background:{c}"></i>{n}<br>{c}</span>' for c, n in items) + "</div>"


def page(title, body):
    stains = "".join(f'<div class="stain" style="left:{x}px;top:{y}px;width:{r}px;height:{r}px"></div>'
                     for x, y, r in [(700, 900, 380), (-80, 300, 300), (380, -120, 340), (820, 120, 260)])
    return (f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>{title}</title>{FONTS}'
            f'<style>{CSS}</style></head><body><div class="paper"></div>{stains}{body}</body></html>')


def swatch(fn, w, h):
    def wrapped(d):
        return clipped(d, "M0,0 L300,0 L300,220 L0,220Z", fn(d))
    return svgdoc(wrapped, "0 0 300 220", w, h)


def frame(x, y, w, h, svg):
    return f'<div class="frame" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{svg}</div>'


# ======================================================================
def sheet_baokaka():
    b = []
    b.append('<h1>寶咖咖<small>角色設定・BAOKAKA</small></h1>'
             '<div class="sub">明天就滿一歲的台灣男寶寶｜約 3.3 頭身（真人比例）｜主角・全隊前排｜還不太會走，第一次站起來的樣子</div>')
    # ---- centre: full body
    fig = svgdoc(lambda d: B.figure(d, "happy"), "-140 -60 680 1420", 380, 794)
    b.append(at(308, 112, fig, 2))
    hd = 794 / 1420 * 410   # one head in px
    top = 112 + (60 - 4) * 794 / 1420
    b.append(f'<div class="ruler" style="left:302px;top:{top:.0f}px;height:{hd*3.27:.0f}px">' +
             "".join(f'<div style="top:{hd*i:.0f}px"></div><span style="top:{hd*i-7:.0f}px">{i}</span>' for i in range(4)) +
             f'<div style="top:{hd*3.27:.0f}px"></div><span style="top:{hd*3.27-16:.0f}px;left:12px">3.3 頭身</span></div>')
    b.append('<div class="lb" style="left:380px;top:906px;width:240px">正面全身・學步站姿<i>雙手張開保持平衡（終章「勇敢的第一步」）</i></div>')
    # ---- left: outfit layers
    b.append('<h2 style="left:36px;top:128px">服裝分層</h2>')
    flat = svgdoc(lambda d: B.figure(d, flat=True), "-110 380 620 990", 230, 367)
    b.append(at(30, 170, flat))
    b.append('<div class="lb" style="left:24px;top:540px;width:250px">星星連身包腳睡衣<i>刷毛布・米白羅紋領口與袖口・前襟暗扣<br>腳底米色止滑點・胸前小熊不織布貼</i></div>')
    b.append(at(26, 600, svgdoc(Pr.bib, "30 20 340 240", 130, 92)))
    b.append('<div class="lb" style="left:20px;top:694px;width:140px">口水巾<i>阿嬤給的初期裝備</i></div>')
    b.append(at(170, 604, svgdoc(Pr.bracelet_big, "40 110 320 200", 112, 70)))
    b.append('<div class="lb" style="left:158px;top:682px;width:140px">紅線手環<i>右手腕・金珠一顆（保平安）</i></div>')
    b.append(at(40, 742, svgdoc(Pr.gold_lock, "60 10 280 270", 112, 108)))
    b.append('<div class="lb" style="left:156px;top:770px;width:140px">金鎖片<i>阿嬤的禮物<br>劇情道具・終章才戴上</i></div>')
    # ---- right: expressions
    b.append('<h2 style="left:666px;top:128px">表情集</h2>')
    for i, (e, n, t, tl) in enumerate([("happy", "開心（預設）", .3, -4), ("laugh", "大笑", -.28, 5),
                                       ("teary", "淚汪汪", .22, 6), ("surprised", "驚訝", -.32, -3)]):
        x = 654 + (i % 2) * 168
        y = 170 + (i // 2) * 184
        b.append(at(x, y, svgdoc(lambda d, e=e, t=t, tl=tl: H.head(d, e, t, tl), "-14 -44 428 460", 152, 163)))
        b.append(f'<div class="lb" style="left:{x}px;top:{y+160}px;width:152px">{n}</div>')
    # ---- right: material close-ups
    b.append('<h2 style="left:666px;top:556px">材質特寫</h2>')
    for i, (fn, n, sub) in enumerate([(Pr.sw_fleece, "刷毛睡衣", "柔霧暖黃＋淡色星星印花"), (Pr.sw_rib, "羅紋領口・袖口", "米白針織直紋"),
                                      (Pr.sw_felt, "小熊不織布貼", "毛氈顆粒＋手縫線"), (Pr.sw_cord, "紅線編繩", "斜紋麻花編")]):
        x = 660 + (i % 2) * 166
        y = 600 + (i // 2) * 150
        b.append(frame(x, y, 148, 100, swatch(fn, 148, 104)))
        b.append(f'<div class="lb" style="left:{x-6}px;top:{y+104}px;width:160px">{n}<i>{sub}</i></div>')
    # ---- bottom: props
    b.append('<h2 style="left:36px;top:944px">關聯物品</h2>')
    b.append(at(40, 986, svgdoc(Pr.blocks, "20 0 380 290", 190, 145)))
    b.append('<div class="lb" style="left:50px;top:1132px;width:170px">玩具積木<i>武器・「丟積木」</i></div>')
    b.append(at(250, 990, svgdoc(Pr.stamp_book, "80 40 260 270", 130, 135)))
    b.append('<div class="lb" style="left:244px;top:1132px;width:140px">集章本<i>捷運十站紀念章</i></div>')
    b.append(at(400, 1000, svgdoc(Pr.ticket, "30 70 340 200", 170, 100)))
    b.append('<div class="lb" style="left:400px;top:1132px;width:170px">月亮票<i>月亮線車票（第 3 章）</i></div>')
    # notes
    b.append('<div class="notes" style="left:604px;top:948px;width:370px"><b>設計重點</b>'
             '・真人一歲比例：頭大、幾乎沒有脖子、圓肚子、短腿微 O 型<br>'
             '・線條：細而有收尖，背光側加粗；顏色取各材質的深色（髮＝深咖啡、膚＝紅棕）<br>'
             '・頭髮：大塊髮束＋缺口分線，頭頂「天使環」鋸齒高光，呆毛一根<br>'
             '・眼睛：多層虹膜（上暗下亮）、眼瞼陰影、兩顆反光、睫毛只在上緣加重<br>'
             '・布料：底色＋賽璐璐陰影＋柔和環境漸層，皺褶在肘、膝、腳踝堆積<br>'
             '・光源固定左上，影子落在右下</div>')
    b.append(pal([("#FFD660", "睡衣"), ("#F0AE48", "睡衣影"), ("#FFE8DA", "膚色"), ("#F3BCA6", "膚影"), ("#6B4231", "髮色"),
                  ("#B4866A", "髮高光"), ("#7E4421", "瞳色"), ("#D9372E", "紅線"), ("#8C5320", "布線稿")], 36, 1200))
    b.append(arrows([
        [(246, 360), (330, 352), (440, 420)],                 # pajama flat -> body
        [(250, 628), (300, 610), (360, 530)],                 # bracelet -> wrist (viewer left)
        [(656, 640), (600, 610), (548, 560)],                 # fleece -> torso
        [(900, 596), (800, 560), (648, 516)],                 # rib -> cuff
    ]))
    return page("Baokaka v2 sheet", "".join(b))


def sheet_mocha():
    b = []
    b.append('<h1>摩卡貓<small>角色設定・MOCHA</small></h1>'
             '<div class="sub">七歲棕色鯖魚紋虎斑公貓｜寶咖咖的「大哥」｜快攻＋單體治療｜口頭禪「……好啦。」</div>')
    fig = svgdoc(lambda d: Mo.figure(d, "content"), "110 20 380 690", 400, 726)
    b.append(at(300, 130, fig, 2))
    b.append('<div class="lb" style="left:390px;top:866px;width:240px">正面坐姿<i>戰鬥待機・尾巴繞到前腳前面</i></div>')
    b.append('<h2 style="left:36px;top:128px">配件分解</h2>')
    b.append(at(30, 176, svgdoc(Pr.bandana_flat, "20 30 360 220", 250, 153)))
    b.append('<div class="lb" style="left:30px;top:334px;width:250px">捷運藍點點領巾<i>棉布・在左側打結・尖端掛名牌</i></div>')
    b.append(at(80, 392, svgdoc(Pr.fish_tag, "100 20 200 220", 130, 143)))
    b.append('<div class="lb" style="left:50px;top:538px;width:190px">小魚金牌<i>掛在領巾尖端（不是鈴鐺，安靜派）</i></div>')
    b.append('<div class="notes" style="left:36px;top:600px;width:250px"><b>結構重點</b>'
             '・真貓骨架：耳朵大、臉頰有公貓的腮幫毛<br>'
             '・眼睛杏仁形、直立瞳孔、眼角延伸出淚線紋<br>'
             '・坐姿：前腳直立靠攏，大腿肉團在兩側後方，後腳掌從前面露出<br>'
             '・白襪四腳、胸口奶油色圍兜毛（毛尖鋸齒邊）<br>'
             '・額頭 M 字、臉頰兩道眼線紋、前腳橫紋、尾巴環紋＋深色尾尖<br>'
             '・尾巴語言：上翹捲＝開心，炸毛＝驚訝，低掃＝不爽</div>')
    b.append('<h2 style="left:666px;top:128px">表情集</h2>')
    for i, (e, n, t, tl) in enumerate([("content", "平常", .12, 0), ("smug", "得意（翻譯時）", .3, -5),
                                       ("happy", "開心", -.25, 6), ("surprised", "驚訝", .18, 3)]):
        x = 654 + (i % 2) * 168
        y = 172 + (i // 2) * 176
        b.append(at(x, y, svgdoc(lambda d, e=e, t=t, tl=tl: Mo.head(d, e, t, tl), "140 20 320 300", 152, 142)))
        b.append(f'<div class="lb" style="left:{x}px;top:{y+148}px;width:152px">{n}</div>')
    b.append('<h2 style="left:666px;top:556px">毛色特寫</h2>')
    for i, (fn, n, sub) in enumerate([(Pr.sw_mfur, "額頭 M 字", "虎斑的招牌"), (Pr.sw_stripes, "鯖魚紋＋奶油白肚", "細直條紋、毛流向下"),
                                      (Pr.sw_tail, "環紋尾巴", "深色尾尖"), (Pr.sw_beans, "粉紅肉球", "白襪腳掌")]):
        x = 660 + (i % 2) * 166
        y = 600 + (i // 2) * 150
        b.append(frame(x, y, 148, 100, swatch(fn, 148, 104)))
        b.append(f'<div class="lb" style="left:{x-6}px;top:{y+104}px;width:160px">{n}<i>{sub}</i></div>')
    b.append('<h2 style="left:36px;top:944px">關聯物品</h2>')
    b.append(at(40, 1000, svgdoc(Pr.fish_snack, "30 80 340 140", 190, 80)))
    b.append('<div class="lb" style="left:50px;top:1100px;width:180px">小魚乾<i>最愛的零食・回復道具</i></div>')
    b.append(at(250, 978, svgdoc(Pr.catnip, "100 20 200 280", 90, 126)))
    b.append('<div class="lb" style="left:225px;top:1112px;width:140px">貓草<i>才藝「貓草狂歡」</i></div>')
    b.append(at(380, 1004, svgdoc(Pr.bowl, "50 90 300 150", 180, 90)))
    b.append('<div class="lb" style="left:384px;top:1100px;width:170px">藍點點飯碗<i>和領巾同款</i></div>')
    b.append('<div class="notes" style="left:604px;top:948px;width:370px"><b>個性</b>'
             '嘴硬心軟、討厭水，會「翻譯」寶咖咖的一個字。尾巴說的比嘴巴誠實。<br><br><b>畫法</b>'
             '・毛的輪廓線在臉頰、胸口、後腿用短鋸齒表現毛簇<br>'
             '・條紋是有厚度的筆刷形（中粗兩端尖），跟著身體曲面彎<br>'
             '・底色＋賽璐璐陰影（右下）＋柔和漸層；眼睛下緣打亮</div>')
    b.append(pal([("#C99566", "毛色"), ("#9E6A43", "毛影"), ("#5B3522", "條紋"), ("#FFF4E3", "白毛"), ("#A9C24A", "眼睛"),
                  ("#4A8BDA", "領巾"), ("#F1C24A", "金牌"), ("#EE9C98", "肉球"), ("#3B2216", "線稿")], 36, 1200))
    b.append(arrows([
        [(282, 252), (318, 420), (424, 458)],     # bandana -> chest
        [(214, 470), (330, 470), (478, 540)],     # tag -> tag
        [(656, 640), (628, 470), (650, 360)],     # M -> cheek / head side
        [(660, 800), (640, 812), (620, 800)],     # tail swatch -> tail
    ]))
    return page("Mocha v2 sheet", "".join(b))


if __name__ == "__main__":
    out = sys.argv[1]
    open(f"{out}/sheet-baokaka.html", "w").write(sheet_baokaka())
    open(f"{out}/sheet-mocha.html", "w").write(sheet_mocha())
    print("ok")
