import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Physics } from "@react-three/cannon";
import { Leva, useControls, button } from "leva";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import gsap from "gsap";
import Stats from "stats.js";
import './index.css';

function Galaxy({ position, scale, galaxyConfig }) {
  const points = useRef();
  const materialRef = useRef();

  const {
    count,
    radius,
    branches,
    spin,
    randomness,
    randomnessPower,
    innerColor,
    outerColor,
    size,
    rotationSpeed
  } = useControls(`Galaxy ${position.join(',')}`, {
    count: { value: galaxyConfig.count || 7000, min: 1000, max: 20000, step: 500 },
    radius: { value: galaxyConfig.radius || 8, min: 2, max: 15 },
    branches: { value: galaxyConfig.branches || 5, min: 2, max: 10 },
    spin: { value: galaxyConfig.spin || 1.5, min: -5, max: 5 },
    randomness: { value: galaxyConfig.randomness || 0.4, min: 0, max: 2 },
    randomnessPower: { value: galaxyConfig.randomnessPower || 3.5, min: 1, max: 10 },
    innerColor: galaxyConfig.innerColor || '#ff66cc',
    outerColor: galaxyConfig.outerColor || '#6688ff',
    size: { value: galaxyConfig.size || 0.035, min: 0.01, max: 0.1 },
    rotationSpeed: { value: galaxyConfig.rotationSpeed || 0.0008, min: 0, max: 0.005, step: 0.0001 }
  });

  const galaxyGeometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const insideColor = new THREE.Color(innerColor);
    const outsideColor = new THREE.Color(outerColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;
      const rand = (axis) =>
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r *
        (axis === "y" ? 0.2 : 1);

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + rand("x");
      positions[i3 + 1] = rand("y");
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand("z");
      sizes[i] = size * (0.5 + Math.random() * 0.5);

      const mixedColor = insideColor.clone().lerp(outsideColor, r / radius);
      colors.set([mixedColor.r, mixedColor.g, mixedColor.b], i3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, [count, radius, branches, spin, randomness, randomnessPower, innerColor, outerColor, size]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8
  }), [size]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += rotationSpeed;
      if (materialRef.current) {
        materialRef.current.opacity = 0.8 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      }
    }
  });

  return (
    <points ref={points} geometry={galaxyGeometry} material={material} position={position} scale={scale} />
  );
}

function Scene() {
  const galaxies = [
    { position: [0, 0, 0], scale: [1, 1, 1], galaxyConfig: {
      count: 7000, radius: 8, branches: 5, spin: 1.5, randomness: 0.4, randomnessPower: 3.5,
      innerColor: '#ff66cc', outerColor: '#6688ff', size: 0.035, rotationSpeed: 0.0008
    }},
    { position: [15, 2, -10], scale: [0.6, 0.6, 0.6], galaxyConfig: {
      count: 5000, radius: 6, branches: 3, spin: 2, randomness: 0.5, randomnessPower: 4,
      innerColor: '#66ffcc', outerColor: '#ffcc66', size: 0.025, rotationSpeed: 0.001
    }},
    { position: [-12, -1, -8], scale: [0.8, 0.8, 0.8], galaxyConfig: {
      count: 6000, radius: 7, branches: 4, spin: 1, randomness: 0.3, randomnessPower: 3,
      innerColor: '#cc66ff', outerColor: '#66ccff', size: 0.03, rotationSpeed: 0.0006
    }}
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[20, 20, 20]} intensity={2} decay={2} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      <Sparkles count={400} speed={0.4} scale={[30, 30, 30]} size={2} color="#ffffff" opacity={0.6} />
      {galaxies.map((galaxy, index) => (
        <Galaxy
          key={index}
          position={galaxy.position}
          scale={galaxy.scale}
          galaxyConfig={galaxy.galaxyConfig}
        />
      ))}
      <OrbitControls enableZoom enablePan enableRotate dampingFactor={0.05} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.8} />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
}

export default function App() {
  const headingRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const cameraSettings = useMemo(() => ({
    position: [0, window.innerWidth < 768 ? 6 : 4, 12],
    fov: window.innerWidth < 768 ? 80 : 70,
    near: 0.1,
    far: 1000
  }), []);

  const handleHover = () => {
    gsap.to(headingRef.current, { scale: 1.05, duration: 0.3, ease: "power2.out" });
  };

  const handleHoverOut = () => {
    gsap.to(headingRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  useEffect(() => {
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", delay: 0.3 }
    );

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    stats.dom.style.display = window.innerWidth < 768 ? 'none' : 'block';

    const loop = () => {
      stats.begin();
      stats.end();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const timer = setTimeout(() => setIsLoading(false), 1000);

    return () => {
      document.body.removeChild(stats.dom);
      clearTimeout(timer);
    };
  }, []);

  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  return (
    <div className="w-screen h-screen bg-black text-white font-inter relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-white text-3xl md:text-4xl animate-pulse font-bold tracking-wide">
            Generating Galaxies...
            <div className="mt-4 flex space-x-2 justify-center">
              <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      <h1
        ref={headingRef}
        onMouseEnter={handleHover}
        onMouseLeave={handleHoverOut}
        className="absolute top-8 left-1/2 -translate-x-1/2 text-3xl md:text-4xl font-bold tracking-wide text-pink-200 z-10 select-none drop-shadow-[0_0_10px_rgba(255,102,204,0.8)]"
      >
        ✨ Interstellar Galaxy Cluster
      </h1>
      <button
        onClick={toggleControls}
        className="absolute top-20 right-4 md:right-8 px-4 py-2 bg-pink-500/80 hover:bg-pink-600 rounded-lg text-white text-sm md:text-base transition-colors duration-200 z-10"
      >
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>
      <Canvas camera={cameraSettings} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Physics gravity={[0, 0, 0]}>
          <Scene />
        </Physics>
      </Canvas>
      <Leva collapsed hidden={!showControls} />
    </div>
  );
}