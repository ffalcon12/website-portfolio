'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { SCREEN_LABELS } from './profile';
import monitorProjection from '../public/models/monitor-hotspots.json';
type ComputerProps={onComputer:(index?:number)=>void;focused:boolean;monitorIndex:number;onHover?:(index:number|null)=>void};
function monitorOf(object:THREE.Object3D):number|null {
 for(let node:THREE.Object3D|null=object;node;node=node.parent){const match=/^Monitor([0-2])(?:_|$)/.exec(node.name);if(match)return Number(match[1])}return null;
}
function Model({onReady,reset,reduced,focused,onComputer,monitorIndex,onHover}:{onReady:()=>void;reset:number;reduced:boolean}&ComputerProps){
 // Blender's retained coordinate root maps local Z to the character's vertical axis.
 const {scene}=useGLTF('/models/room.glb',false,true);
 const {camera,pointer,gl,size,invalidate}=useThree();
 const lookTarget=useRef(new THREE.Vector3(0,2.35,0));
 useEffect(()=>{invalidate()},[focused,invalidate]);
 const head=useMemo(()=>scene.getObjectByName('Head'),[scene]);
 const body=useMemo(()=>scene.getObjectByName('Body'),[scene]);
 const eyes=useMemo(()=>['EyeL','EyeR'].map(n=>scene.getObjectByName(n)),[scene]);
 const pupils=useMemo(()=>['PupilL','PupilR'].map(n=>scene.getObjectByName(n)),[scene]);
 const screenMaterial=useMemo(()=>{const node=scene.getObjectByName('Room_mint') as THREE.Mesh; if(!node?.isMesh)return null; const m=(node.material as THREE.MeshStandardMaterial).clone();node.material=m;return m},[scene]);
 const blink=useRef({next:2+Math.random()*3,start:-10});const frames=useRef(0),time=useRef(0);
 useEffect(()=>{onReady()},[scene]);
 useEffect(()=>{pointer.set(0,0);camera.position.set(0,3.25,8.5)},[reset]);
 useFrame((state,delta)=>{
  const t=state.clock.elapsedTime;const k=1-Math.exp(-delta*3);const mobile=size.width<800;
  const x=reduced?0:pointer.x;const y=reduced?0:pointer.y;
  const ease=reduced?1:k;
  camera.position.x=THREE.MathUtils.lerp(camera.position.x,focused?[-1.85,1.85,3.25][monitorIndex]:x*.19,ease);camera.position.y=THREE.MathUtils.lerp(camera.position.y,focused?2.35:3.25+y*.1,ease);camera.position.z=THREE.MathUtils.lerp(camera.position.z,focused?1.0:mobile?10.9:8.5,ease);lookTarget.current.lerp(new THREE.Vector3(focused?[-1.85,1.85,3.25][monitorIndex]:0,focused?2.35:2.35,focused?-1.5:0),ease);camera.lookAt(lookTarget.current);
  if(head){head.rotation.z=THREE.MathUtils.lerp(head.rotation.z,-x*.08,k);head.rotation.x=THREE.MathUtils.lerp(head.rotation.x,-y*.04+(reduced?0:Math.sin(t*.6)*.014),k);head.rotation.y=reduced?0:Math.sin(t*.42)*.018}
  if(body&&!reduced){body.scale.z=1+Math.sin(t*1.6)*.007;}
  if(!reduced){if(t>blink.current.next){blink.current.start=t;blink.current.next=t+3+Math.random()*4}const progress=(t-blink.current.start)/.19;const sy=progress>=0&&progress<1?1-Math.sin(progress*Math.PI)*.94:1;eyes.forEach(e=>{if(e)e.scale.z=sy});pupils.forEach(p=>{if(p){p.position.x=.012+x*.014;p.position.z=.009-y*.015}})}
  if(screenMaterial&&!reduced)screenMaterial.emissiveIntensity=.96+Math.sin(t*.8)*.035;
  frames.current++;time.current+=delta;if(time.current>2){const canvas=gl.domElement;canvas.dataset.fps=String(Math.round(frames.current/time.current));canvas.dataset.drawCalls=String(gl.info.render.calls);canvas.dataset.triangles=String(gl.info.render.triangles);frames.current=0;time.current=0;}
 });
 const monitorMaterials=useMemo(()=>{
  const sets:THREE.MeshStandardMaterial[][]=[[],[],[]];
  scene.traverse(node=>{const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;const index=monitorOf(mesh);if(index===null)return;
   const source=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   const cloned=source.map(mat=>{const m=mat.clone() as THREE.MeshStandardMaterial;m.userData.baseEmissive=m.emissive.clone();m.userData.baseIntensity=m.emissiveIntensity;m.userData.baseEmissiveMap=m.emissiveMap;sets[index].push(m);return m});
   mesh.material=Array.isArray(mesh.material)?cloned:cloned[0];
  });return sets;
 },[scene]);
 const hovered=useRef<number|null>(null);
 const hover=(index:number|null)=>{
  if(hovered.current===index)return;hovered.current=index;gl.domElement.style.cursor=index===null?'auto':'pointer';onHover?.(index);
  monitorMaterials.forEach((materials,i)=>materials.forEach(m=>{m.emissive.copy(m.userData.baseEmissive);m.emissiveIntensity=m.userData.baseIntensity;m.emissiveMap=m.userData.baseEmissiveMap;if(i===index){m.emissive.set('#ffe35a');m.emissiveIntensity=.75;m.emissiveMap=null}m.needsUpdate=true;}));invalidate();
 };
 useEffect(()=>{if(focused)hover(null);return()=>{gl.domElement.style.cursor='auto'}},[focused]);
 return <primitive object={scene}
  onPointerMove={(e:any)=>{e.stopPropagation();hover(focused?null:monitorOf(e.object))}}
  onPointerOut={()=>hover(null)}
  onClick={(e:any)=>{e.stopPropagation();if(focused)return;const index=monitorOf(e.object);if(index!==null){hover(null);onComputer(index)}}}
 />;

}
function Poster({onComputer}:{onComputer:(index?:number)=>void}) {
 const container=useRef<HTMLDivElement>(null);const [bounds,setBounds]=useState({w:1664,h:936});
 useEffect(()=>{const el=container.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setBounds({w:entry.contentRect.width,h:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect()},[]);
 const scale=Math.max(bounds.w/1664,bounds.h/936),ox=(bounds.w-1664*scale)/2,oy=(bounds.h-936*scale)/2;
 return <div className="poster-room" ref={container}><img src="/models/room-poster.webp" alt="A human-style creator resting both hands on a desk with three clickable monitors"/>{monitorProjection.hotspots.map(([x,y,w,h])=>[x*1664,y*936,w*1664,h*936]).map(([x,y,w,h],i)=><button key={i} className="poster-monitor" style={{left:ox+x*scale,top:oy+y*scale,width:w*scale,height:h*scale}} aria-label={SCREEN_LABELS[i]} onClick={()=>onComputer(i)}><span className="poster-hover-label">{SCREEN_LABELS[i]}</span></button>)}<span className="still-note">STILL VIEW · WEBGL UNAVAILABLE</span></div>
}
class SceneBoundary extends Component<{children:ReactNode;onReady:()=>void;onComputer:(index?:number)=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(){this.props.onReady()}render(){return this.state.failed?<Poster onComputer={this.props.onComputer}/>:this.props.children}}
export default function Room({onReady,reset,focused,onComputer,monitorIndex}:{onReady:()=>void;reset:number}&ComputerProps){
 const [hovered,setHovered]=useState<number|null>(null);
 const [reduced,setReduced]=useState(false),[mobile,setMobile]=useState(false),[hidden,setHidden]=useState(false),[supported,setSupported]=useState<boolean|null>(null);
 useEffect(()=>{let ok=false;try{const c=document.createElement('canvas');const context=c.getContext('webgl2');ok=!!context;if(context)context.getExtension('WEBGL_lose_context')?.loseContext()}catch{}setSupported(ok);if(!ok)onReady()},[]);
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width: 800px)');const update=()=>{setReduced(mq.matches);setMobile(small.matches)};const visibility=()=>setHidden(document.hidden);update();mq.addEventListener('change',update);small.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);return()=>{mq.removeEventListener('change',update);small.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility)}},[]);
 if(supported===null)return null;
 if(!supported)return <Poster onComputer={onComputer}/>;
 return <><SceneBoundary onReady={onReady} onComputer={onComputer}><Canvas camera={{position:[0,3.25,8.5],fov:32,near:.1,far:40}} dpr={mobile?1:[1,1.5]} frameloop={hidden?'never':reduced?'demand':'always'} gl={{antialias:!mobile,alpha:false,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.25}} fallback={<div className="scene-error">Your browser needs WebGL to enter the studio.</div>} onCreated={({gl})=>{gl.setClearColor('#0b0911')}}>
 <ambientLight intensity={.35} color="#ac9ac8"/>
 <hemisphereLight args={['#b2b7ef','#2b1829',1.05]}/>
 <directionalLight position={[-4,5,5]} intensity={2.7} color="#ff8e43"/>
 <directionalLight position={[4,4,2]} intensity={2.3} color="#7650ff"/>
 <pointLight position={[-3.3,2.45,-.65]} color="#ff752f" intensity={23} distance={7} decay={2}/>
 <pointLight position={[3,2.5,-.9]} color="#713dff" intensity={20} distance={7} decay={2}/>
 <Suspense fallback={null}><Model onReady={onReady} reset={reset} reduced={reduced} focused={focused} onComputer={onComputer} monitorIndex={monitorIndex} onHover={setHovered}/></Suspense>
 </Canvas></SceneBoundary>{hovered!==null&&!focused&&<div className="object-hint" role="status">{SCREEN_LABELS[hovered]}</div>}</>
}
