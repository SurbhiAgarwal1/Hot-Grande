import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Billboard, useTexture, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(BACKEND_URL);

// Custom Map matching user's design
const Island = () => {
  return (
    <group>
      {/* Ocean */}
      <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#68C3C5" roughness={0.1} metalness={0.2} />
      </mesh>
      
      {/* Main Brown Island (Steep Mountain Shape) */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <coneGeometry args={[30, 8, 64]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>

      {/* Abstract Golden Structure */}
      <group position={[0, -2, 0]}>
        {/* Full rings */}
        <mesh position={[-2, 0, -2]} rotation={[Math.PI / 2, 0.4, 0]} castShadow>
          <torusGeometry args={[6, 1, 32, 100, Math.PI * 2]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[2, 0, 2]} rotation={[-Math.PI / 2, -0.4, 0]} castShadow>
          <torusGeometry args={[7, 1, 32, 100, Math.PI * 2]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Thin central pole/mast with a Flag */}
        <group position={[1, 3, -1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 10]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[1, 4.5, 0]} castShadow>
            <boxGeometry args={[2, 1, 0.1]} />
            <meshStandardMaterial color="#E74C3C" />
          </mesh>
        </group>
      </group>

      {/* Stepping Stones (Colorful Stairs) */}
      <group position={[6, -0.5, 10]}>
        <mesh position={[0, 0, 0]} rotation={[0, -0.5, 0]} castShadow><boxGeometry args={[2, 0.3, 2]} /><meshStandardMaterial color="#FF4D4D" /></mesh>
        <mesh position={[2, -0.5, 2]} rotation={[0, -0.4, 0]} castShadow><boxGeometry args={[2, 0.3, 2]} /><meshStandardMaterial color="#F4D03F" /></mesh>
        <mesh position={[4, -1, 4]} rotation={[0, -0.3, 0]} castShadow><boxGeometry args={[2, 0.3, 2]} /><meshStandardMaterial color="#58D68D" /></mesh>
        <mesh position={[6, -1.5, 6]} rotation={[0, -0.2, 0]} castShadow><boxGeometry args={[2, 0.3, 2]} /><meshStandardMaterial color="#5DADE2" /></mesh>
        <mesh position={[8, -2.0, 8]} rotation={[0, -0.5, 0]} castShadow><boxGeometry args={[2, 0.3, 2]} /><meshStandardMaterial color="#FDFEFE" /></mesh>
      </group>

      {/* Wooden Dock */}
      <mesh position={[16, -2.5, 20]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.5, 8]} />
        <meshStandardMaterial color="#D2B48C" roughness={1} />
      </mesh>

      {/* Boat */}
      <group position={[18, -3.2, 24]} rotation={[0, Math.PI / 4 + 0.2, 0]}>
        {/* Hull */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[4, 1.5, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0, 7]} castShadow>
          <coneGeometry args={[2, 4, 4]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Cabin */}
        <mesh position={[0, 1.25, -2]} castShadow>
          <boxGeometry args={[3, 1.5, 5]} />
          <meshStandardMaterial color="#5DADE2" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.25, -2]} castShadow>
          <boxGeometry args={[3.2, 0.2, 5.2]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Red Stripe Accent */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[4.2, 0.3, 12.2]} />
          <meshStandardMaterial color="#FF0000" />
        </mesh>
      </group>
    </group>
  );
};

// 3D Block Character Avatar
const PlayerAvatar3D = ({ isOther = false, isMoving = false }) => {
  const groupRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  
  // Custom colors for other players vs local player
  const shirtColor = isOther ? "#3498DB" : "#9B59B6";
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Procedural Animation!
    if (isMoving) {
      const time = state.clock.getElapsedTime();
      const speed = 15;
      const angle = Math.sin(time * speed) * 0.8;
      
      // Swing arms and legs
      if (leftArmRef.current) leftArmRef.current.rotation.x = angle;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -angle;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -angle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = angle;
    } else {
      // Return to idle stance
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#F1C40F" />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[1, 1.2, 0.5]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.7, 2.1, 0]} ref={leftArmRef}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color="#F1C40F" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.7, 2.1, 0]} ref={rightArmRef}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color="#F1C40F" />
        </mesh>
      </group>

      {/* Left Leg */}
      <group position={[-0.3, 1.1, 0]} ref={leftLegRef}>
        <mesh position={[0, -0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 1.1, 0.4]} />
          <meshStandardMaterial color="#34495E" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.3, 1.1, 0]} ref={rightLegRef}>
        <mesh position={[0, -0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 1.1, 0.4]} />
          <meshStandardMaterial color="#34495E" />
        </mesh>
      </group>

      {isOther && (
        <Text position={[0, 3.5, 0]} fontSize={0.4} color="white">
          Player
        </Text>
      )}
    </group>
  );
};

