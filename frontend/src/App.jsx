import React, { useState, useEffect, useRef } from 'react';
import './index.css';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Environment, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

// --- Custom 3D Cursor Hook ---
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
  return mousePosition;
};

// --- Landing Page 3D Scene ---
const CinematicBomb = () => {
  const ref = useRef();
  const { mouse } = useThree();

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.5;
    ref.current.rotation.x += delta * 0.2;
    // Parallax effect
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, (mouse.x * 2), 0.05);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, (mouse.y * 2), 0.05);
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={4}>
      <group ref={ref} scale={[2.2, 2.2, 2.2]}>
        {/* Main Grenade Body */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#2ECC71" flatShading metalness={0.8} roughness={0.2} emissive="#27AE60" emissiveIntensity={0.2} />
        </mesh>
        {/* Top Handle / Pin */}
        <group position={[0, 0.7, 0]}>
          <mesh castShadow position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.5]} />
            <meshStandardMaterial color="#111111" metalness={1} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[0.2, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {/* Ring */}
          <mesh castShadow position={[-0.2, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.05, 8, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

const LandingScene3D = () => {
  return (
    <div className="absolute inset-0 z-0 bg-neutral-950">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#ff3333" />
        <directionalLight position={[-10, -10, -10]} intensity={1} color="#3333ff" />
        <Sparkles count={200} scale={15} size={4} speed={0.4} opacity={0.5} color="#ffaa00" />
        <CinematicBomb />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

// --- Scene 1: Premium Splash Screen ---
const SplashScreen = ({ onStart }) => {
  const { x, y } = useMousePosition();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-white overflow-hidden">
      <LandingScene3D />

      {/* Glassmorphism UI Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl p-12 mx-4 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[3rem] overflow-hidden group pointer-events-none">
        
        {/* Subtle dynamic background gradient inside the glass */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-yellow-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

        <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter hover:brightness-125 transition-all duration-300 pointer-events-auto">
          HOT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">GRANDE</span>
        </h1>
        
        <p className="text-xl md:text-3xl mb-12 max-w-2xl text-center text-gray-300 font-light tracking-wide leading-relaxed pointer-events-auto">
          The most explosive 3D multiplayer survival experience. <br/> Pass the grenade before time runs out.
        </p>

        <button 
          onClick={onStart}
          className="relative px-12 py-5 bg-transparent overflow-hidden rounded-full font-black text-2xl tracking-widest uppercase transition-all duration-300 group/btn pointer-events-auto"
        >
          {/* Button Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-red-600 opacity-0 group-hover/btn:opacity-100 transition-all duration-500 scale-150 -translate-x-full group-hover/btn:translate-x-0"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] rounded-full"></div>
          
          {/* Button Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-yellow-500 rounded-full blur-xl opacity-30 group-hover/btn:opacity-70 transition-opacity duration-300"></div>
          
          {/* Button Text */}
          <span className="relative z-10 flex items-center gap-3 text-white drop-shadow-md">
            ENTER ARENA
            <svg className="w-8 h-8 group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

// Scene 2: Tutorial & Warning
const TutorialScreen = ({ onJoin }) => {
  const isMobile = window.innerWidth < 768;

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-neutral-950 text-white p-4 overflow-hidden">
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/10 animate-slide-in">
        
        <div className="text-center mb-10">
          <h2 className="text-5xl font-black mb-3 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-md">
            HOW TO PLAY
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto opacity-50"></div>
        </div>
        
        <div className="mb-10 flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4 text-gray-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              Controls
            </h3>
            {isMobile ? (
              <p className="text-gray-300 animate-slide-in delay-100 bg-black/30 p-4 rounded-xl border border-white/5">
                Use the on-screen virtual joysticks to run and explore freely (Roblox-style)!
              </p>
            ) : (
              <ul className="text-gray-300 space-y-4">
                <li className="animate-slide-in delay-100 flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold">W</kbd>
                    <kbd className="px-2 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold">A</kbd>
                    <kbd className="px-2 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold">S</kbd>
                    <kbd className="px-2 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold">D</kbd>
                  </div>
                  <span>to move freely around the island.</span>
                </li>
                <li className="animate-slide-in delay-300 flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <kbd className="px-6 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold">SPACE</kbd>
                  <span>to jump.</span>
                </li>
                <li className="animate-slide-in delay-500 flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <kbd className="px-3 py-1 bg-neutral-800 border-b-4 border-neutral-900 rounded text-sm font-mono font-bold tracking-widest">MOUSE</kbd>
                  <span>to look around (Roblox-style).</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="relative mb-10 bg-red-950/40 border border-red-500/30 p-6 rounded-2xl animate-slide-in delay-700 overflow-hidden group/warning">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover/warning:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          <h3 className="text-2xl font-bold text-red-400 mb-3 flex items-center tracking-tight">
            <span className="mr-3 text-3xl animate-pulse">⚠️</span> STRICT VOICE MODERATION
          </h3>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed pl-10">
            This game features in-game voice chat. Our <strong className="text-white">AI Moderation System</strong> listens in the background. 
            Any foul language, hate speech, or toxicity will result in an immediate automatic ban. 
            Keep it clean and have fun!
          </p>
        </div>

        <div className="flex justify-center mt-8">
          <button 
            onClick={onJoin}
            className="relative px-10 py-4 bg-transparent overflow-hidden rounded-full font-black text-xl tracking-wider transition-all duration-300 group/btn animate-slide-in delay-700"
          >
            {/* Button Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover/btn:opacity-100 transition-all duration-500 scale-150 -translate-x-full group-hover/btn:translate-x-0"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)] rounded-full"></div>
            
            {/* Button Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur-lg opacity-40 group-hover/btn:opacity-80 transition-opacity duration-300"></div>
            
            <span className="relative z-10 flex items-center gap-3 text-white drop-shadow-md">
              I UNDERSTAND, ENTER ARENA
              <svg className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

import GameScene3D from './GameScene3D';

import VoiceChat from './VoiceChat';

// Scene 3: The Game
const GameScene = () => {
  const [bombTimerText, setBombTimerText] = useState(15);

  return (
    <div className="relative w-full h-full bg-blue-900">
      <div className="absolute top-4 left-4 p-4 bg-black/50 rounded-lg text-white font-mono backdrop-blur-sm z-10">
        <h3 className="text-yellow-400 font-bold mb-2">LEADERBOARD</h3>
        <div className="text-sm">1. Player_99 (5 wins)</div>
        <div className="text-sm">2. Surbhi (3 wins)</div>
      </div>
      
      <div className="absolute top-4 right-4 p-4 bg-black/50 rounded-lg text-white font-mono backdrop-blur-sm z-10 text-right pointer-events-none">
        <div className="text-sm text-gray-400">BOMB TIMER</div>
        <div className="text-4xl font-black text-red-500">
          {typeof bombTimerText === 'number' ? `${bombTimerText}.00` : '--'}
        </div>
      </div>

      {typeof bombTimerText === 'string' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-widest animate-pulse">
              {bombTimerText === 'LOBBY WAITING' ? 'LOBBY' : bombTimerText}
            </h1>
            {bombTimerText === 'LOBBY WAITING' && (
              <p className="mt-6 text-2xl text-gray-400">Waiting for players to join...</p>
            )}
          </div>
        </div>
      )}

      <VoiceChat />

      <div className="w-full h-full absolute inset-0">
        <GameScene3D setBombTimerText={setBombTimerText} />
      </div>
    </div>
  );
};

function App() {
  const [scene, setScene] = useState(1); // 1 = Splash, 2 = Tutorial, 3 = Game

  return (
    <div className="w-screen h-screen">
      {scene === 1 && <SplashScreen onStart={() => setScene(2)} />}
      {scene === 2 && <TutorialScreen onJoin={() => setScene(3)} />}
      {scene === 3 && <GameScene />}
    </div>
  );
}

export default App;
