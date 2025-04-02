import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { useRef } from 'react';


function JustGirl({ url, scale, initialPosition }) {
  const ref = useRef();
  const { scene } = useGLTF(url); // Load model

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.position.y = initialPosition[1] + Math.sin(t * 1.5) * 0.1; // Up-down motion
      ref.current.position.x = initialPosition[0] + Math.sin(t) * 0.2; // Side-to-side motion
      ref.current.position.z = initialPosition[2] + Math.cos(t * 0.8) * 0.1; // Forward-backward motion


      ref.current.rotation.y = 10; // -90° to 90° rotation
    }
  });

  return <primitive ref={ref} object={scene} scale={scale} position={initialPosition} />;
}

export default function JustGirlScene() {
  return (
    <Canvas style={{ width: '100vw', height: '100vh' }} camera={{ position: [10, 4, 20], fov: 80}}>
      <ambientLight intensity={0.5} />
      <pointLight position={[1, 1, 1]} />

      {/* Animated Model */}
      <JustGirl url="/models/ftm.glb" scale={[2,2,2]} initialPosition={[6, 0, 0]} />

      <OrbitControls enableZoom={false} enableRotate={false} enableDamping={false} rotateSpeed={3} />
      <Environment preset="forest" />
    </Canvas>
  );
}
