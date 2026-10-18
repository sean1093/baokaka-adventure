import re
C='/home/user/baokaka-adventure/docs/art/options/d-anime/cast/'
OUT='/home/user/baokaka-adventure/docs/art/options/d-anime/'
FONT='<link href="https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600&display=swap" rel="stylesheet">'
def inl(n,w):
    s=open(C+n+'.svg').read(); return re.sub(r' width="[\d.]+" height="[\d.]+"',f' width="{w}" height="{w}"',s,count=1)
def cell(n,w,label,sub=''):
    return f'<figure>{inl(n,w)}<figcaption>{label}<i>{sub}</i></figcaption></figure>'
body=f'''<h1>配角・反派・常駐 NPC<small>設定一覽 · D 動漫風</small></h1>
<section><h2>阿藍（藍教授）<span>台灣藍鵲・第2章加入・法師</span></h2><div class="row">{cell("alan-happy",200,"自信","眼鏡反光")}{cell("alan-laugh",200,"得意大笑","「根據我的研究——」")}{cell("alan-teary",200,"慌張想哭","終章「我不知道」")}</div>
<p class="n">黑頭罩、鈷藍身體、淺藍肚子、珊瑚紅嘴與腳、黃眼圈、金色圓框眼鏡。尾巴是身體 1.5 倍，翹在身後，末端白斑＋黑帶。翅膀收起時看得到三根白尖飛羽；鉛筆夾在翅膀下。</p></section>
<section><h2>黑糖<span>台灣黑熊・第9章加入・坦克</span></h2><div class="row">{cell("heitang-scared",200,"害怕","冒汗、眉毛上揚")}{cell("heitang-brave",200,"勇敢","「我更怕你們自己上去」")}{cell("heitang-laugh",200,"開心","黑糖珍奶！")}</div>
<p class="n">亮黑帶藍光澤的毛、胸前奶油色 V 形月牙、褐色口鼻、圓耳、紅色毛線圍巾（羅紋＋流蘇）。身高約寶咖咖 3 倍；害羞時雙掌合在胸前。夜景規則：一定要有冷色邊光 #9CC8FF。</p></section>
<section><h2>咻咻<span>颱風寶寶・反派→朋友・四種型態</span></h2><div class="row">{cell("shushu-normal",190,"咻咻","枕頭大小・金鎖片纏在雲裡")}{cell("shushu-storm",190,"暴風咻咻","最終戰一階段・布袋戲框")}{cell("shushu-cry",190,"哭哭咻咻","最終戰二階段・眼淚下雨")}{cell("shushu-bonus",190,"生日加碼・咻咻","象山・雞排紙袋派對帽")}</div></section>
<section><h2>常駐 NPC<span>輕 Q 版 4–5 頭身・彩度約七成，讓主角更突出</span></h2><div class="row">{cell("npc-uncle",150,"阿伯→土地公","白眉遮眼・白鬍子・拐杖；每章換帽子")}{cell("npc-clerk",150,"店員小哥","綠橘條紋背心・掃描槍")}{cell("npc-announcer",150,"廣播姊姊","發光半透明・光做的列車長帽")}{cell("npc-backpacker",150,"迷路的背包客","大背包・地圖拿反")}{cell("npc-mom",150,"媽媽","丸子頭・淡紫睡衣・熟睡")}{cell("npc-dad",150,"爸爸","眼鏡・鬍渣・遙控器")}{cell("npc-grandma",150,"阿嬤","灰色燙髮・花襯衫・眼鏡鍊・扇子")}</div></section>'''
html=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Cast Sheet</title>{FONT}<style>
*{{box-sizing:border-box;margin:0}}body{{width:1200px;padding:26px 30px;font-family:'Chiron GoRound TC';color:#3A2A20;background:radial-gradient(ellipse at 50% 30%,#FBF3E2,#EBDBBC)}}
h1{{font:900 38px 'Noto Serif TC';letter-spacing:.08em}}h1 small{{font:700 16px 'Noto Serif TC';letter-spacing:.2em;margin-left:12px;color:#7A5A3E}}
section{{margin-top:16px;border:1.6px solid #3A2A20;border-radius:8px;padding:10px 16px 12px;background:rgba(255,250,238,.55)}}
h2{{font:900 22px 'Noto Serif TC';letter-spacing:.1em}}h2 span{{font:700 13px 'Chiron GoRound TC';color:#7A5A3E;letter-spacing:.04em;margin-left:10px}}
.row{{display:flex;gap:10px;justify-content:space-around;align-items:flex-end}}figure{{text-align:center}}
figcaption{{font:900 15px 'Noto Serif TC';letter-spacing:.06em}}figcaption i{{display:block;font:700 11.5px 'Chiron GoRound TC';font-style:normal;color:#7A5A3E;letter-spacing:0;max-width:170px;margin:0 auto}}
.n{{font:500 13px/1.6 'Chiron GoRound TC';margin-top:6px}}
</style></head><body>{body}</body></html>'''
open(OUT+'cast-sheet.html','w').write(html)
