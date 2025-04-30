import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { extend, Canvas, useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// Define the shader material for the cursor line
const CursorLineMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(1, 1, 1),
    lineWidth: 0.0015,
    lineLength: 0.08,
    speed: 0.6,
    fadeOpacity: 1.0,
    resolution: new THREE.Vector2(0, 0),
    mousePos: new THREE.Vector2(0, 0),
    prevMousePos: new THREE.Vector2(0, 0),
    movementSpeed: 0.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mousePos;
    uniform vec2 prevMousePos;
    uniform float lineWidth;
    uniform float lineLength;
    uniform float movementSpeed;
    uniform float fadeOpacity;
    
    varying vec2 vUv;
    
    float distToLine(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * t);
    }
    
    vec3 hsvToRgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec2 st = gl_FragCoord.xy / resolution.xy;
      st.y = 1.0 - st.y; // Flip y
      
      float dist = distToLine(st, prevMousePos, mousePos);
      
      // Dynamic line width based on movement speed
      float width = lineWidth * (1.0 + movementSpeed * 6.0);
      float intensity = smoothstep(width, 0.0, dist);
      
      // RGB color based on time and movement
      float hue = fract(time * 0.15 + movementSpeed);
      vec3 rgbColor = hsvToRgb(vec3(hue, 0.9, 1.0));
      
      // Add enhanced glow effect
      float glow = smoothstep(width * 6.0, 0.0, dist) * 0.7;
      
      // Fade out based on distance from current mouse position
      float distFromCurrent = length(st - mousePos);
      float fade = smoothstep(lineLength, 0.0, distFromCurrent);
      
      // Final color combining intensity, RGB, glow, and fade
      vec3 finalColor = rgbColor * intensity + rgbColor * glow * 0.6;
      
      gl_FragColor = vec4(finalColor, (intensity + glow) * fade * fadeOpacity);
    }
  `
);

extend({ CursorLineMaterial });

function CursorLineEffect() {
  const materialRef = useRef();
  const { viewport, size } = useThree();
  const mousePos = useRef(new THREE.Vector2(0, 0));
  const prevMousePos = useRef(new THREE.Vector2(0, 0));
  const lastMoveTime = useRef(0);
  const movementSpeed = useRef(0);
  
  useEffect(() => {
    const updateMousePosition = (e) => {
      // Calculate normalized device coordinates (-1 to +1) for the mouse position
      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      
      // Calculate movement speed
      const now = performance.now();
      const dt = Math.min(1.0, (now - lastMoveTime.current) / 16.67); // Cap delta time
      
      if (dt > 0) {
        const dx = x - mousePos.current.x;
        const dy = y - mousePos.current.y;
        const newSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
        
        // Smooth the movement speed
        movementSpeed.current = movementSpeed.current * 0.8 + newSpeed * 0.2;
      }
      
      // Update previous mouse position
      prevMousePos.current.x = mousePos.current.x;
      prevMousePos.current.y = mousePos.current.y;
      
      // Update current mouse position
      mousePos.current.x = x;
      mousePos.current.y = y;
      
      lastMoveTime.current = now;
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('touchmove', (e) => {
      updateMousePosition(e.touches[0]);
    });

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('touchmove', updateMousePosition);
    };
  }, [size]);

  useFrame((state) => {
    if (materialRef.current) {
      // Update time uniform for animation
      materialRef.current.time = state.clock.elapsedTime;
      
      // Update cursor position uniforms
      materialRef.current.mousePos = mousePos.current;
      materialRef.current.prevMousePos = prevMousePos.current;
      materialRef.current.resolution = new THREE.Vector2(size.width, size.height);
      materialRef.current.movementSpeed = Math.min(1.0, movementSpeed.current);
      
      // Gradually decrease movement speed
      movementSpeed.current *= 0.95;
      
      // Fade out when not moving for a while
      const timeSinceLastMove = performance.now() - lastMoveTime.current;
      if (timeSinceLastMove > 1000) {
        materialRef.current.fadeOpacity = Math.max(0, 1 - (timeSinceLastMove - 1000) / 1000);
      } else {
        materialRef.current.fadeOpacity = 1.0;
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <cursorLineMaterial ref={materialRef} transparent depthWrite={false} />
    </mesh>
  );
}

export default function CursorRipple() {
  return (
    <div className="cursor-ripple-container">
      <Canvas style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}>
        <CursorLineEffect />
      </Canvas>
    </div>
  );
} 