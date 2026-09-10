'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Suspense,
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import { SCREEN_LABELS } from './profile';
import monitorProjection from '../public/models/monitor-hotspots.json';

type ComputerProps = {
  onComputer: (index?: number) => void;
  focused: boolean;
  monitorIndex: number;
  onHover?: (index: number | null) => void;
};

type HighlightMaterial = {
  material: THREE.MeshStandardMaterial;
  emissive: THREE.Color;
  intensity: number;
  emissiveMap: THREE.Texture | null;
  toneMapped: boolean;
};

function monitorOf(object: THREE.Object3D): number | null {
  for (
    let node: THREE.Object3D | null = object;
    node;
    node = node.parent
  ) {
    const match = /^Monitor([0-2])(?:_|$)/.exec(node.name);
    if (match) return Number(match[1]);
  }

  return null;
}

function Model({
  onReady,
  reset,
  reduced,
  focused,
  onComputer,
  monitorIndex,
  onHover,
}: {
  onReady: () => void;
  reset: number;
  reduced: boolean;
} & ComputerProps) {
  const { scene: loadedScene } = useGLTF(
    '/models/room.glb',
    false,
    true,
  );

  // Keep this instance separate from Drei's cached model.
  const scene = useMemo(() => loadedScene.clone(true), [loadedScene]);

  const { camera, pointer, gl, size, invalidate } = useThree();

  const lookTarget = useRef(new THREE.Vector3(0, 2.35, 0));
  const nextLookTarget = useMemo(() => new THREE.Vector3(), []);

  const head = useMemo(() => scene.getObjectByName('Head'), [scene]);
  const body = useMemo(() => scene.getObjectByName('Body'), [scene]);

  const eyes = useMemo(
    () => ['EyeL', 'EyeR'].map((name) => scene.getObjectByName(name)),
    [scene],
  );

  const pupils = useMemo(
    () => ['PupilL', 'PupilR'].map((name) => scene.getObjectByName(name)),
    [scene],
  );

  const monitorMaterials = useRef<HighlightMaterial[][]>([[], [], []]);
  const screenMaterials = useRef<
    { material: THREE.MeshStandardMaterial; intensity: number }[]
  >([]);

  const hovered = useRef<number | null>(null);
  const onHoverRef = useRef(onHover);

  const blink = useRef({
    next: 2 + Math.random() * 3,
    start: -10,
  });

  const frames = useRef(0);
  const elapsed = useRef(0);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  const hover = useCallback(
    (index: number | null) => {
      const changed = hovered.current !== index;
      hovered.current = index;

      gl.domElement.style.cursor = index === null ? 'auto' : 'pointer';

      monitorMaterials.current.forEach((materials, monitor) => {
        materials.forEach((entry) => {
          const material = entry.material;

          if (monitor === index) {
            material.emissive.set('#d4ad32');
            material.emissiveIntensity = 0.7;
            material.emissiveMap = null;
            material.toneMapped = false;
          } else {
            material.emissive.copy(entry.emissive);
            material.emissiveIntensity = entry.intensity;
            material.emissiveMap = entry.emissiveMap;
            material.toneMapped = entry.toneMapped;
          }

          material.needsUpdate = true;
        });
      });

      if (changed) onHoverRef.current?.(index);
      invalidate();
    },
    [gl, invalidate],
  );

  // Clone and install materials in an effect, with matching cleanup.
  // This avoids stale material references during React Strict Mode renders.
  useEffect(() => {
    const originals: {
      mesh: THREE.Mesh;
      material: THREE.Material | THREE.Material[];
    }[] = [];

    const ownedMaterials: THREE.Material[] = [];
    const sets: HighlightMaterial[][] = [[], [], []];
    const animated: {
      material: THREE.MeshStandardMaterial;
      intensity: number;
    }[] = [];

    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;

      const index = monitorOf(mesh);
      const ambientScreen = mesh.name === 'Room_mint';

      if (index === null && !ambientScreen) return;

      originals.push({ mesh, material: mesh.material });

      const source = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      const clones = source.map((original) => {
        const clone = original.clone();
        ownedMaterials.push(clone);

        const material = clone as THREE.MeshStandardMaterial;

        if (material.isMeshStandardMaterial) {
          if (index !== null) {
            sets[index].push({
              material,
              emissive: material.emissive.clone(),
              intensity: material.emissiveIntensity,
              emissiveMap: material.emissiveMap,
              toneMapped: material.toneMapped,
            });
          } else {
            animated.push({
              material,
              intensity: material.emissiveIntensity,
            });
          }
        }

        return clone;
      });

      mesh.material = Array.isArray(mesh.material)
        ? clones
        : clones[0];
    });

    monitorMaterials.current = sets;
    screenMaterials.current = animated;
    invalidate();

    return () => {
      originals.forEach(({ mesh, material }) => {
        mesh.material = material;
      });

      ownedMaterials.forEach((material) => material.dispose());

      monitorMaterials.current = [[], [], []];
      screenMaterials.current = [];
      hovered.current = null;
      gl.domElement.style.cursor = 'auto';
    };
  }, [scene, gl, invalidate]);

  useEffect(() => {
    onReady();
  }, [scene, onReady]);

  useEffect(() => {
    pointer.set(0, 0);
    camera.position.set(0, 3.25, 8.5);
    hover(null);
  }, [reset, camera, pointer, hover]);

  useEffect(() => {
    if (focused) hover(null);
    invalidate();
  }, [focused, hover, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const clearHover = () => hover(null);

    canvas.addEventListener('pointerleave', clearHover);
    canvas.addEventListener('pointercancel', clearHover);

    return () => {
      canvas.removeEventListener('pointerleave', clearHover);
      canvas.removeEventListener('pointercancel', clearHover);
    };
  }, [gl, hover]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-delta * 3);
    const mobile = size.width < 800;

    const x = reduced ? 0 : pointer.x;
    const y = reduced ? 0 : pointer.y;
    const ease = reduced ? 1 : k;
    const monitorX = [-1.85, 1.85, 3.25][monitorIndex] ?? 1.85;

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      focused ? monitorX : x * 0.19,
      ease,
    );

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      focused ? 2.35 : 3.25 + y * 0.1,
      ease,
    );

    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      focused ? 1 : mobile ? 10.9 : 8.5,
      ease,
    );

    nextLookTarget.set(
      focused ? monitorX : 0,
      2.35,
      focused ? -1.5 : 0,
    );

    lookTarget.current.lerp(nextLookTarget, ease);
    camera.lookAt(lookTarget.current);

    if (head) {
      head.rotation.z = THREE.MathUtils.lerp(
        head.rotation.z,
        -x * 0.08,
        k,
      );

      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        -y * 0.04 + (reduced ? 0 : Math.sin(t * 0.6) * 0.014),
        k,
      );

      head.rotation.y = reduced ? 0 : Math.sin(t * 0.42) * 0.018;
    }

    if (body) {
      body.scale.z = reduced ? 1 : 1 + Math.sin(t * 1.6) * 0.007;
    }

    if (!reduced) {
      if (t > blink.current.next) {
        blink.current.start = t;
        blink.current.next = t + 3 + Math.random() * 4;
      }

      const progress = (t - blink.current.start) / 0.19;
      const scale =
        progress >= 0 && progress < 1
          ? 1 - Math.sin(progress * Math.PI) * 0.94
          : 1;

      eyes.forEach((eye) => {
        if (eye) eye.scale.z = scale;
      });

      pupils.forEach((pupil) => {
        if (!pupil) return;
        pupil.position.x = 0.012 + x * 0.014;
        pupil.position.z = 0.009 - y * 0.015;
      });
    } else {
      eyes.forEach((eye) => {
        if (eye) eye.scale.z = 1;
      });
    }

    screenMaterials.current.forEach(({ material, intensity }) => {
      material.emissiveIntensity =
        intensity + (reduced ? 0 : Math.sin(t * 0.8) * 0.035);
    });

    frames.current++;
    elapsed.current += delta;

    if (elapsed.current > 2) {
      const canvas = gl.domElement;

      canvas.dataset.fps = String(
        Math.round(frames.current / elapsed.current),
      );
      canvas.dataset.drawCalls = String(gl.info.render.calls);
      canvas.dataset.triangles = String(gl.info.render.triangles);

      frames.current = 0;
      elapsed.current = 0;
    }
  });

  return (
    <primitive
      object={scene}
      dispose={null}
      onPointerOver={(event: {
        stopPropagation: () => void;
        object: THREE.Object3D;
      }) => {
        event.stopPropagation();
        hover(focused ? null : monitorOf(event.object));
      }}
      onPointerMove={(event: {
        stopPropagation: () => void;
        object: THREE.Object3D;
      }) => {
        event.stopPropagation();
        hover(focused ? null : monitorOf(event.object));
      }}
      onPointerOut={() => hover(null)}
      onClick={(event: {
        stopPropagation: () => void;
        object: THREE.Object3D;
      }) => {
        event.stopPropagation();
        if (focused) return;

        const index = monitorOf(event.object);

        if (index !== null) {
          hover(null);
          onComputer(index);
        }
      }}
    />
  );
}

