import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sphere, OrbitControls, Environment, PointMaterial, Points, Html } from "@react-three/drei";
import * as THREE from "three";

// Real-world malnutrition data (WHO/UNICEF JME dataset for under-5s, expanded to context)
const REGIONS = [
  { name: "India", lat: 20.5937, lon: 78.9629, stunting: "31.7%", wasting: "18.7%", severe: "7.5%" },
  { name: "Nigeria", lat: 9.0820, lon: 8.6753, stunting: "31.5%", wasting: "6.5%", severe: "2.5%" },
  { name: "Yemen", lat: 15.5527, lon: 48.5164, stunting: "45.0%", wasting: "10.0%", severe: "4.5%" },
  { name: "Guatemala", lat: 15.7835, lon: -90.2308, stunting: "42.8%", wasting: "0.7%", severe: "0.2%" },
  { name: "Ethiopia", lat: 9.1450, lon: 40.4897, stunting: "34.0%", wasting: "7.0%", severe: "2.1%" },
  { name: "Pakistan", lat: 30.3753, lon: 69.3451, stunting: "34.0%", wasting: "7.1%", severe: "2.0%" },
  { name: "Bangladesh", lat: 23.6850, lon: 90.3563, stunting: "28.0%", wasting: "9.8%", severe: "2.0%" },
  { name: "Somalia", lat: 5.1521, lon: 46.1996, stunting: "27.0%", wasting: "14.2%", severe: "3.2%" },
  { name: "Afghanistan", lat: 33.9391, lon: 67.7100, stunting: "45.0%", wasting: "9.5%", severe: "3.0%" },
  { name: "Niger", lat: 17.6078, lon: 8.0817, stunting: "47.0%", wasting: "10.3%", severe: "2.5%" },
  { name: "DR Congo", lat: -4.0383, lon: 21.7587, stunting: "42.0%", wasting: "8.1%", severe: "2.0%" },
  { name: "Madagascar", lat: -18.7669, lon: 46.8691, stunting: "38.9%", wasting: "7.2%", severe: "1.5%" },
  { name: "Indonesia", lat: -0.7893, lon: 113.9213, stunting: "21.6%", wasting: "7.7%", severe: "2.1%" },
  { name: "Philippines", lat: 12.8797, lon: 121.7740, stunting: "26.7%", wasting: "5.5%", severe: "1.0%" },
  { name: "Chad", lat: 15.4542, lon: 18.7322, stunting: "30.4%", wasting: "13.6%", severe: "4.1%" },
  { name: "Mali", lat: 17.5707, lon: -3.9962, stunting: "25.9%", wasting: "10.8%", severe: "2.8%" },
  { name: "South Sudan", lat: 6.8770, lon: 31.3070, stunting: "31.3%", wasting: "22.7%", severe: "5.0%" },
  { name: "Syria", lat: 34.8021, lon: 38.9968, stunting: "27.4%", wasting: "3.5%", severe: "0.5%" },
  { name: "Burundi", lat: -3.3731, lon: 29.9189, stunting: "55.8%", wasting: "5.1%", severe: "1.0%" },
  { name: "Haiti", lat: 18.9712, lon: -72.2852, stunting: "22.7%", wasting: "3.7%", severe: "1.0%" }
];

// Helper to convert Lat/Long to 3D Cartesian coordinates
function latLongToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return [x, y, z];
}

