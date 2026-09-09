import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import fs from 'node:fs';
// Single editable scene specification, consumed by Three.js and Blender.
const spec={materials:{},objects:[]};
const scene=new T.Scene();
const mats={};
function mat(n,c,metal=0,rough=.65,em=0){spec.materials[n]={color:c,metal,rough,em};mats[n]=new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough,emissive:c,emissiveIntensity:em});mats[n].name=n;return n}
mat('wall','#26212f');mat('floor','#28202e');mat('black','#12131d',.2);mat('chair','#303141',.15);mat('piping','#b899cf',.25);mat('wood','#654330');mat('skin','#b59adb',.05,.48);mat('hair','#252033',.05,.5);mat('hoodie','#555067',0,.85);mat('cuff','#444051');mat('cream','#f4e9d4',0,.4);mat('iris','#846543',.1,.35);mat('pupil','#110f1a',.05,.25);mat('glass','#332337',.55,.26);mat('gold','#e3a579',.6,.35);mat('pink','#d877a2');mat('orange','#fda469',.1,.5,.8);mat('mint','#91dfc4',.1,.45,.7);mat('purple','#a87afa',.1,.5,.8);mat('screen','#17192e',.1,.65,.15);mat('screen2','#2f2445',.1,.6,.25);mat('soil','#291c24');mat('leaf','#507d69',0,.8);mat('paper','#d7c5bc');mat('terra','#b77052');
const groups={};function group(n,p=[0,0,0]){const g=new T.Group();g.name=n;g.position.set(...p);scene.add(g);groups[n]=g;spec.objects.push({type:'group',name:n,pos:p});return n}
function obj(type,n,ma,p,s,rot=[0,0,0],parent=null,extra={}){spec.objects.push({type,name:n,mat:ma,pos:p,scale:s,rot,parent,...extra});let geo;if(type==='box')geo=new T.BoxGeometry(1,1,1);if(type==='sphere')geo=new T.SphereGeometry(1,24,16);if(type==='cylinder')geo=new T.CylinderGeometry(extra.top??1,extra.bottom??1,1,24);if(type==='torus')geo=new T.TorusGeometry(1,extra.tube??.08,8,40);const o=new T.Mesh(geo,mats[ma]);o.name=n;o.position.set(...p);o.scale.set(...s);o.rotation.set(...rot);(parent?groups[parent]:scene).add(o);return o}
const box=(n,m,p,s,r=[0,0,0],g)=>obj('box',n,m,p,s,r,g);
const ell=(n,m,p,s,r=[0,0,0],g)=>obj('sphere',n,m,p,s,r,g);
const cyl=(n,m,p,s,r=[0,0,0],g,ex={})=>obj('cylinder',n,m,p,s,r,g,ex);
const tor=(n,m,p,s,r=[0,0,0],g,tube=.08)=>obj('torus',n,m,p,s,r,g,{tube});
// Coordinates: X right, Y up, Z toward visitor.
box('back wall','wall',[0,3,-2.4],[12,6,.15]);box('floor','floor',[0,-.12,0],[13,.15,9]);box('left wall','wall',[-5.7,3,0],[.15,6,5]);
for(let i=0;i<15;i++)box('acoustic slat '+i,'black',[-.9+i*.14,3.6,-2.29],[.05,3.4,.08]);
box('desk top','wood',[0,1.48,-1.15],[9,.13,1.65]);box('desk edge','black',[0,1.40,-.37],[9,.09,.08]);
for(const x of [-4.15,4.15]){box('desk legs','black',[x,.7,-1.2],[.1,1.4,1.2]);box('desk foot','black',[x,.05,-1.15],[.7,.1,1.5])}
box('underglow amber','orange',[-2.3,1.38,-1.5],[4,.025,.025]);box('underglow violet','purple',[2.3,1.38,-1.5],[4,.025,.025]);
// Dual display workstation, right of mascot.
for(const [x,y,w,h] of [[1.9,2.32,1.58,1.02],[3.5,2.38,1.2,1.15]]){
 box('monitor shell','black',[x,y,-1.56],[w+.1,h+.1,.12]);box('monitor display','screen',[x,y,-1.486],[w,h,.012]);box('display stand','chair',[x,1.77,-1.6],[.055,.49,.08]);box('display base','black',[x,1.57,-1.43],[.55,.035,.35]);
}
// Original monitor graphics built as low-poly screen geometry.
for(let i=0;i<13;i++){const width=[.56,.85,.39,.68,.95,.47][i%6];box('code line','mint',[1.44+width/2,2.73-i*.065,-1.472],[width,.013,.006]);box('code gutter','purple',[1.25,2.73-i*.065,-1.47],[.03,.013,.008])}
for(let i=0;i<22;i++){let h=.1+.45*(.5+.5*Math.sin(i*.8));box('audio spectrum '+i,i%3===0?'orange':'purple',[3.01+i*.047,2.02+h/2,-1.47],[.028,h,.01])}
box('spectrum header','cream',[3.5,2.78,-1.47],[.73,.025,.009]);box('spectrum underline','purple',[3.5,2.71,-1.47],[.95,.012,.009]);
box('keyboard base','black',[2.3,1.57,-.66],[1.37,.07,.48]);for(let i=0;i<13;i++)for(let j=0;j<4;j++)box('keycap',j===0?'purple':'chair',[1.73+i*.093,1.62,-.81+j*.093],[.075,.025,.071]);
box('desk mat','cuff',[3.37,1.56,-.65],[.6,.015,.6]);ell('mouse','chair',[3.35,1.62,-.65],[.11,.065,.17]);box('mouse light','purple',[3.35,1.68,-.64],[.02,.007,.06]);
// Amber mushroom lamp.
cyl('lamp base','black',[-3.25,1.6,-1.08],[.26,.08,.26]);cyl('lamp stem','gold',[-3.25,1.94,-1.08],[.026,.63,.026]);ell('lamp shade','orange',[-3.25,2.24,-1.08],[.51,.25,.51]);cyl('shade lip','orange',[-3.25,2.17,-1.08],[.49,.045,.49]);
// Synthesizer, books, mug, speakers.
box('synth body','black',[-2.14,1.61,-.72],[1.5,.15,.58]);for(let i=0;i<20;i++){box('piano key','cream',[-2.82+i*.071,1.70,-.55],[.062,.026,.27]);if(i%7!==2&&i%7!==6)box('piano sharp','black',[-2.79+i*.071,1.73,-.66],[.034,.04,.13])}for(let i=0;i<6;i++)cyl('synth knob','gold',[-2.7+i*.17,1.72,-.92],[.025,.04,.025]);
for(let i=0;i<3;i++)box('stacked notebook',['terra','cream','hoodie'][i],[-4,1.6+i*.075,-.7],[.66,.06,.43],[0,i*.06,0]);
cyl('coffee mug','cream',[.95,1.73,-.52],[.13,.30,.13]);cyl('coffee','soil',[.95,1.884,-.52],[.116,.008,.116]);tor('mug handle','cream',[1.11,1.74,-.52],[.09,.11,.09]);
for(const x of [.75,4.45]){box('speaker','black',[x,1.83,-1.34],[.3,.5,.32]);cyl('speaker cone','chair',[x,1.85,-1.165],[.1,.025,.1],[Math.PI/2,0,0]);cyl('speaker dome','black',[x,1.85,-1.15],[.047,.025,.047],[Math.PI/2,0,0])}
// Right shelf with books and plant.
box('floating shelf','wood',[3.1,3.8,-2.13],[2.95,.1,.5]);for(let i=0;i<7;i++)box('shelf books',['cream','terra','hoodie','mint'][i%4],[2+i*.12,4.05,-2.1],[.08,.4+(i%3)*.09,.25],[0,0,i===6?-.16:0]);
function plant(x,y,z,k=1){cyl('plant pot','terra',[x,y+.15*k,z],[.2*k,.3*k,.2*k],[0,0,0],null,{top:1,bottom:.7});cyl('plant soil','soil',[x,y+.303*k,z],[.18*k,.01,.18*k]);for(let i=0;i<7;i++){const a=i*2.4;ell('leaf','leaf',[x+Math.cos(a)*.15*k,y+.5*k+(i%2)*.1*k,z+Math.sin(a)*.15*k],[.065*k,.26*k,.08*k],[Math.sin(a)*.65,0,Math.cos(a)*.65])}}
plant(3.6,3.86,-2,1);plant(-4.3,1.55,-1.6,.8);
// Framed record artwork, wall-mounted original guitar.
box('record frame','wood',[-2.8,3.6,-2.27],[1.35,1.52,.08]);box('record mat','paper',[-2.8,3.6,-2.22],[1.23,1.4,.018]);cyl('vinyl','black',[-2.8,3.67,-2.19],[.47,.02,.47],[Math.PI/2,0,0]);tor('vinyl groove','chair',[-2.8,3.67,-2.174],[.37,.37,.37]);cyl('record label','terra',[-2.8,3.67,-2.169],[.13,.02,.13],[Math.PI/2,0,0]);box('record caption','black',[-2.8,3.06,-2.19],[.5,.024,.01]);
ell('guitar lower','terra',[-4.55,3.1,-2.13],[.35,.43,.11]);ell('guitar upper','terra',[-4.55,3.46,-2.13],[.27,.3,.11]);ell('guitar guard','cream',[-4.49,3.3,-1.999],[.17,.32,.015]);box('guitar neck','wood',[-4.55,4.08,-2.09],[.11,.95,.08]);box('guitar head','terra',[-4.55,4.63,-2.09],[.16,.27,.09],[0,0,-.12]);for(let i=0;i<4;i++)box('guitar strings','gold',[-4.59+i*.025,3.94,-1.978],[.003,1.46,.006]);box('guitar bridge','black',[-4.55,3.04,-1.98],[.17,.08,.03]);
// Bed at far right, folded blanket and cushion.
box('bed frame','wood',[5.1,.4,.3],[1.8,.45,3]);box('mattress','hoodie',[5.1,.72,.3],[1.7,.3,2.8]);box('blanket','cuff',[5.1,.9,.85],[1.73,.09,1.6]);ell('pillow','piping',[5.1,.95,-.66],[.66,.16,.36]);
// Chair silhouette and articulated mascot.
box('chair seat','chair',[0,.99,.4],[1.54,.24,1.15]);ell('chair back','chair',[0,1.89,-.03],[.96,1.30,.26]);ell('chair inset','black',[0,1.95,.16],[.80,1.13,.1]);ell('headrest','chair',[0,2.96,.09],[.54,.28,.22]);
for(const x of [-.82,.82]){ell('chair side bolster','piping',[x,1.75,.01],[.15,.85,.20],[0,0,x*.18]);box('chair arm','black',[x*1.23,1.12,.62],[.28,.11,.70]);box('arm support','chair',[x*1.23,.83,.48],[.08,.52,.10])}
cyl('chair post','black',[0,.50,.4],[.095,.8,.095]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box('chair base leg','chair',[Math.sin(a)*.4,.16,.4+Math.cos(a)*.4],[.09,.09,.9],[0,a,0]);ell('chair wheel','black',[Math.sin(a)*.82,.1,.4+Math.cos(a)*.82],[.13,.10,.13])}
group('Body',[0,0,0]);ell('hoodie body','hoodie',[0,1.47,.55],[.64,.70,.44],[0,0,0],'Body');ell('hoodie hood','cuff',[0,2.04,.40],[.58,.28,.43],[0,0,0],'Body');ell('front pocket','cuff',[0,1.20,.951],[.35,.17,.055],[0,0,0],'Body');
for(const x of [-1,1]){ell('sleeve','hoodie',[x*.63,1.52,.53],[.24,.48,.23],[0,0,x*.24],'Body');ell('cuff','cuff',[x*.74,1.12,.63],[.205,.13,.2],[0,0,0],'Body');ell('hand','skin',[x*.74,1.055,.79],[.19,.14,.24],[0,0,0],'Body');ell('trouser','black',[x*.32,.86,.87],[.26,.25,.54]);ell('shin','black',[x*.35,.52,1.18],[.22,.4,.24]);ell('shoe','cream',[x*.36,.22,1.31],[.27,.18,.43]);box('shoe sole','chair',[x*.36,.1,1.33],[.49,.08,.76])}
for(const x of [-.17,.17]){cyl('hood string','cream',[x,1.81,.965],[.014,.30,.014],[0,0,x*.2],'Body');cyl('string tip','gold',[x,1.66,.969],[.02,.06,.02],[0,0,0],'Body')}
box('hoodie emblem','piping',[.33,1.58,.94],[.09,.065,.018],[0,0,0],'Body');
group('Head',[0,2.45,.56]);ell('face','skin',[0,0,0],[.66,.65,.48],[0,0,0],'Head');
for(const x of [-1,1]){ell('ear','skin',[x*.66,.0,-.015],[.17,.25,.13],[0,0,x*-.2],'Head');ell('ear inset','pink',[x*.73,.01,.07],[.057,.12,.04],[0,0,0],'Head');ell('cheek','pink',[x*.4,-.20,.379],[.115,.055,.024],[0,0,0],'Head');
 // Eye groups permit nonuniform blink scaling and independent gaze.
 const gn='Eye'+(x<0?'L':'R');const g=new T.Group();g.name=gn;g.position.set(x*.27,.07,.399);groups.Head.add(g);groups[gn]=g;spec.objects.push({type:'group',name:gn,pos:[x*.27,.07,.399],parent:'Head'});
 ell('white '+gn,'cream',[0,0,0],[.20,.225,.07],[0,0,0],gn);ell('iris '+gn,'iris',[.025,-.013,.063],[.095,.116,.034],[0,0,0],gn);ell('Pupil'+(x<0?'L':'R'),'pupil',[.025,-.012,.091],[.065,.085,.017],[0,0,0],gn);ell('catchlight '+gn,'cream',[.0,.029,.111],[.023,.025,.008],[0,0,0],gn);
 tor('round glasses','glass',[x*.275,.06,.51],[.269,.269,.269],[0,0,0],'Head',.065);ell('brow','hair',[x*.28,.343,.366],[.18,.055,.055],[0,0,x*-.08],'Head');box('glasses temple','gold',[x*.562,.07,.30],[.035,.035,.4],[0,0,0],'Head');}
