// ===== RUNNER (Subway Surfers Style) =====
let rCanvas, rCtx, rRunning = false, rAnimId = null, rScore = 0, rSpeed = 4;
let rLane = 1, rTargetLane = 1, rLaneX = 0, rY = 0, rJumping = false, rJumpVel = 0;
let rSliding = false, rSlideTimer = 0, rObstacles = [], rCoins = [], rStars = [];
let rFrame = 0, rBgOff = 0, rGroundOff = 0, rRunCycle = 0;
let rSwipeStartX = 0, rSwipeStartY = 0, rGameOver = false;
let rCombo = 0, rMaxCombo = 0, rTotalCoins = 0;
let rObstacleTimer = 0, rCoinTimer = 0;

// Track tiles for ground
let rTrackTiles = [];

function startRunner(){
  const area = document.getElementById('runnerArea');
  rCanvas = document.getElementById('runnerCanvas');
  if(!rCanvas) return;
  rCanvas.width = area.clientWidth;
  rCanvas.height = area.clientHeight;
  rCtx = rCanvas.getContext('2d');
  
  rRunning = true; rGameOver = false; rScore = 0; rSpeed = 4;
  rLane = 1; rTargetLane = 1; rLaneX = rCanvas.width/2;
  rY = 0; rJumping = false; rJumpVel = 0;
  rSliding = false; rSlideTimer = 0;
  rObstacles = []; rCoins = []; rStars = [];
  rFrame = 0; rBgOff = 0; rGroundOff = 0; rRunCycle = 0;
  rCombo = 0; rMaxCombo = 0; rTotalCoins = 0;
  rObstacleTimer = 0; rCoinTimer = 0;
  
  document.getElementById('runnerOverlay').classList.add('hidden');
  document.getElementById('runnerScore').textContent = '0';
  
  // Touch
  rCanvas.ontouchstart = e=>{ const t=e.touches[0]; rSwipeStartX=t.clientX; rSwipeStartY=t.clientY; };
  rCanvas.ontouchend = e=>{ const t=e.changedTouches[0]; doSwipe(t.clientX-rSwipeStartX, t.clientY-rSwipeStartY); };
  rCanvas.onmousedown = e=>{ rSwipeStartX=e.clientX; rSwipeStartY=e.clientY; };
  rCanvas.onmouseup = e=>{ doSwipe(e.clientX-rSwipeStartX, e.clientY-rSwipeStartY); };
  
  // Keyboard
  document.onkeydown = e=>{ handleKey(e.key); };
  
  if(rAnimId) cancelAnimationFrame(rAnimId);
  rAnimId = requestAnimationFrame(rLoop);
}

function doSwipe(dx, dy){
  if(!rRunning || rGameOver) return;
  if(Math.abs(dx) > Math.abs(dy)){
    if(dx > 30) rTargetLane = Math.min(2, rLane+1);
    else if(dx < -30) rTargetLane = Math.max(0, rLane-1);
  } else {
    if(dy < -30 && !rJumping && !rSliding){ rJumping=true; rJumpVel=-14; }
    else if(dy > 30 && !rJumping && !rSliding){ rSliding=true; rSlideTimer=30; }
  }
}

function handleKey(key){
  if(!rRunning || rGameOver) return;
  if(key==='ArrowLeft') rTargetLane=Math.max(0,rLane-1);
  if(key==='ArrowRight') rTargetLane=Math.min(2,rLane+1);
  if(key==='ArrowUp' && !rJumping && !rSliding){ rJumping=true; rJumpVel=-14; }
  if(key==='ArrowDown' && !rJumping && !rSliding){ rSliding=true; rSlideTimer=30; }
}

