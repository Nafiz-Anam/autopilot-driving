"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Road surface ──────────────────────────────────────────── */
function Road() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -22]} receiveShadow>
      <planeGeometry args={[7, 75]} />
      <meshStandardMaterial color="#111111" roughness={0.96} metalness={0.04} />
    </mesh>
  );
}

/* ─── Kerb / edge strips ────────────────────────────────────── */
function RoadEdges() {
  return (
    <>
      {([-3.35, 3.35] as number[]).map((x) => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.005, -22]}
        >
          <planeGeometry args={[0.22, 75]} />
          <meshStandardMaterial
            color="#FF5500"
            emissive="#FF5500"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─── Animated centre-lane dashes ───────────────────────────── */
function LaneDashes({ x = 0 }: { x?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.z += dt * 16;
    if (ref.current.position.z > 8) ref.current.position.z -= 50;
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.012, -50 + i * 4.2]}
        >
          <planeGeometry args={[0.07, 1.9]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={2.5}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Stylized geometric car ────────────────────────────────── */
interface CarProps {
  laneX: number;
  startZ: number;
  speed: number;
  color: string;
  brand?: boolean;
}
function Car({ laneX, startZ, speed, color, brand = false }: CarProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.z += dt * speed;
    if (ref.current.position.z > 12) ref.current.position.z -= 58;
  });

  const mat = { roughness: 0.22, metalness: 0.88 };

  return (
    <group ref={ref} position={[laneX, 0.24, startZ]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.92, 0.3, 2.0]} />
        <meshStandardMaterial color={color} {...mat} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.27, -0.14]} castShadow>
        <boxGeometry args={[0.74, 0.27, 0.98]} />
        <meshStandardMaterial color={color} {...mat} />
      </mesh>
      {/* Windscreen glint */}
      <mesh position={[0, 0.27, 0.37]}>
        <boxGeometry args={[0.68, 0.22, 0.04]} />
        <meshStandardMaterial
          color="#88C0FF"
          emissive="#88C0FF"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Wheels */}
      {(
        [
          [0.47, -0.16, 0.6],
          [-0.47, -0.16, 0.6],
          [0.47, -0.16, -0.6],
          [-0.47, -0.16, -0.6],
        ] as [number, number, number][]
      ).map(([wx, wy, wz], i) => (
        <mesh key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
          <meshStandardMaterial color="#222222" roughness={0.9} />
        </mesh>
      ))}
      {/* Headlights */}
      {(
        [
          [0.3, 0.04, 1.02],
          [-0.3, 0.04, 1.02],
        ] as [number, number, number][]
      ).map(([hx, hy, hz], i) => (
        <group key={i}>
          <mesh position={[hx, hy, hz]}>
            <boxGeometry args={[0.2, 0.1, 0.04]} />
            <meshStandardMaterial
              color="#FFE8A0"
              emissive="#FFE8A0"
              emissiveIntensity={5}
            />
          </mesh>
          <pointLight
            position={[hx, hy, hz + 0.1]}
            color="#FFE8A0"
            intensity={brand ? 6 : 4}
            distance={5}
            decay={2}
          />
        </group>
      ))}
      {/* Taillights */}
      {(
        [
          [0.34, 0.04, -1.02],
          [-0.34, 0.04, -1.02],
        ] as [number, number, number][]
      ).map(([tx, ty, tz], i) => (
        <mesh key={i} position={[tx, ty, tz]}>
          <boxGeometry args={[0.19, 0.1, 0.04]} />
          <meshStandardMaterial
            color="#E8200A"
            emissive="#E8200A"
            emissiveIntensity={brand ? 7 : 5}
          />
        </mesh>
      ))}
      <pointLight
        position={[0, 0.06, -1.06]}
        color="#E8200A"
        intensity={brand ? 4 : 2.5}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}

/* ─── Bokeh particles ───────────────────────────────────────── */
function Particles() {
  const count = 90;
  const { geometry } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 5.5 + 0.2;
      pos[i * 3 + 2] = Math.random() * -45;
      // orange or cool-white
      const warm = Math.random() > 0.4;
      col[i * 3] = 1;
      col[i * 3 + 1] = warm ? 0.32 : 0.88;
      col[i * 3 + 2] = warm ? 0.0 : 0.65;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geometry: geo };
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Street-light poles ────────────────────────────────────── */
function StreetLights() {
  const positions: [number, number, number][] = [
    [-3.6, 0, -5],
    [3.6, 0, -12],
    [-3.6, 0, -20],
    [3.6, 0, -28],
    [-3.6, 0, -36],
  ];
  return (
    <>
      {positions.map(([x, , z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Pole */}
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 4.4, 6]} />
            <meshStandardMaterial color="#444444" roughness={0.9} />
          </mesh>
          {/* Arm */}
          <mesh position={[x < 0 ? 0.3 : -0.3, 4.4, 0]} rotation={[0, 0, x < 0 ? 0.3 : -0.3]}>
            <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
            <meshStandardMaterial color="#444444" roughness={0.9} />
          </mesh>
          {/* Lamp */}
          <pointLight
            position={[x < 0 ? 0.5 : -0.5, 4.6, 0]}
            color="#FFD080"
            intensity={12}
            distance={7}
            decay={2}
          />
          <mesh position={[x < 0 ? 0.5 : -0.5, 4.5, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial
              color="#FFD080"
              emissive="#FFD080"
              emissiveIntensity={4}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ─── Full Scene ────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.12} color="#1A2040" />
      <directionalLight position={[2, 14, 6]} intensity={0.35} color="#C8D8FF" />
      <fog attach="fog" args={["#060608", 16, 40]} />

      <Road />
      <RoadEdges />
      <LaneDashes x={-1.1} />
      <LaneDashes x={1.1} />
      <StreetLights />

      {/* Left lane — dark navy cars */}
      <Car laneX={-1.7} startZ={0} speed={13} color="#1A1A2E" />
      <Car laneX={-1.7} startZ={-20} speed={18} color="#0D1B2A" />
      <Car laneX={-1.7} startZ={-38} speed={14} color="#162032" />

      {/* Centre — brand red hero car */}
      <Car laneX={0} startZ={-8} speed={11} color="#C41808" brand />

      {/* Right lane — dark cars */}
      <Car laneX={1.7} startZ={-14} speed={16} color="#16213E" />
      <Car laneX={1.7} startZ={-30} speed={20} color="#1C1C2E" />

      <Particles />
    </>
  );
}

/* ─── Canvas export ─────────────────────────────────────────── */
export function DrivingSceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 7, 10], fov: 52 }}
      gl={{ antialias: true, alpha: false }}
      shadows
      style={{ background: "#080810" }}
    >
      <Scene />
    </Canvas>
  );
}
