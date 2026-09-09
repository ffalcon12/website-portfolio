"""Reinterpret the supplied September reference as an original real-time scene.
Run after build-scene.mjs and before build_blender.py.
"""
import json,math,random
from pathlib import Path
root=Path(__file__).resolve().parent.parent
s=json.loads((root/'studio/scene.json').read_text());base=s['objects'];s['objects']=[];out=s['objects'];random.seed(14)
# Retain environment structure, replacing the avatar and repositioning displays.
for o in base:
 n=o['name']
 if o.get('parent') or o['type']=='group':continue
 if any(w in n for w in ['trouser','shin','shoe','coffee','mug','piano','synth','guitar','record','vinyl','lamp shade','shade lip']):continue
 if n.startswith(('monitor','display','code ','audio spectrum','spectrum','keyboard','keycap','mouse','desk mat','speaker')):continue
 out.append(o)
def mat(n,color,metal=0,rough=.65,em=0):s['materials'][n]={'color':color,'metal':metal,'rough':rough,'em':em}
for n,c in [('skin','#cc8e69'),('pink','#b57260'),('hair','#241310'),('hoodie','#252027'),('cuff','#19171e'),('piping','#5b4a69'),('iris','#513224'),('wall','#18121f'),('floor','#19121e')]:s['materials'][n]['color']=c
mat('hairlight','#442619');mat('lip','#a56759');mat('ledblue','#3844ff',.1,.5,2);mat('ledamber','#ff7826',.1,.5,2);mat('grid','#323f70',0,.6,.45)
def obj(t,n,m,p,z,r=(0,0,0),parent=None,**kw):
 d={'type':t,'name':n,'mat':m,'pos':p,'scale':z,'rot':r,**kw}
 if parent:d['parent']=parent
 out.append(d)
def ell(n,m,p,z,r=(0,0,0),g=None):obj('sphere',n,m,p,z,r,g)
def box(n,m,p,z,r=(0,0,0),g=None):obj('box',n,m,p,z,r,g)
def cyl(n,m,p,z,r=(0,0,0),g=None,**kw):obj('cylinder',n,m,p,z,r,g,**kw)
def grp(n,p,parent=None):
 d={'type':'group','name':n,'pos':p}
 if parent:d['parent']=parent
 out.append(d)
# Three monitors: coding left, maths right, portrait checklist at far right.
monitors=[(-1.85,2.35,1.65,1.28),(1.85,2.35,1.65,1.28),(3.25,2.32,.77,1.42)]
for i,(x,y,w,h) in enumerate(monitors):
 box('monitor frame '+str(i),'black',[x,y,-1.10],[w+.1,h+.1,.12]);box('monitor screen '+str(i),'screen',[x,y,-1.03],[w,h,.016]);box('monitor stem','black',[x,1.72,-1.12],[.06,.5,.09]);box('monitor foot','black',[x,1.57,-1.0],[.55,.04,.35])
for i in range(16):
 w=[.44,.83,.60,.96,.36][i%5]
 box('code gutter','purple',[-2.56,2.89-i*.065,-1.009],[.025,.014,.004]);box('code line','mint' if i%3 else 'orange',[-2.45+w/2,2.89-i*.065,-1.009],[w,.013,.004])
for i in range(11):
 box('graph grid','grid',[1.85,1.78+i*.108,-1.009],[1.52,.006,.004]);box('graph grid','grid',[1.12+i*.145,2.35,-1.009],[.005,1.17,.004])
for row in range(9):
 for col in range(25):
  x=(col-12)/12;z=(row-4)/4;h=math.exp(-3*(x*x+z*z))*.4
  box('math surface','purple',[1.85+x*.66,2.11+z*.18+h,-.999],[.028,.013,.005])
for i in range(6):
 box('checkbox','piping',[3.00,2.86-i*.19,-1.009],[.045,.045,.005]);box('task line','cream',[3.30,2.86-i*.19,-1.009],[.39,.016,.005])
# Foreground workbench with RGB keyboard and a partially open laptop.
box('foreground desk','wood',[0,1.10,1.30],[7,.12,1.6]);box('desk front dark edge','black',[0,1.02,2.08],[7,.08,.07]);box('large desk pad','black',[.25,1.17,1.48],[3.5,.02,.9])
box('foreground keyboard','black',[0,1.22,1.59],[1.86,.10,.51])
for i in range(17):
 for j in range(4):box('RGB keys','orange' if i<6 else 'purple',[-.79+i*.099,1.278,1.43+j*.10],[.080,.017,.079])
