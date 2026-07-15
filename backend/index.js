const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game State
const players = {};
let bombHolder = null;
let bombTimer = 15;
let timerInterval = null;
let gameState = 'lobby'; // 'lobby', 'countdown', 'playing'
let countdownTimer = 10;
let countdownInterval = null;
let botLoopInterval = null;
let lastPassTime = 0;

// Mathematical function to keep bots on the mountain surface
const getTerrainHeight = (x, z) => {
  const dist = Math.sqrt(x*x + z*z);
  const coneY = -2 + 4 - (dist / 30) * 8;
  return Math.max(-3.5, coneY);
};

function resetBomb() {
  bombTimer = 15;
  io.emit('bombTimerUpdate', bombTimer);
}

function startMatchCountdown() {
  if (gameState !== 'lobby') return;
  gameState = 'countdown';
  countdownTimer = 10;
  io.emit('gameStateUpdate', { state: gameState, countdown: countdownTimer });
  
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    countdownTimer--;
    io.emit('gameStateUpdate', { state: gameState, countdown: countdownTimer });
    
    if (countdownTimer <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      gameState = 'playing';
      
      // Spawn AI Bots to fill the lobby up to 5 players!
      const currentHumanCount = Object.keys(players).length;
      if (currentHumanCount > 0 && currentHumanCount < 5) {
        const botsNeeded = 5 - currentHumanCount;
        for (let i = 0; i < botsNeeded; i++) {
          const botId = `bot_${Date.now()}_${i}`;
          const bx = Math.random() * 20 - 10;
          const bz = Math.random() * 20 - 10;
          players[botId] = {
            id: botId,
            position: [bx, getTerrainHeight(bx, bz) + 1.5, bz],
            isBot: true
          };
          io.emit('newPlayer', players[botId]);
        }
      }
      
      // Assign the bomb randomly when the game actually starts!
      const playerIds = Object.keys(players);
      if (playerIds.length > 0) {
        bombHolder = playerIds[Math.floor(Math.random() * playerIds.length)];
      }
      
      io.emit('gameStateUpdate', { state: gameState, countdown: 0 });
      // Send the updated full player list in case bots were added
      io.emit('updatePlayers', players);
      io.emit('bombHolderUpdate', bombHolder);
      
      resetBomb(); // MUST reset the bomb before starting the timer for a new match!
      startTimer();
      startBotLoop();
    }
  }, 1000);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    bombTimer--;
    io.emit('bombTimerUpdate', bombTimer);
    
    if (bombTimer <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (bombHolder) {
        io.emit('playerExploded', bombHolder);
        
        const remaining = Object.keys(players);
        if (remaining.length > 1) {
            // If multiplayer, eliminate the loser
            delete players[bombHolder];
            io.emit('updatePlayers', players);
            
            const newRemaining = Object.keys(players);
            // If only 1 player left (and they might be a bot or human), they win!
            if (newRemaining.length === 1) {
               bombHolder = null;
               gameState = 'lobby';
               if (botLoopInterval) clearInterval(botLoopInterval);
               io.emit('gameStateUpdate', { state: gameState, countdown: 0 });
               // Cleanup remaining bots
               Object.keys(players).forEach(pId => { if(players[pId].isBot) delete players[pId]; });
               io.emit('updatePlayers', players);
               setTimeout(() => { if (Object.keys(players).length > 0 && gameState === 'lobby') startMatchCountdown(); }, 4000);
            } else {
               bombHolder = newRemaining[Math.floor(Math.random() * newRemaining.length)];
               resetBomb();
               startTimer();
               io.emit('bombHolderUpdate', bombHolder);
            }
        } else {
            // If single player testing or game over, reset to lobby
            bombHolder = null;
            gameState = 'lobby';
            if (botLoopInterval) clearInterval(botLoopInterval);
            io.emit('gameStateUpdate', { state: gameState, countdown: 0 });
            
            // Cleanup all bots
            Object.keys(players).forEach(pId => {
              if (players[pId].isBot) delete players[pId];
            });
            io.emit('updatePlayers', players);
            
            // Automatically restart the lobby countdown
            setTimeout(() => {
              if (Object.keys(players).length > 0 && gameState === 'lobby') {
                startMatchCountdown();
              }
            }, 4000);
        }
      }
    }
  }, 1000);
}

