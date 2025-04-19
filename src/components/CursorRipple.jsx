import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { extend, Canvas, useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// Define the shader material for the cursor line
const CursorLineMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(1, 1, 1),
    lineWidth: 0.003,
    lineLength: 0.12,
    speed: 0.8,
    fadeOpacity: 1.0,
    resolution: new THREE.Vector2(0, 0),
    mousePos: new THREE.Vector2(0.5, 0.5), // default position at center
    prevMousePos: new THREE.Vector2(0.5, 0.5), // default position at center
    movementSpeed: 0.0,
    glitchAmount: 0.0,
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
    uniform float glitchAmount;
    
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
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
      
      // Apply glitch effect when moving fast
      vec2 adjustedPrevMousePos = prevMousePos;
      if (glitchAmount > 0.1) {
        float noise = random(st + time) * 2.0 - 1.0;
        adjustedPrevMousePos += vec2(noise, noise) * glitchAmount * 0.01;
      }
      
      // Calculate multiple trail segments for a longer trail effect
      float dist1 = distToLine(st, adjustedPrevMousePos, mousePos);
      
      // Create additional segments for a longer trail
      vec2 dir = mousePos - adjustedPrevMousePos;
      vec2 offsetPos = adjustedPrevMousePos - dir * 0.5;
      vec2 offsetPos2 = adjustedPrevMousePos - dir * 1.0;
      
      float dist2 = distToLine(st, offsetPos, adjustedPrevMousePos);
      float dist3 = distToLine(st, offsetPos2, offsetPos);
      
      // Dynamic line width based on movement speed
      float width = lineWidth * (1.0 + movementSpeed * 8.0);
      
      // Create intensity for each segment with different falloff for longer trail
      float intensity1 = smoothstep(width, 0.0, dist1);
      float intensity2 = smoothstep(width * 0.9, 0.0, dist2) * 0.8;
      float intensity3 = smoothstep(width * 0.8, 0.0, dist3) * 0.6;
      
      // Combine intensities
      float combinedIntensity = max(intensity1, max(intensity2, intensity3));
      
      // Base color
      float hue = fract(time * 0.15 + movementSpeed);
      vec3 rgbColor = hsvToRgb(vec3(hue, 0.9, 1.0));
      
      // Add enhanced glow effect
      float glow = smoothstep(width * 8.0, 0.0, min(dist1, min(dist2, dist3))) * 0.8;
      
      // Fade out based on distance from current mouse position
      float distFromCurrent = length(st - mousePos);
      float fade = smoothstep(lineLength, 0.0, distFromCurrent);
      
      // Add glitch effect when moving fast
      if (glitchAmount > 0.2) {
        float glitchNoise = random(st * 10.0 + time * 5.0);
        rgbColor = mix(rgbColor, vec3(glitchNoise), glitchAmount * 0.1);
        
        // Add color shift for glitch effect
        vec3 shiftedColor = hsvToRgb(vec3(fract(hue + 0.33), 0.9, 1.0));
        rgbColor = mix(rgbColor, shiftedColor, glitchNoise * glitchAmount);
      }
      
      // Make the cursor always somewhat visible even when not moving fast
      float baseVisibility = 0.15;
      
      // Final color combining intensity, RGB, glow, and fade
      vec3 finalColor = rgbColor * (combinedIntensity + glow);
      
      // Ensure minimum visibility when mouse is on screen
      float alpha = max(baseVisibility, (combinedIntensity + glow) * fade * fadeOpacity);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ CursorLineMaterial });

function CursorLineEffect() {
  const materialRef = useRef();
  const { viewport, size } = useThree();
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5)); // Start in the center
  const prevMousePos = useRef(new THREE.Vector2(0.5, 0.5)); // Start in the center
  const lastMoveTime = useRef(0);
  const movementSpeed = useRef(0);
  const glitchAmount = useRef(0);
  const lastPositions = useRef([]);
  const isMouseOverCanvas = useRef(false);
  
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
        movementSpeed.current = movementSpeed.current * 0.7 + newSpeed * 0.3;
        
        // Set glitch amount based on movement speed
        glitchAmount.current = Math.max(0, movementSpeed.current - 0.3) * 0.8;
      }
      
      // Store last few positions for trail
      lastPositions.current.unshift({ x, y, time: now });
      if (lastPositions.current.length > 10) {
        lastPositions.current.pop();
      }
      
      // Update previous mouse position
      prevMousePos.current.x = mousePos.current.x;
      prevMousePos.current.y = mousePos.current.y;
      
      // Update current mouse position
      mousePos.current.x = x;
      mousePos.current.y = y;
      
      lastMoveTime.current = now;
      isMouseOverCanvas.current = true;
    };
    
    const handleMouseOut = () => {
      isMouseOverCanvas.current = false;
    };
    
    const handleMouseOver = () => {
      isMouseOverCanvas.current = true;
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('touchmove', (e) => {
      updateMousePosition(e.touches[0]);
    });
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('touchmove', updateMousePosition);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mouseover', handleMouseOver);
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
      materialRef.current.glitchAmount = glitchAmount.current;
      
      // Gradually decrease movement speed and glitch amount
      movementSpeed.current *= 0.95;
      glitchAmount.current *= 0.9;
      
      // Fade out when not moving for a while or mouse is not over canvas
      const timeSinceLastMove = performance.now() - lastMoveTime.current;
      if (!isMouseOverCanvas.current || timeSinceLastMove > 1000) {
        materialRef.current.fadeOpacity = Math.max(0.1, 1 - (timeSinceLastMove - 1000) / 2000);
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
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="cursor-ripple-container">
      <Canvas style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}>
        <CursorLineEffect />
      </Canvas>
    </div>
  );
} 