function Poster({
  onComputer,
}: {
  onComputer: (index?: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 1664, h: 936 });
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setBounds({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = Math.max(bounds.w / 1664, bounds.h / 936);
  const offsetX = (bounds.w - 1664 * scale) / 2;
  const offsetY = (bounds.h - 936 * scale) / 2;

  return (
    <div className="poster-room" ref={container}>
      <img
        src="/models/room-poster.webp"
        alt="A creator at a desk with three clickable monitors"
      />

      {monitorProjection.hotspots.map(([x, y, w, h], index) => (
        <button
          key={index}
          className="poster-monitor"
          style={{
            left: offsetX + x * 1664 * scale,
            top: offsetY + y * 936 * scale,
            width: w * 1664 * scale,
            height: h * 936 * scale,
            background:
              hovered === index ? 'rgba(255, 227, 90, 0.2)' : undefined,
            outline: hovered === index ? '2px solid #ffe35a' : undefined,
            boxShadow:
              hovered === index
                ? '0 0 24px rgba(255, 227, 90, 0.5)'
                : undefined,
          }}
          aria-label={SCREEN_LABELS[index]}
          onPointerEnter={() => setHovered(index)}
          onPointerLeave={() => setHovered(null)}
          onFocus={() => setHovered(index)}
          onBlur={() => setHovered(null)}
          onClick={() => onComputer(index)}
        >
          <span className="poster-hover-label">
            {SCREEN_LABELS[index]}
          </span>
        </button>
      ))}

      <span className="still-note">STILL VIEW · WEBGL UNAVAILABLE</span>
    </div>
  );
}

class SceneBoundary extends Component<
  {
    children: ReactNode;
    onReady: () => void;
    onComputer: (index?: number) => void;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onReady();
  }

  render() {
    return this.state.failed ? (
      <Poster onComputer={this.props.onComputer} />
    ) : (
      this.props.children
    );
  }
}

export default function Room({
  onReady,
  reset,
  focused,
  onComputer,
  monitorIndex,
}: {
  onReady: () => void;
  reset: number;
} & ComputerProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let available = false;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      available = !!context;
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      available = false;
    }

    setSupported(available);
  }, []);

  useEffect(() => {
    if (supported === false) onReady();
  }, [supported, onReady]);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 800px)');

    const update = () => {
      setReduced(motion.matches);
      setMobile(small.matches);
    };

    const visibility = () => setHidden(document.hidden);

    update();
    visibility();

    motion.addEventListener('change', update);
    small.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);

    return () => {
      motion.removeEventListener('change', update);
      small.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  if (supported === null) return null;
  if (!supported) return <Poster onComputer={onComputer} />;

  return (
    <>
      <SceneBoundary onReady={onReady} onComputer={onComputer}>
        <Canvas
          camera={{
            position: [0, 3.25, 8.5],
            fov: 32,
            near: 0.1,
            far: 40,
          }}
          dpr={mobile ? 1 : [1, 1.5]}
          frameloop={hidden ? 'never' : reduced ? 'demand' : 'always'}
          gl={{
            antialias: !mobile,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.25,
          }}
          fallback={
            <div className="scene-error">
              Your browser needs WebGL to enter the studio.
            </div>
          }
          onCreated={({ gl }) => {
            gl.setClearColor('#0b0911');
          }}
        >
          <ambientLight intensity={0.35} color="#ac9ac8" />
          <hemisphereLight args={['#b2b7ef', '#2b1829', 1.05]} />

          <directionalLight
            position={[-4, 5, 5]}
            intensity={2.7}
            color="#ff8e43"
          />

          <directionalLight
            position={[4, 4, 2]}
            intensity={2.3}
            color="#7650ff"
          />

          <pointLight
            position={[-3.3, 2.45, -0.65]}
            color="#ff752f"
            intensity={23}
            distance={7}
            decay={2}
          />

          <pointLight
            position={[3, 2.5, -0.9]}
            color="#713dff"
            intensity={20}
            distance={7}
            decay={2}
          />

          <Suspense fallback={null}>
            <Model
              onReady={onReady}
              reset={reset}
              reduced={reduced}
              focused={focused}
              onComputer={onComputer}
              monitorIndex={monitorIndex}
              onHover={setHovered}
            />
          </Suspense>
        </Canvas>
      </SceneBoundary>

      {hovered !== null && !focused && (
        <div className="object-hint" role="status">
          {SCREEN_LABELS[hovered]}
        </div>
      )}
    </>
  );
}