ell('foreground mouse','black',[1.45,1.26,1.7],[.17,.095,.26]);box('mouse stripe','purple',[1.45,1.35,1.7],[.02,.008,.17])
box('laptop base','chair',[-1.94,1.21,1.55],[1.7,.065,1.10],[0,-.14,0]);box('laptop lid back','black',[-2.02,1.67,1.04],[1.7,1.0,.07],[-.17,-.14,0]);box('laptop emblem','purple',[-2.02,1.7,1.09],[.13,.11,.02],[-.17,-.14,.5])
cyl('water bottle','black',[2.32,1.65,1.55],[.18,.9,.18]);cyl('bottle cap','gold',[2.32,2.12,1.55],[.12,.09,.12]);box('bottle mark','paper',[2.32,1.70,1.736],[.13,.10,.012])
box('notebook foreground','paper',[2.91,1.2,1.70],[.65,.07,.87],[0,-.2,0]);box('digital clock','black',[3.5,1.75,-.4],[.65,.32,.22])
for i in range(4):box('clock digit','purple',[3.3+i*.12,1.76,-.277],[.06,.12,.007])
# Warm crystal lamp and plants.
ell('amber crystal lamp','orange',[-3.25,2.06,-1.08],[.24,.43,.20]);
def plant(x,y,z,k=1):
 cyl('plant vessel','terra',[x,y+.13*k,z],[.19*k,.26*k,.19*k],top=1,bottom=.8)
 for i in range(9):
  a=i*2.4;ell('plant leaf','leaf',[x+math.cos(a)*.19*k,y+.45*k+(i%3)*.07*k,z+math.sin(a)*.19*k],[.075*k,.28*k,.09*k],[math.sin(a)*.6,0,math.cos(a)*.6])
plant(-3,1.18,1.65,1.3);plant(3.85,1.56,-.9,1.4);plant(-4,3.35,-1.8,1.5)
box('left plant shelf','wood',[-4,3.32,-1.9],[1.4,.09,.7])
# Abstract original motivational prints, no copied text or art.
for x in [-2.7,2.7]:
 box('poster frame','black',[x,3.75,-2.23],[1.12,1.13,.08])
 for i,w in enumerate([.70,.56,.72,.45]):box('poster typography abstraction','terra' if x<0 else 'purple',[x,4.05-i*.18,-2.181],[w,.055,.005])
