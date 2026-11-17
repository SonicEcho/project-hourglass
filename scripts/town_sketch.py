from PIL import Image, ImageDraw
import random, math
random.seed(11)
W,H=1024,1536
im=Image.new('RGB',(W,H),(178,170,150)); d=ImageDraw.Draw(im)
mask=Image.new('L',(W,H),0); m=ImageDraw.Draw(mask)
def bez(pts,n=60):
    out=[]
    for i in range(n+1):
        t=i/n; P=pts[:]
        while len(P)>1: P=[(P[k][0]*(1-t)+P[k+1][0]*t,P[k][1]*(1-t)+P[k+1][1]*t) for k in range(len(P)-1)]
        out.append(P[0])
    return out
def band(pts,w,col,draw_mask=True):
    d.line(pts,fill=col,width=w,joint='curve')
    for p in pts: d.ellipse([p[0]-w/2,p[1]-w/2,p[0]+w/2,p[1]+w/2],fill=col)
    if draw_mask:
        m.line(pts,fill=255,width=w+10)
        for p in pts: m.ellipse([p[0]-w/2-5,p[1]-w/2-5,p[0]+w/2+5,p[1]+w/2+5],fill=255)
# 川（上を左から右へ、ゆるく曲がる）と河川敷・土手
river=bez([(-40,80),(300,20),(620,170),(1080,70)])
band(bez([(-40,150),(300,110),(620,270),(1080,190)]),230,(140,180,110))  # 河川敷の草地
band(river,120,(80,130,190))
levee=bez([(-40,255),(300,205),(620,380),(1080,300)])
band(levee,16,(120,116,110))
# 線路（下をゆるく斜めに）
rail=bez([(-40,1420),(400,1360),(700,1330),(1080,1250)])
band(rail,26,(60,60,60))
# 道：昔の通り（橋から駅へ、曲がりながら下る。商店街はこの通りぞい）
old=bez([(560,330),(500,560),(640,820),(560,1100),(640,1320)])
band(old,20,(105,102,98))
# 橋
d.line([(560,300),(610,80)],fill=(105,102,98),width=20)
# 幹線道路（左上から右下へ、ほぼまっすぐ）
main=bez([(-40,1180),(400,1150),(700,1050),(1080,980)])
band(main,30,(95,92,88))
# ほかの道（曲がった生活道路）
for pts in [[(-40,600),(180,640),(330,560),(470,600)],[(560,470),(700,450),(900,520),(1080,480)],
            [(140,330),(110,560),(180,760),(100,1000),(150,1420)],[(900,330),(800,560),(900,820),(780,1060),(840,1290)],
            [(-40,860),(200,800),(420,880),(610,800)],[(640,780),(760,740),(900,820),(1080,760)],
            [(300,600),(400,760),(330,900),(260,1160)],[(230,420),(360,420),(470,470),(540,520)],
            [(660,900),(740,1000),(700,1060)],[(420,1200),(480,1100),(560,1060)],[(900,1120),(1000,1180),(1080,1150)],
            [(700,600),(760,640),(800,640)],[(380,980),(450,1020),(500,980)]]:
    band(bez(pts),14,(105,102,98))
# 目印の敷地（中心, 幅, 高さ, 回転）
LM={'school':(230,420,240,170,-8),'river_path':(340,190,150,60,-6),'riverside':(860,225,190,110,-10),
 'music_shop':(330,690,56,46,-6),'care_home':(700,560,110,80,10),'home':(860,690,100,80,4),
 'factory':(170,960,170,110,-4),'sento':(320,950,60,50,-4),
 'bakery':(830,930,58,50,6),'convenience':(250,1240,90,70,-3),'station':(560,1300,170,40,-6),'clockshop':(860,1150,54,54,-10)}
def rect(cx,cy,w,h,a):
    r=math.radians(a); c,s=math.cos(r),math.sin(r)
    return [(cx+x*c-y*s,cy+x*s+y*c) for x,y in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]]
m.line([p for p in old if 820<=p[1]<=1090],fill=255,width=70)
for k,(cx,cy,w,h,a) in LM.items():
    m.polygon(rect(cx,cy,w+30,h+30,a),fill=255)
# 家を敷き詰める（道・川・目印を避ける）
mp=mask.load()
for _ in range(9000):
    x=random.randint(0,W-1); y=random.randint(270,H-60)
    if y<380 and y < 255+ (x/1024)*80: continue
    w=random.randint(12,20); h=random.randint(12,20)
    ok=all(mp[min(W-1,max(0,int(x+dx))),min(H-1,max(0,int(y+dy)))]==0 for dx in (0,w) for dy in (0,h))
    if not ok: continue
    a=random.uniform(-15,15)
    g=random.randint(150,215); poly=rect(x,y,w,h,a)
    d.polygon(poly,fill=(g,g-6,g-14)); m.polygon(rect(x,y,w+4,h+4,a),fill=255)
for k,(cx,cy,w,h,a) in LM.items():
    d.polygon(rect(cx,cy,w,h,a),fill=(250,250,250),outline=(30,30,30))
arc=[p for p in old if 820<=p[1]<=1090]
d.line(arc,fill=(250,250,250),width=44)
d.line(arc,fill=(30,30,30),width=1)
print('street',arc[len(arc)//2])
im.save('docs/sketches/town_map_layout_natural.png')  # 使い方: python3 scripts/town_sketch.py（昼の町の地図の下絵。docs/ART.md の 5-5b の 2）
print({k:(round(v[0]*390/1024),round(v[1]*585/1536+68)) for k,v in LM.items()})
