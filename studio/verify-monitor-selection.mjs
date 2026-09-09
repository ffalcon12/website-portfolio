import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Raycaster,Vector3} from 'three';
const buffer=await readFile('public/models/room.glb');
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
// Texture pixels are irrelevant to geometry intersections in this Node-only check.
loader.register(()=>({name:'geometry-test',loadTexture:()=>Promise.resolve(null)}));
const {scene}=await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
scene.updateMatrixWorld(true);
function monitorOf(o){for(;o;o=o.parent){const m=/^Monitor([0-2])(?:_|$)/.exec(o.name);if(m)return +m[1]}return null}
for(let i=0;i<3;i++)assert(scene.getObjectByName('Monitor'+i),'Missing selectable monitor '+i);
const ray=new Raycaster();
// Shoot against the complete GLB, including foreground occluders, not proxies.
for(const [label,x,y,expected] of [['left screen',-2.4,2.6,0],['left bezel',-2.705,2.6,0],['middle screen',2.3,2.6,1],['middle bezel',2.705,2.6,1],['right screen',3.25,2.8,2],['right bezel',3.66,2.8,2],['character',0,2.4,null],['outside screens',-.8,3.6,null]]){
 ray.set(new Vector3(x,y,8.5),new Vector3(0,0,-1));
 const hits=ray.intersectObject(scene,true);assert(hits.length,'No hit for '+label);
 assert.equal(monitorOf(hits[0].object),expected,label+' hit '+hits[0].object.name);
 console.log('PASS',label);
}
