"""Create the editable AFTERHOURS master and export the website GLB.
Run: blender --background --python studio/build_blender.py
All original geometry is described in scene.json. Blender adds bevels,
lighting, smooth normals, timeline animation, and optimized material batches.
"""
import bpy, json, math, os
from mathutils import Vector, Euler
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec=json.load(open(os.path.join(ROOT,'studio','scene.json')))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in bpy.data.materials: bpy.data.materials.remove(m)
materials={}
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
for n,d in spec['materials'].items():
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');hex=d['color'].lstrip('#');color=tuple(linear(int(hex[i:i+2],16)/255) for i in (0,2,4))+(1,)
 p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=d['metal'];p.inputs['Roughness'].default_value=d['rough'];p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=d['em'];m.diffuse_color=color;materials[n]=m
world=bpy.data.objects.new('Studio coordinate root',None);bpy.context.collection.objects.link(world);world.rotation_euler=(math.pi/2,0,0)
groups={};static=[];monitor_parts={i:[] for i in range(3)}
for i in range(3):
 o=bpy.data.objects.new('Monitor'+str(i),None);bpy.context.collection.objects.link(o);o.parent=world;groups[o.name]=o

for d in spec['objects']:
 typ=d['type'];name=d['name']
 if typ=='group':
  o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);groups[name]=o
 elif typ=='box':bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object
 elif typ=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1);o=bpy.context.object
 elif typ=='cylinder':bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=d.get('bottom',1),radius2=d.get('top',1),depth=1);o=bpy.context.object
 elif typ=='lock':
  # Cubic Bezier centerline with tapered elliptic cross-sections.
  pts=[Vector(v) for v in d['path']];verts=[];faces=[];rings=12;sides=8
  for j in range(rings):
   t=j/(rings-1);p=(1-t)**3*pts[0]+3*(1-t)**2*t*pts[1]+3*(1-t)*t*t*pts[2]+t**3*pts[3]
   tangent=(3*(1-t)**2*(pts[1]-pts[0])+6*(1-t)*t*(pts[2]-pts[1])+3*t*t*(pts[3]-pts[2])).normalized()
   side=tangent.cross(Vector((0,0,1))).normalized();up=side.cross(tangent).normalized();radius=d['width']*(.75+math.sin(t*math.pi)*.3)*(1-t)**.55+.001
   for k in range(sides):
    a=k*2*math.pi/sides;verts.append(p+side*math.cos(a)*radius+up*math.sin(a)*radius*.55)
  for j in range(rings-1):
   for k in range(sides):a=j*sides+k;b=j*sides+(k+1)%sides;faces.append((a,b,b+sides,a+sides))
  mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
 elif typ=='torus':bpy.ops.mesh.primitive_torus_add(major_radius=1,minor_radius=d.get('tube',.08),major_segments=40,minor_segments=8);o=bpy.context.object
 o.name=name;o.parent=groups.get(d.get('parent'),world);o.location=d['pos']
 if typ=='group':continue
 o.rotation_euler=d.get('rot',[0,0,0]);o.scale=d['scale']
 if typ=='cylinder':
  # Three.js Y-axis cylinder -> native Blender Z-axis mesh, in master coordinates.
  for v in o.data.vertices:v.co=Vector((v.co.x,v.co.z,-v.co.y))
 o.data.materials.append(materials[d['mat']])
 if typ=='box':
  # Apply local dimensions, then bevel in world-sized units.
  for v in o.data.vertices:v.co.x*=o.scale.x;v.co.y*=o.scale.y;v.co.z*=o.scale.z
  o.scale=(1,1,1)
  bevel=o.modifiers.new('Soft manufactured edges','BEVEL');bevel.width=min(min(d['scale'])*.24,.045);bevel.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
 for p in o.data.polygons:p.use_smooth=typ!='box'
 monitor_index=None
 if name.startswith('monitor '):monitor_index=min(range(3),key=lambda i:abs(d['pos'][0]-[-1.85,1.85,3.25][i]))
 elif name in ['code gutter','code line']:monitor_index=0
 elif name in ['graph grid','math surface']:monitor_index=1
 elif name in ['checkbox','task line']:monitor_index=2
 if monitor_index is not None:
  o.parent=groups['Monitor'+str(monitor_index)];monitor_parts[monitor_index].append(o)
 elif not d.get('parent'):static.append(o)