function startBotLoop() {
  if (botLoopInterval) clearInterval(botLoopInterval);
  const botSpeed = 0.15; // units per tick
  
  botLoopInterval = setInterval(() => {
    if (gameState !== 'playing') return;
    
    const allPlayers = Object.values(players);
    const bots = allPlayers.filter(p => p.isBot);
    
    bots.forEach(bot => {
      let targetDx = bot.targetDx || 0;
      let targetDz = bot.targetDz || 0;
      
      const isBombHolder = bombHolder === bot.id;
      const now = Date.now();
      const timeSincePass = now - lastPassTime;
      const inReactionTime = isBombHolder && (timeSincePass < 600);

      if (inReactionTime) {
        // Human Reaction Time: Keep running in the previous direction for 600ms in a panic!
        // We do not recalculate targetDx/targetDz.
      } else if (isBombHolder) {
        // CHASE LOGIC: Find nearest player
        let nearestDist = Infinity;
        let nearestId = null;
        
        allPlayers.forEach(p => {
          if (p.id === bot.id) return;
          const dx = p.position[0] - bot.position[0];
          const dz = p.position[2] - bot.position[2];
          const dist = Math.sqrt(dx*dx + dz*dz);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = p.id;
            targetDx = dx;
            targetDz = dz;
          }
        });
        
        // Pass bomb if close enough!
        if (nearestDist < 2.5 && nearestId && (timeSincePass > 1100)) {
          bombHolder = nearestId;
          lastPassTime = now;
          io.emit('bombHolderUpdate', bombHolder);
          return; 
        }
      } else {
        // FLEE LOGIC: Run away from bomb holder
        if (bombHolder && players[bombHolder]) {
          const holder = players[bombHolder];
          targetDx = bot.position[0] - holder.position[0];
          targetDz = bot.position[2] - holder.position[2];
          
          const distFromCenter = Math.sqrt(bot.position[0]*bot.position[0] + bot.position[2]*bot.position[2]);
          if (distFromCenter > 18) {
             // If near edge, strongly pull towards center to avoid getting stuck
             targetDx += (0 - bot.position[0]) * 2;
             targetDz += (0 - bot.position[2]) * 2;
          } else {
             // Add randomness to prevent predictable fleeing
             targetDx += (Math.random() - 0.5) * 10;
             targetDz += (Math.random() - 0.5) * 10;
          }
        }
      }

      // Save trajectory for momentum/reaction time
      bot.targetDx = targetDx;
      bot.targetDz = targetDz;
      
      // Normalize movement vector
      const mag = Math.sqrt(targetDx*targetDx + targetDz*targetDz);
      const currentSpeed = bombHolder === bot.id ? 0.22 : 0.15; // Bomb holders run faster to catch people!

      if (mag > 0.1) {
        let moveX = (targetDx / mag) * currentSpeed;
        let moveZ = (targetDz / mag) * currentSpeed;
        
        // Update Bot Position
        let newX = bot.position[0] + moveX;
        let newZ = bot.position[2] + moveZ;
        
        // Keep bots within the island bounds (radius ~ 22)
        const distFromCenter = Math.sqrt(newX*newX + newZ*newZ);
        if (distFromCenter > 22) {
           const scale = 22 / distFromCenter;
           newX *= scale;
           newZ *= scale;
        }
        
        bot.position = [newX, getTerrainHeight(newX, newZ) + 1.5, newZ];
        io.emit('playerMoved', bot);
      }
    });
  }, 50); // Run at 20fps
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Initialize new player
  players[socket.id] = {
    id: socket.id,
    position: [Math.random() * 5 - 2.5, 1.5, Math.random() * 5 - 2.5]
  };

  // If this is the first player, start countdown but DO NOT give bomb yet
  if (Object.keys(players).length === 1) {
    startMatchCountdown();
  } else if (Object.keys(players).length > 1 && gameState === 'lobby') {
    startMatchCountdown();
  }

  // Send initial state when requested to avoid race condition
  socket.on('requestInitialState', () => {
    socket.emit('currentPlayers', players);
    socket.emit('bombHolderUpdate', bombHolder);
    socket.emit('bombTimerUpdate', bombTimer);
    socket.emit('gameStateUpdate', { state: gameState, countdown: countdownTimer });
  });

  // Broadcast new player to others
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle Movement
  socket.on('playerMovement', (position) => {
    if (gameState !== 'playing') return; // No movement in lobby
    
    if (players[socket.id]) {
      players[socket.id].position = position;
      // Emit to all other players
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // Handle Passing Bomb (Collision detection happens on client)
  socket.on('passBomb', (targetId) => {
    if (gameState !== 'playing') return;
    
    if (bombHolder === socket.id && players[targetId]) {
      const now = Date.now();
      if (now - lastPassTime > 1100) {
        bombHolder = targetId;
        lastPassTime = now;
        // Do NOT reset the bomb timer here! It should continue ticking down!
        io.emit('bombHolderUpdate', bombHolder);
      }
    }
  });

  // --- WEBRTC SIGNALING FOR VOICE CHAT ---
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      caller: socket.id,
      sdp: data.sdp
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      caller: socket.id,
      sdp: data.sdp
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      caller: socket.id,
      candidate: data.candidate
    });
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
    
    if (bombHolder === socket.id) {
      // Reassign bomb to a random remaining player
      const remaining = Object.keys(players);
      if (remaining.length > 0) {
        bombHolder = remaining[Math.floor(Math.random() * remaining.length)];
        if (gameState === 'playing') {
            resetBomb();
            startTimer();
        }
        io.emit('bombHolderUpdate', bombHolder);
      } else {
        bombHolder = null;
        if (timerInterval) clearInterval(timerInterval);
        if (countdownInterval) clearInterval(countdownInterval);
        gameState = 'lobby'; // reset to lobby if everyone leaves
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Hot Grande Multiplayer Server running on port ${PORT}`);
});