function rLoop(){
  if(!rRunning) return;
  rFrame++; const w=rCanvas.width, h=rCanvas.height, lw=w/3;
  
  // Speed
  rSpeed = Math.min(rSpeed + 0.0015, 12);
  
  // Lane smooth movement
  const laneCenter = rTargetLane * lw + lw/2;
  rLaneX += (laneCenter - rLaneX) * 0.12;
  rLane = rTargetLane;
  
  // Jump physics
  if(rJumping){ rY += rJumpVel; rJumpVel += 0.7; if(rY >= 0){ rY=0; rJumping=false; } }
  if(rSliding){ rSlideTimer--; if(rSlideTimer<=0) rSliding=false; }
  
  // Run cycle animation
  rRunCycle = (rRunCycle + rSpeed * 0.05) % (Math.PI * 2);
  
  // Background scroll
  rBgOff = (rBgOff + rSpeed * 0.3) % 200;
  rGroundOff = (rGroundOff + rSpeed) % 100;
  
  // Spawn obstacles
  rObstacleTimer--;
  if(rObstacleTimer <= 0){
    const lane = Math.floor(Math.random()*3);
    const types = ['🚧','🚂','📦','🚧','🚂','🚧'];
    const type = types[Math.floor(Math.random()*types.length)];
    const hBonus = (type==='📦' || type==='🚧') ? -20 : 0;
    rObstacles.push({lane, x:w+20, type, hBonus, hit:false});
    rObstacleTimer = Math.max(25, Math.floor(55 - rSpeed * 2.5)) + Math.floor(Math.random() * 20);
  }
  
  // Spawn coins
  rCoinTimer--;
  if(rCoinTimer <= 0){
    const lane = Math.floor(Math.random()*3);
    rCoins.push({lane, x:w+20, collected:false});
    rCoinTimer = 15 + Math.floor(Math.random() * 20);
  }
  
  // Spawn stars (extra points)
  if(Math.random() < 0.005){
    rStars.push({lane:Math.floor(Math.random()*3), x:w+20, collected:false});
  }
  
  // Move obstacles
  rObstacles.forEach(o => o.x -= rSpeed);
  rObstacles = rObstacles.filter(o => o.x > -60);
  rCoins.forEach(c => c.x -= rSpeed);
  rCoins = rCoins.filter(c => c.x > -40);
  rStars.forEach(s => s.x -= rSpeed);
  rStars = rStars.filter(s => s.x > -40);
  
  // Collision detection
  const px = rLaneX;
  const playerW = lw * 0.5;
  
  for(let o of rObstacles){
    if(o.hit) continue;
    if(Math.abs(o.x - px) < playerW/2 + 12 && o.lane === rLane){
      if(rJumping && rY < -8){ o.hit=true; rCombo++; if(rCombo>rMaxCombo) rMaxCombo=rCombo; continue; }
      if(rSliding && o.type === '📦'){ o.hit=true; rCombo++; if(rCombo>rMaxCombo) rMaxCombo=rCombo; continue; }
      gameOverRunner(); return;
    }
  }
  
  // Coin collection
  rCoins.forEach(c => {
    if(c.collected) return;
    if(Math.abs(c.x - px) < playerW/2 + 10 && c.lane === rLane){
      c.collected = true; rScore += 5; rTotalCoins++;
      spawnCoinEffect(c.x, h*0.55);
    }
  });
  
  // Star collection
  rStars.forEach(s => {
    if(s.collected) return;
    if(Math.abs(s.x - px) < playerW/2 + 10 && s.lane === rLane){
      s.collected = true; rScore += 20;
    }
  });
  
  // Score
  if(rFrame % 3 === 0){ rScore++; document.getElementById('runnerScore').textContent=rScore; }
  
  // ===== DRAW =====
  rCtx.clearRect(0,0,w,h);
  
  // Sky gradient
  const skyGrad = rCtx.createLinearGradient(0,0,0,h*0.6);
  skyGrad.addColorStop(0,'#4FC3F7'); skyGrad.addColorStop(0.5,'#81D4FA'); skyGrad.addColorStop(1,'#B3E5FC');
  rCtx.fillStyle = skyGrad; rCtx.fillRect(0,0,w,h*0.65);
  
  // Clouds
  rCtx.fillStyle = 'rgba(255,255,255,0.6)';
  for(let i=0;i<4;i++){
    const cx = (i*180 - rBgOff * (0.5+i*0.1) % 720 + 720) % 720 - 100;
    const cy = 30 + i*20;
    rCtx.beginPath(); rCtx.ellipse(cx, cy, 50, 20, 0, 0, Math.PI*2); rCtx.fill();
    rCtx.beginPath(); rCtx.ellipse(cx+20, cy-8, 35, 18, 0, 0, Math.PI*2); rCtx.fill();
    rCtx.beginPath(); rCtx.ellipse(cx-15, cy+2, 30, 15, 0, 0, Math.PI*2); rCtx.fill();
  }
  
  // City buildings (parallax)
  const buildingColors = ['#90A4AE','#78909C','#B0BEC5','#546E7A','#607D8B'];
  for(let i=0;i<8;i++){
    const bx = (i*90 - rBgOff * 1.2 % 720 + 720) % 720 - 50;
    const bh = 50 + Math.sin(i*2.3)*30 + 30;
    rCtx.fillStyle = buildingColors[i%5];
    rCtx.fillRect(bx, h*0.65-bh-10, 75, bh+10);
    // Windows
    rCtx.fillStyle = 'rgba(255,255,200,0.5)';
    for(let wy=0;wy<bh-15;wy+=18){
      for(let wx=0;wx<55;wx+=20){
        if(Math.random()>0.3) rCtx.fillRect(bx+12+wx, h*0.65-bh+8+wy, 8, 10);
      }
    }
  }
  
  // Ground / Road
  const roadTop = h * 0.65;
  const roadBottom = h;
  
  // Main road
  const roadGrad = rCtx.createLinearGradient(0, roadTop, 0, roadBottom);
  roadGrad.addColorStop(0, '#555'); roadGrad.addColorStop(0.3, '#444'); roadGrad.addColorStop(1, '#333');
  rCtx.fillStyle = roadGrad; rCtx.fillRect(0, roadTop, w, roadBottom-roadTop);
  
  // Road edge lines
  rCtx.strokeStyle = '#FFE600'; rCtx.lineWidth = 3;
  rCtx.beginPath(); rCtx.moveTo(0, roadTop); rCtx.lineTo(w, roadTop); rCtx.stroke();
  
  // Lane markings (dashed center lines)
  rCtx.strokeStyle = 'rgba(255,255,255,0.4)'; rCtx.lineWidth = 2; rCtx.setLineDash([15, 20]);
  for(let i=0;i<2;i++){
    const lx = lw * (i+1);
    rCtx.beginPath(); rCtx.moveTo(lx, roadTop); rCtx.lineTo(lx, roadBottom); rCtx.stroke();
  }
  rCtx.setLineDash([]);
  
  // Side walk / curbs
  rCtx.fillStyle = '#666';
  rCtx.fillRect(0, roadTop, 8, roadBottom-roadTop);
  rCtx.fillRect(w-8, roadTop, 8, roadBottom-roadTop);
  
  // Ground dashes (speed feeling)
  rCtx.fillStyle = 'rgba(255,255,255,0.15)';
  for(let i=0;i<8;i++){
    const gx = (i*60 - rGroundOff * 2 % 480 + 480) % 480 - 30;
    rCtx.fillRect(gx, roadBottom-15, 20, 3);
  }
  
  // Side objects (trees, lamps)
  for(let i=0;i<4;i++){
    const sx = (i*200 - rBgOff * 1.5 % 800 + 800) % 800 - 50;
    // Left side
    rCtx.font = '24px sans-serif'; rCtx.textAlign = 'center';
    const sideObj = ['🌳','🌲','🌴','🏪'][i%4];
    rCtx.fillText(sideObj, sx, roadTop + 30);
    // Right side
    rCtx.fillText(sideObj, w-sx, roadTop + 30);
  }
  
  // Draw obstacles with shadows
  rObstacles.forEach(o => {
    const ox = o.x;
    const oy = h*0.65 + 30 + (o.type === '🚂' ? 0 : 0);
    const size = o.type === '🚂' ? 42 : 38;
    
    // Shadow
    rCtx.fillStyle = 'rgba(0,0,0,0.2)';
    rCtx.beginPath(); rCtx.ellipse(ox, h-28, 22, 6, 0, 0, Math.PI*2); rCtx.fill();
    
    rCtx.font = size+'px sans-serif'; rCtx.textAlign = 'center';
    rCtx.fillText(o.type, ox, oy + (rJumping && rY < -5 ? -15 : 0));
  });
  
  // Draw coins
  rCoins.forEach(c => {
    if(c.collected) return;
    const cx = c.x, cy = h*0.55 + Math.sin(rFrame*0.1 + c.lane)*8;
    rCtx.font = '28px sans-serif'; rCtx.textAlign = 'center';
    // Coin glow
    rCtx.shadowColor = '#FFD700'; rCtx.shadowBlur = 12;
    rCtx.fillText('🪙', cx, cy);
    rCtx.shadowBlur = 0;
  });
  
  // Draw stars
  rStars.forEach(s => {
    if(s.collected) return;
    rCtx.font = '24px sans-serif'; rCtx.textAlign = 'center';
    rCtx.shadowColor = '#FFE600'; rCtx.shadowBlur = 15;
    rCtx.fillText('⭐', s.x, h*0.5);
    rCtx.shadowBlur = 0;
  });
  
  // Draw player
  const playerX = rLaneX;
  const playerBaseY = h*0.65;
  const playerY = playerBaseY + (rJumping ? rY * 3 : 0);
  
  // Player shadow (jump shadow gets smaller)
  rCtx.fillStyle = `rgba(0,0,0,${0.2 - (rJumping ? Math.abs(rY)*0.01 : 0)})`;
  const shadowScale = rJumping ? 0.5 : 1;
  rCtx.beginPath(); rCtx.ellipse(playerX, h-26, 22*shadowScale, 6*shadowScale, 0, 0, Math.PI*2); rCtx.fill();
  
  if(rSliding){
    // Sliding character
    rCtx.font = '28px sans-serif'; rCtx.textAlign = 'center';
    rCtx.fillText('🛹', playerX, playerY + 8);
    // Speed lines behind
    rCtx.strokeStyle = 'rgba(255,255,255,0.3)'; rCtx.lineWidth = 2;
    for(let i=0;i<3;i++){ rCtx.beginPath(); rCtx.moveTo(playerX-20-i*10, playerY); rCtx.lineTo(playerX-40-i*15, playerY-5+i*5); rCtx.stroke(); }
  } else if(rJumping){
    // Jumping pose
    rCtx.font = '36px sans-serif'; rCtx.textAlign = 'center';
    // Arm up
    rCtx.fillText('🏃‍♂️', playerX, playerY - 5);
    // Motion blur lines
    rCtx.strokeStyle = 'rgba(255,255,255,0.2)'; rCtx.lineWidth = 1;
    for(let i=0;i<3;i++){ rCtx.beginPath(); rCtx.moveTo(playerX-15, playerY+5+i*8); rCtx.lineTo(playerX-30-i*5, playerY+5+i*8); rCtx.stroke(); }
  } else {
    // Running animation
    rCtx.font = '38px sans-serif'; rCtx.textAlign = 'center';
    const bounce = Math.abs(Math.sin(rRunCycle)) * 5;
    rCtx.fillText('🏃', playerX, playerY - bounce);
    // Speed trail
    rCtx.strokeStyle = 'rgba(255,255,255,0.15)'; rCtx.lineWidth = 1;
    for(let i=0;i<3;i++){ rCtx.beginPath(); rCtx.moveTo(playerX-12-i*8, playerY-bounce+5); rCtx.lineTo(playerX-25-i*10, playerY-bounce+5+i*3); rCtx.stroke(); }
  }
  
  // Speed lines at high speed
  if(rSpeed > 6){
    rCtx.strokeStyle = `rgba(255,255,255,${Math.min((rSpeed-6)*0.05, 0.3)})`;
    rCtx.lineWidth = 1;
    for(let i=0;i<5;i++){
      const ly = Math.random() * h * 0.6;
      rCtx.beginPath(); rCtx.moveTo(Math.random()*w, ly); rCtx.lineTo(Math.random()*w, ly); rCtx.stroke();
    }
  }
  
  // Combo display
  if(rCombo > 1){
    rCtx.save();
    rCtx.font = 'bold 20px sans-serif'; rCtx.textAlign = 'center';
    rCtx.fillStyle = '#FFE600';
    rCtx.shadowColor = 'rgba(0,0,0,0.5)'; rCtx.shadowBlur = 4;
    rCtx.fillText('🔥 COMBO x'+rCombo, w/2, 60);
    rCtx.restore();
  }
  
  // Coin counter
  rCtx.save();
  rCtx.font = 'bold 16px sans-serif'; rCtx.textAlign = 'right';
  rCtx.fillStyle = '#FFD700';
  rCtx.shadowColor = 'rgba(0,0,0,0.5)'; rCtx.shadowBlur = 3;
  rCtx.fillText('🪙 '+rTotalCoins, w-15, 55);
  rCtx.restore();
  
  // Coin particles animation
  if(coinParticles.length > 0){
    coinParticles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.3; p.life--; });
    coinParticles = coinParticles.filter(p=>p.life>0);
    coinParticles.forEach(p=>{
      rCtx.font='16px sans-serif'; rCtx.textAlign='center';
      rCtx.globalAlpha = p.life/20;
      rCtx.fillText('✨', p.x, p.y);
      rCtx.globalAlpha = 1;
    });
  }
  
  rAnimId = requestAnimationFrame(rLoop);
}

// Coin collect particles
let coinParticles = [];

function spawnCoinEffect(x, y){
  for(let i=0;i<6;i++){
    coinParticles.push({x, y, vx:(Math.random()-0.5)*6, vy:-Math.random()*8-2, life:20});
  }
}

function gameOverRunner(){
  rRunning = false; rGameOver = true;
  if(rAnimId) cancelAnimationFrame(rAnimId);
  document.getElementById('runnerOverlay').classList.remove('hidden');
  const bonus = rTotalCoins * 5;
  const finalScore = rScore + bonus;
  document.getElementById('runnerTitle').textContent = '💥 GAME OVER';
  document.getElementById('runnerFinalScore').innerHTML = `PONTOS: ${rScore} + 🪙${bonus} = <strong>${finalScore}</strong>`;
  document.querySelector('#runnerOverlay .ro-btn').textContent = '🔄 JOGAR DE NOVO';
  if(finalScore > 50) celebrar();
  document.onkeydown = null;
}

function restartRunner(){
  if(rAnimId) cancelAnimationFrame(rAnimId);
  startRunner();
}