# Relaxed human-style creator; black hoodie, both forearms and hands resting on the desk.
grp('Body',[0,0,0]);ell('torso','hoodie',[0,1.72,.42],[.69,.75,.43],g='Body');ell('hood','cuff',[0,2.13,.28],[.61,.43,.34],g='Body');cyl('neck','skin',[0,2.32,.51],[.22,.47,.20],g='Body')
ell('left upper sleeve','hoodie',[-0.62, 1.75, 0.55],[0.27, 0.49, 0.29],[0, 0, -0.25],'Body')
ell('left forearm across desk','hoodie',[-0.31, 1.36, 0.94],[0.58, 0.23, 0.29],[0, 0, -0.1],'Body')
ell('left cuff','cuff',[0.19, 1.29, 0.99],[0.12, 0.16, 0.21],[0, 0, 0],'Body')
ell('resting left hand','skin',[0.44, 1.255, 1.12],[0.25, 0.085, 0.18],[0, 0, 0],'Body')
ell('right upper sleeve','hoodie',[0.63, 1.73, 0.46],[0.29, 0.43, 0.28],[0, 0, 0.35],'Body')
ell('right bent elbow','hoodie',[0.85, 1.41, 0.67],[0.3, 0.27, 0.3],[0, 0, 0],'Body')
ell('right forearm on desk','hoodie',[0.94, 1.37, 1.0],[0.23, 0.21, 0.4],[0.07, 0.17, 0],'Body')
ell('right desk cuff','cuff',[1.015, 1.31, 1.3],[0.2, 0.14, 0.13],[0, 0.17, 0],'Body')
ell('right wrist','skin',[1.04, 1.28, 1.37],[0.135, 0.085, 0.14],[0, 0.17, 0],'Body')
ell('resting right palm','skin',[1.065, 1.26, 1.49],[0.17, 0.085, 0.17],[0, 0.17, 0],'Body')
ell('resting right fingers','skin',[0.955, 1.23, 1.63],[0.036, 0.055, 0.09],[0, 0.12, 0],'Body')
ell('resting right fingers','skin',[1.023, 1.23, 1.65],[0.036, 0.055, 0.09],[0, 0.12, 0],'Body')
ell('resting right fingers','skin',[1.091, 1.23, 1.65],[0.036, 0.055, 0.09],[0, 0.12, 0],'Body')
ell('resting right fingers','skin',[1.159, 1.23, 1.63],[0.036, 0.055, 0.09],[0, 0.12, 0],'Body')
for x in [-.15,.15]:cyl('drawstring','cuff',[x,1.95,.835],[.013,.32,.013],g='Body')
# Face features. Slight tilt is designed into the exported head control.
grp('Head',[-.05,2.78,.58]);ell('head cranium','skin',[0,.035,-.02],[.54,.66,.45],g='Head');ell('jaw','skin',[0,-.26,.055],[.42,.40,.34],g='Head');ell('chin','skin',[0,-.49,.14],[.26,.16,.20],g='Head')
for x in [-1,1]:
 ell('human ear','skin',[x*.535,-.03,0],[.12,.22,.10],[0,0,x*-.12],'Head');ell('ear fold','pink',[x*.568,-.035,.077],[.055,.13,.026],g='Head')
 name='EyeL' if x<0 else 'EyeR';grp(name,[x*.23,.065,.395],'Head')
 ell('eyelid rim','pink',[0,0,-.012],[.202,.155,.071],g=name);ell('eye white','cream',[0,0,.005],[.185,.135,.056],g=name);ell('iris','iris',[.012,-.008,.053],[.093,.101,.022],g=name);ell('PupilL' if x<0 else 'PupilR','pupil',[.012,-.009,.075],[.058,.068,.012],g=name);ell('eye glint','cream',[-.012,.026,.086],[.025,.026,.007],g=name)
 ell('eyebrow','hair',[x*.23,.285,.352],[.20,.045,.052],[0,0,-x*.13],'Head')
ell('nose bridge','skin',[0,-.04,.407],[.065,.15,.066],g='Head');ell('nose tip','skin',[0,-.16,.478],[.099,.072,.096],g='Head');
for x in [-1,1]:ell('nostril','pink',[x*.063,-.191,.521],[.023,.015,.012],g='Head')
ell('upper lip','lip',[0,-.35,.361],[.16,.027,.035],g='Head');ell('lower lip','lip',[0,-.384,.362],[.145,.033,.036],g='Head');ell('mouth line','hair',[0,-.359,.391],[.137,.008,.006],g='Head')
# Sculpted, tapered hair locks. No strand simulation or transparency.
ell('hair back','hair',[0,.35,-.02],[.57,.43,.46],g='Head')
for i in range(34):
 x=random.uniform(-.52,.43);z=random.uniform(-.16,.28);y=.42+random.uniform(.0,.20)
 path=[[x,y,z],[x-.10,y+.22,z+.08],[x+.12,y+.32,z+.10],[x+.40,y+.27,z+.025]]
 if i<12:path=[[x,.47,.30],[x-.18,.42,.43],[x-.31,.24,.43],[x-.30,.14,.39]]
 obj('lock','swept hair lock '+str(i),'hairlight' if i%5==0 else 'hair',[0,0,0],[1,1,1],parent='Head',path=path,width=random.uniform(.07,.13))
for i in range(12):
 x=-.25+i*.042
 obj('lock','front swept lock '+str(i),'hairlight' if i%4==0 else 'hair',[0,0,0],[1,1,1],parent='Head',path=[[x,.34,.40],[x-.05,.64,.50],[x+.23,.76,.30],[x+.50,.62,.06]],width=.075)
for o in out:
 if o['name']=='eyelid rim':o['mat']='skin'
# Thin blue light strips near the right window.
for i in range(9):box('window blue slat','ledblue',[4.75,2.5+i*.20,-2.13],[.50,.025,.018])
s['design']='human-creator-september-reference'
(root/'studio/scene.json').write_text(json.dumps(s,indent=2));print('Redesigned objects:',len(out))