box('glasses bridge','gold',[0,.08,.522],[.084,.032,.025],[0,0,0],'Head');ell('nose','skin',[0,-.12,.464],[.11,.115,.11],[0,0,0],'Head');ell('smile','hair',[0,-.318,.408],[.13,.025,.016],[0,0,-.05],'Head');ell('lower lip','pink',[0,-.348,.386],[.08,.018,.016],[0,0,0],'Head');
ell('hair cap','hair',[0,.38,-.085],[.665,.36,.48],[0,0,0],'Head');ell('quiff one','hair',[-.27,.61,.03],[.38,.24,.38],[0,0,.28],'Head');ell('quiff two','hair',[.13,.65,.025],[.37,.28,.35],[0,0,-.3],'Head');ell('quiff point','hair',[.39,.54,.00],[.27,.19,.30],[0,0,-.45],'Head');ell('front curl','hair',[-.37,.34,.29],[.21,.18,.19],[0,0,-.45],'Head');
// Save the unmerged master specification for the Blender authoring source.
fs.writeFileSync('studio/scene.json',JSON.stringify(spec,null,2));
// Merge static geometry by material, retaining the independent animated hierarchy.
scene.updateMatrixWorld(true);const buckets={};for(const o of [...scene.children])if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed();(buckets[o.material.name]??=[]).push(g);scene.remove(o)}for(const [name,geos]of Object.entries(buckets)){const mesh=new T.Mesh(mergeGeometries(geos),mats[name]);mesh.name='Room_'+name;scene.add(mesh)}
// Minimal FileReader polyfill for the official Three.js exporter in Node.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.()})}readAsDataURL(blob){blob.arrayBuffer().then(r=>{this.result='data:'+blob.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.()})}};
const exporter=new GLTFExporter();const glb=await exporter.parseAsync(scene,{binary:true});fs.writeFileSync('public/models/room-uncompressed.glb',Buffer.from(glb));console.log('Authored objects:',spec.objects.length,'GLB bytes:',glb.byteLength);
