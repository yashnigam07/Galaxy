import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Physics } from "@react-three/cannon";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import gsap from "gsap";
import Stats from "stats.js";
import './index.css';

function Galaxy() {
  const points = useRef();
  const {
    count,
    radius,
    branches,
    spin,
    randomness,
    randomnessPower,
    innerColor,
    outerColor,
    size
  } = useControls("Galaxy", {
    count: { value: 6000, min: 1000, max: 20000, step: 500 },
    radius: { value: 6, min: 1, max: 15 },
    branches: { value: 4, min: 2, max: 10 },
    spin: { value: 1.5, min: -5, max: 5 },
    randomness: { value: 0.3, min: 0, max: 2 },
    randomnessPower: { value: 3, min: 1, max: 10 },
    innerColor: '#ff6bff',
    outerColor: '#6b6bff',
    size: { value: 0.035, min: 0.01, max: 0.1 }
  });

  const galaxyGeometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color(innerColor);
    const colorOutside = new THREE.Color(outerColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;

      const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

      positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * r + randomX;
      positions[i3 + 1] = randomY * 0.1;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

      const mixedColor = colorInside.clone().lerp(colorOutside, r / radius);
      colors[i3 + 0] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, radius, branches, spin, randomness, randomnessPower, innerColor, outerColor]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    depthWrite: false,
    vertexColors: true
  }), [size]);

  useFrame(() => {
    if (points.current) points.current.rotation.y += 0.001;
  });

  return (
    <points ref={points} geometry={galaxyGeometry} material={material} />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[20, 20, 20]} intensity={1.5} />
      <Sparkles count={300} speed={0.3} scale={[30, 30, 30]} size={2} color="#ffffff" />
      <Galaxy />
      <OrbitControls enableZoom enablePan />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </>
  );
}

export default function App() {
  const headingRef = useRef();
  const [isLoading, setIsLoading] = useState(true);

  const cameraSettings = useMemo(() => ({
    position: [0, window.innerWidth < 768 ? 5 : 3, 10],
    fov: window.innerWidth < 768 ? 75 : 65
  }), []);

  const handleHover = () => {
    gsap.to(headingRef.current, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleHoverOut = () => {
    gsap.to(headingRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  useEffect(() => {
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: -40 },
      { opacity: 1, y: 0, duration: 2, ease: "power4.out", delay: 0.5 }
    );

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    const loop = () => {
      stats.begin();
      stats.end();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    setIsLoading(false);

    return () => document.body.removeChild(stats.dom);
  }, []);

  return (
    <div className="w-screen h-screen bg-black text-white font-inter relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-white text-2xl animate-pulse">Loading Galaxy...</div>
        </div>
      )}
      <h1 
        ref={headingRef} 
        onMouseEnter={handleHover}
        onMouseLeave={handleHoverOut}
        className="absolute top-8 left-1/2 -translate-x-1/2 text-4xl font-bold tracking-wide text-pink-200 z-10 select-none"
      >
        ✨ Interstellar Galaxy Simulation
      </h1>
      <Canvas camera={cameraSettings}>
        <Physics gravity={[0, 0, 0]}>
          <Scene />
        </Physics>
      </Canvas>
      <Leva collapsed />
    </div>
  );
}