function GlobeInner({
  setHovered,
  setMousePos,
  setActiveRegion
}: {
  setHovered: (v: boolean) => void,
  setMousePos: (p: { x: number, y: number }) => void,
  setActiveRegion: (region: any) => void
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Load the downloaded earth specular map (black oceans, white land)
  const earthAlphaMap = useLoader(THREE.TextureLoader, "/assets/images/earth_alpha.jpg");
  earthAlphaMap.mapping = THREE.EquirectangularReflectionMapping;

  // Rotate globe: slow normal, fast when hovered over a specific region
  const isHovered = useRef(false);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += isHovered.current ? 0 : delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Invisible interaction catcher sphere */}
      <Sphere
        args={[1.55, 64, 64]}
        visible={false}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false);
          setActiveRegion(null);
          isHovered.current = false;
        }}
        onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      />

      {/* Earth Oceans via Specular Map Texture (Ocean Blue) */}
      <Sphere args={[1.5, 64, 64]}>
        <meshStandardMaterial
          color="#1e3a8a"
          transparent={true}
          alphaMap={earthAlphaMap}
          opacity={0.95}
          roughness={0.1}
          flatShading={false}
        />
      </Sphere>

      {/* Landmass/Core sphere (Earthy Green) */}
      <Sphere args={[1.48, 64, 64]}>
        <meshStandardMaterial color="#16a34a" roughness={0.6} metalness={0.1} flatShading={false} />
      </Sphere>

      {/* Grid Overlay */}
      <Sphere args={[1.52, 32, 32]}>
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </Sphere>

      {/* Data Region Markers */}
      {REGIONS.map((region, i) => {
        const pos = latLongToVector3(region.lat, region.lon, 1.54);
        return (
          <group key={i} position={pos}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                isHovered.current = true;
                setActiveRegion(region);
                setHovered(true);
              }}
              onPointerOut={(e) => {
                isHovered.current = false;
                setActiveRegion(null);
              }}
            >
              <sphereGeometry args={[0.04, 32, 32]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
            {/* Ping animation effect */}
            <mesh>
              <ringGeometry args={[0.05, 0.08, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function GlobeHero() {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeRegion, setActiveRegion] = useState<any>(null);

  return (
    <div className="-mt-12 relative w-full aspect-square max-w-[700px] mx-auto lg:ml-auto xl:mr-5">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} className="cursor-crosshair overflow-visible">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-5, -3, -5]} intensity={1.5} color="#bae6fd" />

        <React.Suspense fallback={null}>
          <GlobeInner
            setHovered={setHovered}
            setMousePos={setMousePos}
            setActiveRegion={setActiveRegion}
          />
        </React.Suspense>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate={!activeRegion} autoRotateSpeed={0.5} />
      </Canvas>

      {/* Persistent Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl p-4 w-64 shadow-2xl transition-opacity animate-in fade-in"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y + 20,
            background: "rgba(10, 12, 18, 0.85)",
            backdropFilter: "blur(12px)",
            border: activeRegion ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(16, 185, 129, 0.3)"
          }}
        >
          {activeRegion ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold text-amber-500 uppercase">{activeRegion.name} Data</span>
              </div>
              <h4 className="text-white font-display font-semibold text-[13px]">Child Malnutrition Estimates</h4>
              <ul className="mt-3 space-y-2 text-xs text-gray-300">
                <li className="flex justify-between items-center">
                  <span>Delayed Growth (Stunting)</span>
                  <span className="font-mono text-emerald-400 font-bold">{activeRegion.stunting}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Acute Weight Loss (Wasted)</span>
                  <span className="font-mono text-amber-400 font-bold">{activeRegion.wasting}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>% Children in Severe Condition</span>
                  <span className="font-mono text-red-400 font-bold">{activeRegion.severe}</span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-amber-500/20 text-[10px] text-gray-400">
                Data reflects latest available JME WHO metrics.
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Global Scan</span>
              </div>
              <h4 className="text-white font-display font-semibold text-sm">Detecting Impact Areas</h4>
              <div className="mt-3 text-xs text-gray-300">
                Hover over the orange <strong>hotspots</strong> to view localized WHO malnutrition data for children 0-10 years.
              </div>
              <div className="mt-3 space-y-2 text-xs text-gray-400 border-t border-emerald-500/20 pt-3">
                <li className="flex justify-between">
                  <span>Global Delayed Growth:</span><span className="font-mono">149M+</span>
                </li>
                <li className="flex justify-between">
                  <span>Global Acute Malnutrition:</span><span className="font-mono">45M+</span>
                </li>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