// Shared ref to hold the latest network positions without triggering React re-renders
const networkPositions = {};

// Component for rendering other players smoothly
const OtherPlayer = ({ id, startPos, bombHolder }) => {
  const ref = useRef();
  const isMovingRef = useRef(false);

  useFrame((state, delta) => {
    if (ref.current && networkPositions[id]) {
      const targetPos = new THREE.Vector3(...networkPositions[id]);
      const dist = ref.current.position.distanceTo(targetPos);
      
      // If distance is significant, player is moving
      isMovingRef.current = dist > 0.02;
      
      // Smoothly interpolate (lerp) towards the network position
      ref.current.position.lerp(targetPos, 0.2);
    } else {
      isMovingRef.current = false;
    }
  });

  const isHoldingBomb = bombHolder === id;

  return (
    <group ref={ref} position={startPos}>
      <PlayerAvatar3D isOther={true} isMoving={isMovingRef.current} />
      {/* Render the bomb above player if they have it */}
      {isHoldingBomb && <Bomb position={[0, 3.5, 0]} />}
    </group>
  );
};

// Mathematical function to perfectly stick the player to the surface of the mountain!
const getTerrainHeight = (x, z) => {
  const dist = Math.sqrt(x*x + z*z);
  // Cone is at y=-2, height=8, radius=30
  const coneY = -2 + 4 - (dist / 30) * 8;
  // Floor is at y=-3.5 (ocean)
  return Math.max(-3.5, coneY);
};

// Local Player Controller
const PlayerController = ({ onMove, bombHolder, gameState }) => {
  const playerRef = useRef();
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  const speed = 8;
  const lastEmitTime = useRef(0);
  const isHoldingBomb = bombHolder === socket.id;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) setKeys(k => ({ ...k, w: true }));
      if (['s', 'arrowdown'].includes(key)) setKeys(k => ({ ...k, s: true }));
      if (['a', 'arrowleft'].includes(key)) setKeys(k => ({ ...k, a: true }));
      if (['d', 'arrowright'].includes(key)) setKeys(k => ({ ...k, d: true }));
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) setKeys(k => ({ ...k, w: false }));
      if (['s', 'arrowdown'].includes(key)) setKeys(k => ({ ...k, s: false }));
      if (['a', 'arrowleft'].includes(key)) setKeys(k => ({ ...k, a: false }));
      if (['d', 'arrowright'].includes(key)) setKeys(k => ({ ...k, d: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    let moved = false;
    if (gameState === 'playing') {
      if (keys.w) { playerRef.current.position.z -= speed * delta; moved = true; }
      if (keys.s) { playerRef.current.position.z += speed * delta; moved = true; }
      if (keys.a) { playerRef.current.position.x -= speed * delta; moved = true; }
      if (keys.d) { playerRef.current.position.x += speed * delta; moved = true; }
    }

    if (moved) {
      // Stick player to the mountain slope
      playerRef.current.position.y = getTerrainHeight(playerRef.current.position.x, playerRef.current.position.z) + 1.5;

      const now = performance.now();
      // Throttle network emit to 20 times per second (every 50ms)
      if (now - lastEmitTime.current > 50) {
        onMove([playerRef.current.position.x, playerRef.current.position.y, playerRef.current.position.z]);
        lastEmitTime.current = now;
      }
    }

    // Camera Follow
    state.camera.position.x = playerRef.current.position.x;
    state.camera.position.y = playerRef.current.position.y + 3;
    state.camera.position.z = playerRef.current.position.z + 12;
    state.camera.lookAt(playerRef.current.position);
  });

  return (
    <group ref={playerRef} position={[0, 2, 5]}>
      <PlayerAvatar3D isMoving={keys.w || keys.a || keys.s || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight} />
      {/* Render the bomb higher and smaller above player if they have it */}
      {isHoldingBomb && <Bomb position={[0, 3.5, 0]} />}
    </group>
  );
};