# Fuse overlapping facial masses into one smooth, editable sculpt mesh.
face_parts=[o for o in groups['Head'].children if o.type=='MESH' and (o.name.startswith(('head cranium','jaw','chin','nose bridge','nose tip','human ear')))]
bpy.ops.object.select_all(action='DESELECT')
for o in face_parts:o.select_set(True)
bpy.context.view_layer.objects.active=face_parts[0];bpy.ops.object.join();face=bpy.context.object;face.name='Sculpted face'
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
remesh=face.modifiers.new('Unified facial sculpt','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.022;remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=face.modifiers.new('Soft facial transitions','SMOOTH');smooth.factor=1.0;smooth.iterations=6;bpy.ops.object.modifier_apply(modifier=smooth.name)
dec=face.modifiers.new('Web topology','DECIMATE');dec.ratio=.55;bpy.ops.object.modifier_apply(modifier=dec.name)
for p in face.data.polygons:p.use_smooth=True
# Editable master retains individual objects, shared materials, and named controls.
head=groups['Head'];body=groups['Body'];bpy.context.scene.frame_end=180
for f,r in [(1,0),(46,.025),(91,0),(136,-.025),(180,0)]:
 head.rotation_euler[1]=r;head.keyframe_insert(data_path='rotation_euler',frame=f)
for f,s in [(1,1),(46,1.008),(91,1),(136,1.008),(180,1)]:
 body.scale.y=s;body.keyframe_insert(data_path='scale',frame=f)
for n in ['EyeL','EyeR']:
 eye=groups[n]
 for f,s in [(1,1),(69,1),(72,.06),(75,1),(180,1)]:eye.scale.y=s;eye.keyframe_insert(data_path='scale',frame=f)
for g in groups.values():
 if g.animation_data and g.animation_data.action:
  g.animation_data.action.name=g.name+'_Idle'
  for fc in g.animation_data.action.fcurves:
   fc.modifiers.new('CYCLES')
bpy.context.scene.frame_set(1)
# Studio lighting matches runtime: amber key, violet rim, cool fill.
def light(name,pos,color,power,size=3):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
light('Amber softbox',(-4,-4,5),(1,.27,.06),850,4);light('Violet rim',(4,-1,4),(.25,.09,1),1100,3);light('Front fill',(0,-6,4),(.8,.65,.5),100,5)
for name,pos,color,power in [('Practical amber',(-3.25,1.08,2.25),(1,.19,.035),100),('Monitor violet',(3,1,2.4),(.21,.045,1),100)]:
 data=bpy.data.lights.new(name,'POINT');data.energy=power;data.color=color;data.shadow_soft_size=.6;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=pos
camdata=bpy.data.cameras.new('Hero camera');cam=bpy.data.objects.new('Hero camera',camdata);bpy.context.collection.objects.link(cam);cam.location=(0,-8.5,3.25);cam.rotation_euler=(Vector((0,0,2.35))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.sensor_fit='VERTICAL';camdata.sensor_height=24;camdata.lens=24/(2*math.tan(math.radians(16)));bpy.context.scene.camera=cam
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=1664;s.render.resolution_y=936;s.render.resolution_percentage=100;s.world.color=(.065,.055,.09);s.view_settings.view_transform='AgX';s.view_settings.exposure=-.8
from bpy_extras.object_utils import world_to_camera_view
bpy.context.view_layer.update()
hotspots=[]
for x,y,w,h in [(-1.85,2.35,1.65,1.28),(1.85,2.35,1.65,1.28),(3.25,2.32,.77,1.42)]:
 a=world_to_camera_view(s,cam,Vector((x-w/2,1.03,y+h/2)));b=world_to_camera_view(s,cam,Vector((x+w/2,1.03,y-h/2)))
 hotspots.append([a.x,1-a.y,b.x-a.x,a.y-b.y])
json.dump({'width':1664,'height':936,'hotspots':hotspots},open(os.path.join(ROOT,'public/models/monitor-hotspots.json'),'w'))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'public/downloads/afterhours.blend'))
# The exported web copy merges static meshes by material. Source remains editable.
for name in materials:
 selection=[o for o in static if o.data.materials[0].name==name]
 if not selection:continue
 static=[o for o in static if o not in selection]
 bpy.ops.object.select_all(action='DESELECT')
 for o in selection:o.select_set(True)
 bpy.context.view_layer.objects.active=selection[0];bpy.ops.object.join();bpy.context.object.name='Room_'+name
# Keep each complete monitor separate from the room for actual geometry raycasting.
for index,parts in monitor_parts.items():
 for material_name in materials:
  chosen=[o for o in parts if o.data.materials[0].name==material_name]
  parts=[o for o in parts if o not in chosen]
  if not chosen:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in chosen:o.select_set(True)
  bpy.context.view_layer.objects.active=chosen[0]
  if len(chosen)>1:bpy.ops.object.join()
  bpy.context.object.name='Monitor'+str(index)+'_'+material_name
# Batch non-articulating avatar parts without flattening eye/head controls.
for group_name in ['Head','Body']:
 children=[o for o in groups[group_name].children if o.type=='MESH']
 for material_name in materials:
  chosen=[o for o in children if o.data.materials[0].name==material_name]
  children=[o for o in children if o not in chosen]
  if len(chosen)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in chosen:o.select_set(True)
  bpy.context.view_layer.objects.active=chosen[0];bpy.ops.object.join();bpy.context.object.name=group_name+'_'+material_name
# Export meshes/empties only. Runtime owns responsive lights and camera.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/room-uncompressed.glb'),export_format='GLB',use_selection=True,export_animations=True,export_yup=True,export_apply=True)
stats={'mesh_objects':sum(o.type=='MESH' for o in s.objects),'triangles':sum(len(p.vertices)-2 for o in s.objects if o.type=='MESH' for p in o.data.polygons),'materials':len(materials)}
json.dump(stats,open(os.path.join(ROOT,'studio/scene-stats.json'),'w'),indent=2);print('SCENE_STATS',stats)
if os.environ.get('RENDER_STUDIO')=='1':
 s.render.filepath=os.path.join(ROOT,'studio/preview.png');bpy.ops.render.render(write_still=True)
