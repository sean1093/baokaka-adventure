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
             '<div class="sub">一歲的台灣男寶寶｜約 3.2 頭身（真人比例）｜主角・全隊前排｜黑直細髮、圓臉肉頰、細長丹鳳眼</div>')
    s_ = 380 / 680
    fig = svgdoc(lambda d: B.figure(d, "happy"), "-140 -40 680 1420", 380, 794)
    b.append(at(308, 112, fig, 2))
    hd = s_ * 414
    top = 112 + (40 + 10) * s_
    b.append(f'<div class="ruler" style="left:302px;top:{top:.0f}px;height:{hd*3.2:.0f}px">' +
             "".join(f'<div style="top:{hd*i:.0f}px"></div><span style="top:{hd*i-7:.0f}px">{i}</span>' for i in range(4)) +
             f'<div style="top:{hd*3.2:.0f}px"></div><span style="top:{hd*3.2-16:.0f}px;left:12px">3.2 頭身</span></div>')
    b.append('<div class="lb" style="left:380px;top:906px;width:240px">正面全身・學步站姿<i>雙手張開保持平衡（終章「勇敢的第一步」）</i></div>')
    b.append('<h2 style="left:36px;top:128px">服裝分層</h2>')
    b.append(at(22, 168, svgdoc(B.figure, "-110 380 620 520", 150, 126, flat="top") if False else svgdoc(lambda d: B.figure(d, flat="top"), "-110 370 620 520", 150, 126)))
    b.append(at(160, 168, svgdoc(lambda d: B.figure(d, flat="pants"), "30 770 340 440", 110, 142)))
    b.append('<div class="lb" style="left:20px;top:300px;width:150px">芥末黃棉上衣<i>米白圓領・肩扣・月亮刺繡</i></div>')
    b.append('<div class="lb" style="left:160px;top:316px;width:120px">灰白格紋褲<i>鬆緊褲頭・束口褲腳</i></div>')
    b.append('<div class="lb" style="left:24px;top:362px;width:250px">兩件式套裝（上衣＋褲子）<i>黃色＋灰白格在深藍夜景裡最醒目<br>米白襪子・右手紅線手環</i></div>')
    b.append(at(26, 440, svgdoc(Pr.bib, "30 20 340 240", 130, 92)))
    b.append('<div class="lb" style="left:20px;top:534px;width:140px">格紋口水巾<i>照片裡那條・初期裝備</i></div>')
    b.append(at(170, 444, svgdoc(Pr.bracelet_big, "40 110 320 200", 112, 70)))
    b.append('<div class="lb" style="left:158px;top:522px;width:140px">紅線手環<i>右手腕・金珠一顆（保平安）</i></div>')
    b.append(at(40, 600, svgdoc(Pr.gold_lock, "60 10 280 270", 112, 108)))
    b.append('<div class="lb" style="left:156px;top:628px;width:140px">金鎖片<i>阿嬤的禮物<br>劇情道具・終章才戴上</i></div>')
    b.append('<div class="notes" style="left:36px;top:730px;width:256px"><b>長相重點（照片）</b>'
             '・黑色直細髮，從右上髮旋往左下斜梳的瀏海，額頭高、兩側髮際稀疏<br>'
             '・超圓的臉、肉肉大臉頰、下巴有一圈肉<br>'
             '・細長杏仁形單眼皮、內眼角褶、深黑瞳孔<br>'
             '・短而淡的平眉、小而寬的鈕扣鼻、嘟嘟的小嘴</div>')
    b.append('<h2 style="left:666px;top:128px">表情集</h2>')
    for i, (e, n, t, tl) in enumerate([("neutral", "平常（嘟嘴）", 0, 0), ("laugh", "大笑", -.28, 5),
                                       ("teary", "淚汪汪", .22, 6), ("surprised", "驚訝", -.3, -3)]):
        x = 654 + (i % 2) * 168
        y = 170 + (i // 2) * 184
        b.append(at(x, y, svgdoc(lambda d, e=e, t=t, tl=tl: H.head(d, e, t, tl), "-14 -40 428 480", 152, 170)))
        b.append(f'<div class="lb" style="left:{x}px;top:{y+164}px;width:152px">{n}</div>')
    b.append('<h2 style="left:666px;top:556px">材質特寫</h2>')
    for i, (fn, n, sub) in enumerate([(Pr.sw_fleece, "棉質上衣", "芥末黃針織＋月亮刺繡"), (Pr.sw_rib, "羅紋領口・袖口", "米白針織直紋"),
                                      (Pr.sw_felt, "格紋褲", "灰白格紋（呼應口水巾）"), (Pr.sw_cord, "紅線編繩", "斜紋麻花編")]):
        x = 660 + (i % 2) * 166
        y = 600 + (i // 2) * 150
        b.append(frame(x, y, 148, 100, swatch(fn, 148, 104)))
        b.append(f'<div class="lb" style="left:{x-6}px;top:{y+104}px;width:160px">{n}<i>{sub}</i></div>')
    b.append('<h2 style="left:36px;top:944px">關聯物品</h2>')
    b.append(at(40, 986, svgdoc(Pr.blocks, "20 0 380 290", 190, 145)))
    b.append('<div class="lb" style="left:50px;top:1132px;width:170px">玩具積木<i>武器・「丟積木」</i></div>')
    b.append(at(250, 990, svgdoc(Pr.stamp_book, "80 40 260 270", 130, 135)))
    b.append('<div class="lb" style="left:244px;top:1132px;width:140px">集章本<i>捷運十站紀念章</i></div>')
    b.append(at(400, 1000, svgdoc(Pr.ticket, "30 70 340 200", 170, 100)))
    b.append('<div class="lb" style="left:400px;top:1132px;width:170px">月亮票<i>月亮線車票（第 3 章）</i></div>')
    b.append('<div class="notes" style="left:604px;top:948px;width:370px"><b>設計重點</b>'
             '・真人一歲比例：頭大、幾乎沒有脖子、圓肚子、短腿微 O 型<br>'
             '・眼睛：保留細長單眼皮與深黑瞳色，只放大、加光澤，不畫成圓滾滾的萌系大眼<br>'
             '・黑髮：主色帶紫灰，靠冷色天使環高光與細髮絲才讀得出層次<br>'
             '・線條：細而有收尖，背光側加粗；顏色取各材質的深色<br>'
             '・布料：底色＋賽璐璐陰影＋柔和漸層，皺褶在肘、膝、褲腳堆積<br>'
             '・光源固定左上，影子落在右下</div>')
    b.append(pal([("#F6C24E", "上衣"), ("#E09E3A", "上衣影"), ("#8E959D", "格紋"), ("#FFEADF", "膚色"), ("#F4978C", "腮紅"),
                  ("#25222A", "髮色"), ("#5C6276", "髮高光"), ("#251A1A", "瞳色"), ("#D9372E", "紅線")], 36, 1200))
    b.append(arrows([
        [(138, 220), (230, 200), (420, 420)],                 # top flat -> body
        [(270, 240), (290, 560), (440, 680)],                 # pants flat -> pants
        [(282, 470), (318, 500), (356, 522)],                 # bracelet -> wrist
        [(656, 640), (600, 610), (548, 560)],                 # jersey -> torso
        [(744, 742), (640, 800), (560, 760)],                 # gingham -> pants
    ]))
    return page("Baokaka v2 sheet", "".join(b))


def sheet_mocha():
    b = []
    b.append('<h1>摩卡貓<small>角色設定・MOCHA</small></h1>'
             '<div class="sub">灰棕色虎斑公貓（鯖魚紋）｜寶咖咖的「大哥」｜快攻＋單體治療｜口頭禪「……好啦。」</div>')
    fig = svgdoc(lambda d: Mo.figure(d, "content"), "110 -30 380 720", 360, 682)
    b.append(at(300, 130, fig, 2))
    b.append('<div class="lb" style="left:390px;top:866px;width:240px">正面坐姿<i>戰鬥待機・尾巴繞到前腳前面</i></div>')
    b.append('<h2 style="left:36px;top:128px">配件分解</h2>')
    b.append(at(30, 190, svgdoc(Pr.bandana_flat, "20 90 360 90", 250, 63)))
    b.append('<div class="lb" style="left:30px;top:262px;width:250px">捷運藍細項圈<i>白點點・不遮住胸前的項鍊紋</i></div>')
    b.append(at(80, 330, svgdoc(Pr.fish_tag, "100 20 200 220", 120, 132)))
    b.append('<div class="lb" style="left:50px;top:466px;width:190px">小魚金牌<i>掛在項圈上（不是鈴鐺，安靜派）</i></div>')
    b.append('<div class="notes" style="left:36px;top:552px;width:256px"><b>長相重點（照片）</b>'
             '・灰棕底色帶暖淺褐，黑色粗條紋（不是橘貓）<br>'
             '・額頭 M 字＋往頭頂的直條、眼角延伸過臉頰的黑線<br>'
             '・鬍鬚墊有黑色小點、下巴與嘴邊奶油白<br>'
             '・粉紅鼻頭＋深色鼻緣、黃綠色大圓眼、瞳孔偏大<br>'
             '・大而高的耳朵、內側淺色長毛<br>'
             '・大圓臉、壯壯的，毛很蓬<br>'
             '・胸前橫向「項鍊紋」、腳有橫紋，沒有白襪<br>'
             '・尾巴語言：上翹捲＝開心，炸毛＝驚訝，低掃＝不爽</div>')
    b.append('<h2 style="left:666px;top:128px">表情集</h2>')
    for i, (e, n, t, tl) in enumerate([("content", "平常", .12, 0), ("smug", "得意（翻譯時）", .3, -5),
                                       ("happy", "開心", -.25, 6), ("surprised", "驚訝", .18, 3)]):
        x = 654 + (i % 2) * 168
        y = 168 + (i // 2) * 178
        b.append(at(x, y, svgdoc(lambda d, e=e, t=t, tl=tl: Mo.head(d, e, t, tl), "140 0 320 320", 152, 152)))
        b.append(f'<div class="lb" style="left:{x}px;top:{y+150}px;width:152px">{n}</div>')
    b.append('<h2 style="left:666px;top:556px">毛色特寫</h2>')
    for i, (fn, n, sub) in enumerate([(Pr.sw_mfur, "額頭 M 字＋直條", "虎斑的招牌"), (Pr.sw_stripes, "鯖魚紋＋項鍊紋", "黑色粗紋、毛流向下"),
                                      (Pr.sw_tail, "環紋尾巴", "深色尾尖"), (Pr.sw_beans, "腳掌", "橫紋＋深色肉球")]):
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
    b.append('<div class="lb" style="left:384px;top:1100px;width:170px">藍點點飯碗<i>和項圈同款</i></div>')
    b.append('<div class="notes" style="left:604px;top:948px;width:370px"><b>個性</b>'
             '嘴硬心軟、討厭水，會「翻譯」寶咖咖的一個字。尾巴說的比嘴巴誠實。<br><br><b>畫法</b>'
             '・灰棕底＋暖褐暗部，黑紋是有厚度的筆刷形（中粗兩端尖），跟著身體曲面彎<br>'
             '・毛的蓬鬆感：臉頰鋸齒毛簇＋短毛筆觸紋理<br>'
             '・底色＋賽璐璐陰影（右下）＋柔和漸層；眼睛下緣打亮</div>')
    b.append(pal([("#9A8A76", "毛色"), ("#6C5F51", "毛影"), ("#BFA07C", "暖褐"), ("#1F1A17", "條紋"), ("#F1E8D8", "嘴邊白"),
                  ("#B4BE6C", "眼睛"), ("#E9A79A", "鼻子"), ("#4A8BDA", "項圈"), ("#1A1613", "線稿")], 36, 1200))
    b.append(arrows([
        [(270, 226), (318, 480), (440, 472)],     # collar -> collar
        [(206, 420), (330, 512), (466, 508)],     # tag -> tag
        [(656, 640), (640, 490), (604, 390)],     # M/stripes -> cheek lines
        [(660, 806), (644, 806), (616, 788)],     # tail swatch -> tail
    ]))
    return page("Mocha v2 sheet", "".join(b))


if __name__ == "__main__":
    out = sys.argv[1]
    open(f"{out}/sheet-baokaka.html", "w").write(sheet_baokaka())
    open(f"{out}/sheet-mocha.html", "w").write(sheet_mocha())
    print("ok")