// Custom Green Fragmentation Grenade
const Bomb = ({ position }) => {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 2;
    ref.current.rotation.x += delta;
  });

  return (
    <group position={position} ref={ref} scale={[0.5, 0.5, 0.5]}>
      {/* Main Grenade Body */}
      <mesh castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#2ECC71" flatShading emissive="#27AE60" emissiveIntensity={0.3} />
      </mesh>
      {/* Top Handle / Pin */}
      <group position={[0, 0.7, 0]}>
        <mesh castShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh castShadow position={[0.2, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Ring */}
        <mesh castShadow position={[-0.2, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.05, 8, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
    </group>
  );
};

let sharedAudioCtx = null;
const playBeep = () => {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if browser suspended it
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    const oscillator = sharedAudioCtx.createOscillator();
    const gainNode = sharedAudioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, sharedAudioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, sharedAudioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(sharedAudioCtx.destination);
    oscillator.start();
    oscillator.stop(sharedAudioCtx.currentTime + 0.1);
  } catch(e) {
    // Ignore
  }
};

export default function GameScene3D({ setBombTimerText }) {
  const [players, setPlayers] = useState({});
  const [bombHolder, setBombHolder] = useState(null);
  const [gameState, setGameState] = useState('lobby');

  const bombHolderRef = useRef(null);
  const playersRef = useRef({});

  useEffect(() => {
    // FIX: Request initial state on mount so we don't miss the first broadcast!
    socket.emit('requestInitialState');
    
    socket.on('gameStateUpdate', (data) => {
      setGameState(data.state);
      if (setBombTimerText) {
        if (data.state === 'countdown') {
            setBombTimerText(`STARTING IN ${data.countdown}`);
        } else if (data.state === 'lobby') {
            setBombTimerText('LOBBY WAITING');
        } else if (data.state === 'playing') {
            // Force text to update to avoid it sticking at 0.00
            setBombTimerText(15);
        }
      }
    });
    socket.on('currentPlayers', (currentPlayers) => {
      setPlayers(currentPlayers);
      playersRef.current = currentPlayers;
    });
    socket.on('newPlayer', (playerInfo) => {
      setPlayers((prev) => {
        const next = { ...prev, [playerInfo.id]: playerInfo };
        playersRef.current = next;
        return next;
      });
    });
    socket.on('playerMoved', (playerInfo) => {
      // Update the mutable ref instead of React state!
      networkPositions[playerInfo.id] = playerInfo.position;
    });
    socket.on('playerDisconnected', (playerId) => {
      setPlayers((prev) => {
        const newPlayers = { ...prev };
        delete newPlayers[playerId];
        playersRef.current = newPlayers;
        return newPlayers;
      });
    });
    // Handle the backend forcefully updating the entire players list (e.g. eliminating a player)
    socket.on('updatePlayers', (currentPlayers) => {
      setPlayers(currentPlayers);
      playersRef.current = currentPlayers;
    });
    // Visual effect or removal when a player explodes
    socket.on('playerExploded', (playerId) => {
      // In the future we can add an explosion particle effect here at networkPositions[playerId]!
      console.log(`Player ${playerId} exploded!`);
      // The backend will follow up with updatePlayers to remove them.
    });
    socket.on('bombHolderUpdate', (holderId) => {
      setBombHolder(holderId);
      bombHolderRef.current = holderId;
    });
    socket.on('bombTimerUpdate', (time) => {
      if (setBombTimerText) setBombTimerText(time);
      playBeep(); // Beep every second the bomb ticks down
    });

    return () => {
      socket.off('currentPlayers');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
      socket.off('updatePlayers');
      socket.off('playerExploded');
      socket.off('bombHolderUpdate');
      socket.off('bombTimerUpdate');
      socket.off('gameStateUpdate');
    };
  }, [setBombTimerText]);

  const handleMove = (position) => {
    // Get the latest bomb holder and players from the refs to avoid stale closures
    const currentBombHolder = bombHolderRef.current;
    const currentPlayers = playersRef.current;

    socket.emit('playerMovement', position);
    
    // Simple Collision Detection for passing bomb
    if (currentBombHolder === socket.id) {
      Object.keys(currentPlayers).forEach(otherId => {
        if (otherId !== socket.id) {
          const otherPos = networkPositions[otherId] || currentPlayers[otherId].position;
          const dist = Math.sqrt(
            Math.pow(position[0] - otherPos[0], 2) +
            Math.pow(position[2] - otherPos[2], 2)
          );
          if (dist < 2.0) { // Collision radius
            socket.emit('passBomb', otherId);
          }
        }
      });
    }
  };

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;

  return (
    <Canvas shadows camera={{ position: [0, 5, 15], fov: 60 }}>
      {isNight ? (
        <>
          <Sky sunPosition={[0, -100, 0]} turbidity={0.1} rayleigh={0.1} mieCoefficient={0.005} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.1} color="#4B7B9C" />
          <directionalLight castShadow position={[10, 20, 10]} intensity={0.6} color="#88AAFF" shadow-mapSize={[1024, 1024]} />
        </>
      ) : (
        <>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight castShadow position={[10, 20, 10]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
        </>
      )}
      
      <Suspense fallback={null}>
        <Island />
        
        {/* Render local player */}
        <PlayerController onMove={handleMove} bombHolder={bombHolder} gameState={gameState} />

        {/* Render other players */}
        {Object.keys(players).map((id) => {
          if (id !== socket.id) {
            const isHoldingBomb = bombHolder === id;
            return (
              <OtherPlayer 
                key={id} 
                id={id} 
                startPos={players[id].position} 
                bombHolder={bombHolder} 
              />
            );
          }
          return null;
        })}
      </Suspense>
    </Canvas>
  );
}
