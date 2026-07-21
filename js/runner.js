// ===== SUPER MARIO SNES STYLE =====
let c, ctx, run = false, anim = null, score = 0, coins = 0;
let player = {x:0, y:0, vy:0, w:28, h:36, jumping:false, jumpHold:0};
let obstacles = [], coinItems = [], blocks = [];
let frame = 0, scrollX = 0, speed = 3, groundY = 0;
let sx = 0, over = false, jumpPressed = false;
let particles = [];

// === CANVAS SIZE CONSTANTS (Mario proportions) ===
// Ground is at 75% of canvas height
// Player stands on ground

function startRunner(){
  const area = document.getElementById('runnerArea');
  c = document.getElementById('runnerCanvas');
  if(!c) return;
  c.width = area.clientWidth;
  c.height = area.clientHeight;
  ctx = c.getContext('2d');
  
  const h = c.height;
  groundY = h * 0.78;
  
  run = true; over = false; score = 0; coins = 0; frame = 0; speed = 3; scrollX = 0;
  player.x = c.width * 0.15;
  player.y = groundY - 36;
  player.vy = 0; player.jumping = false; player.jumpHold = 0;
  obstacles = []; coinItems = []; blocks = []; particles = [];
  jumpPressed = false;
  
  document.getElementById('runnerOverlay').classList.add('hidden');
  document.getElementById('runnerScore').textContent = '0';
  
  // Touch/click to jump
  c.ontouchstart = e=>{ e.preventDefault(); if(!over) doJump(); };
  c.onmousedown = e=>{ if(!over) doJump(); };
  
  // "Tap to jump" replay
  c.ontouchend = ()=>{};
  
  document.onkeydown = e=>{ if(e.key===' '||e.key==='ArrowUp'||e.key==='ArrowDown'){ e.preventDefault(); if(!over) doJump(); } };
  
  if(anim) cancelAnimationFrame(anim);
  anim = requestAnimationFrame(loop);
}

function doJump(){
  if(!player.jumping){
    player.jumping = true;
    player.vy = -11;
    player.jumpHold = 0;
  } else if(player.vy < -3) {
    // Variable height - hold to jump higher
    player.vy -= 1.5;
  }
}

function loop(){
  if(!run) return;
  frame++;
  const w = c.width, h = c.height;
  
  // === SCROLL ===
  speed = Math.min(speed + 0.001, 8);
  scrollX += speed;
  
  // === PLAYER PHYSICS ===
  // Gravity
  if(player.jumping){
    player.vy += 0.55; // Mario floaty gravity
    player.y += player.vy;
    player.jumpHold++;
    
    // Land on ground
    if(player.y >= groundY - 36){
      player.y = groundY - 36;
      player.vy = 0;
      player.jumping = false;
      // Landing particles
      for(let i=0;i<3;i++) particles.push({x:player.x+14, y:groundY, vx:(Math.random()-0.5)*3, vy:-Math.random()*2-1, life:10, type:'dust'});
    }
    
    // Head bump on top of pipes/blocks
    for(let o of obstacles){
      if(o.type==='pipe'||o.type==='box'){
        const ox = o.x - scrollX;
        const oy = o.y;
        const ow = o.type==='pipe'?40:32;
        const oh = o.type==='pipe'?o.h:32;
        // Check head bump
        if(player.x+player.w > ox && player.x < ox+ow && player.y < oy+oh && player.y > oy+oh-15 && player.vy < 0){
          player.vy = 0;
          player.y = oy+oh;
          // Bump block
          if(o.type==='box' && !o.hit){
            o.hit = true;
            coins++;
            score += 10;
            // Coin burst
            for(let i=0;i<6;i++) particles.push({x:ox+16, y:oy, vx:(Math.random()-0.5)*8, vy:-Math.random()*6-4, life:15, type:'coin'});
            // Bump animation
            o.bumpY = -8;
            o.bumpTimer = 8;
          }
        }
      }
    }
  } else {
    // Running animation - slight bob
    // Check if falling into pit
    checkPitFall();
  }
  
  // Fall below screen = die
  if(player.y > h + 50){ gameOver(); return; }
  
  // === SPAWN ===
  // Pipes
  if(frame % Math.max(60, Math.floor(120 - speed*6)) === 0){
    const ph = 30 + Math.floor(Math.random() * 35);
    obstacles.push({type:'pipe', x:c.width + scrollX + 100, y:groundY - ph, w:40, h:ph, hit:false});
  }
  
  // Boxes (mario blocks)
  if(frame % Math.max(80, Math.floor(160 - speed*8)) === 0 && Math.random()>0.5){
    obstacles.push({type:'box', x:c.width + scrollX + 100, y:groundY - 55, w:32, h:32, hit:false, bumpY:0, bumpTimer:0});
  }
  
  // Goombas (small enemies on ground)
  if(frame % Math.max(90, Math.floor(150 - speed*7)) === 0 && Math.random()>0.4){
    obstacles.push({type:'goomba', x:c.width + scrollX + 100, y:groundY - 28, w:28, h:28, hit:false});
  }
  
  // Coins in air
  if(frame % Math.max(50, Math.floor(100 - speed*4)) === 0){
    const cy = groundY - 40 - Math.random() * 80;
    coinItems.push({x:c.width + scrollX + 80, y:cy, got:false});
  }
  
  // Pits (gaps in ground)
  if(frame % 300 === 0 && frame > 100){
    obstacles.push({type:'pit', x:c.width + scrollX + 100, w:50, hit:false});
  }
  
  // === MOVE OBJECTS ===
  for(let o of obstacles){
    if(o.bumpTimer){
      o.bumpTimer--;
      o.bumpY += o.bumpTimer > 4 ? -2 : 2;
    }
    if(o.type==='goomba' && !o.hit) o.x += 0.5; // goombas walk right slowly
  }
  
  // === COLLISION ===
  const px = player.x;
  const py = player.y;
  const pw = player.w;
  const ph = player.h;
  
  for(let o of obstacles){
    if(o.hit) continue;
    const ox = o.x - scrollX;
    const ow = o.type==='pipe'?40:(o.type==='box'?32:(o.type==='goomba'?28:0));
    const oh = o.type==='pipe'?o.h:(o.type==='box'?32:(o.type==='goomba'?28:0));
    const oy = o.y + (o.bumpY||0);
    
    if(o.type === 'pit'){
      // Check if player is over pit
      if(px + pw > ox && px < ox + 50 && !player.jumping){
        gameOver(); return;
      }
      continue;
    }
    
    // Side/bottom collision
    if(px + pw > ox + 8 && px < ox + ow - 8 && py + ph > oy + 8 && py < oy + oh - 8){
      // Landing on top of obstacle
      if(py + ph - oy < 15 && player.vy >= 0){
        player.y = oy - ph;
        player.vy = 0;
        player.jumping = false;
        // Stomp goomba
        if(o.type === 'goomba'){
          o.hit = true;
          score += 20;
          for(let i=0;i<4;i++) particles.push({x:ox+14, y:oy, vx:(Math.random()-0.5)*5, vy:-Math.random()*3-2, life:12, type:'stomp'});
        }
      } else if(py + ph - oy > 10 && player.vy > 0) {
        // Hit side = die
        gameOver(); return;
      }
    }
  }
  
  // Coin collection
  for(let cItem of coinItems){
    if(cItem.got) continue;
    const cx = cItem.x - scrollX;
    if(px + pw > cx - 8 && px < cx + 8 && py + ph > cItem.y - 8 && py < cItem.y + 8){
      cItem.got = true;
      coins++;
      score += 5;
      for(let i=0;i<5;i++) particles.push({x:cx, y:cItem.y, vx:(Math.random()-0.5)*6, vy:-Math.random()*5-3, life:14, type:'coin'});
    }
  }
  
  // Score
  if(frame % 5 === 0){ score++; document.getElementById('runnerScore').textContent = score + (coins>0?' 🪙'+coins:''); }
  
  // === DRAW ===
  drawMarioLevel(w, h);
  
  anim = requestAnimationFrame(loop);
}

function drawMarioLevel(w, h){
  // === SKY (Mario blue) ===
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, w, h);
  
  // === CLOUDS (Mario style puffy) ===
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for(let i=0;i<4;i++){
    const cx = ((i*250 - scrollX * 0.3) % 1000 + 1000) % 1000 - 100;
    const cy = 30 + i*18;
    // Big cloud
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI*2); ctx.fill();
    ctx.arc(cx+25, cy-8, 28, 0, Math.PI*2); ctx.fill();
    ctx.arc(cx-20, cy+3, 25, 0, Math.PI*2); ctx.fill();
    ctx.arc(cx+10, cy+5, 22, 0, Math.PI*2); ctx.fill();
  }
  
  // === HILLS (Mario green hills) ===
  for(let i=0;i<4;i++){
    const hx = ((i*300 - scrollX * 0.5) % 1200 + 1200) % 1200 - 150;
    const hh = 50 + Math.sin(i*1.7)*20;
    ctx.fillStyle = '#5ab45a';
    ctx.beginPath();
    ctx.moveTo(hx, groundY);
    ctx.quadraticCurveTo(hx+40, groundY-hh-20, hx+80, groundY);
    ctx.fill();
    ctx.fillStyle = '#6cc96c';
    ctx.beginPath();
    ctx.moveTo(hx+15, groundY);
    ctx.quadraticCurveTo(hx+45, groundY-hh-10, hx+70, groundY);
    ctx.fill();
  }
  
  // === BUSHES ===
  ctx.fillStyle = '#3a9a3a';
  for(let i=0;i<3;i++){
    const bx = ((i*400 - scrollX * 0.7) % 1200 + 1200) % 1200 - 100;
    ctx.beginPath(); ctx.arc(bx, groundY-5, 22, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+18, groundY-8, 18, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(bx-15, groundY-3, 15, Math.PI, 0); ctx.fill();
  }
  
  // === QUESTIONS BLOCKS (in air) ===
  for(let i=0;i<2;i++){
    const bx = ((i*500 - scrollX * 0.8) % 1000 + 1000) % 1000 - 100;
    const by = groundY - 90;
    // Block
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(bx, by, 32, 32);
    ctx.strokeStyle = '#e8a828'; ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 32, 32);
    // Question mark
    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', bx+16, by+16);
  }
  
  // === GROUND ===
  // Main ground (brown)
  ctx.fillStyle = '#c47a3a';
  ctx.fillRect(0, groundY, w, h - groundY);
  
  // Grass on top
  ctx.fillStyle = '#5ab45a';
  ctx.fillRect(0, groundY-4, w, 8);
  
  // Dark grass line
  ctx.fillStyle = '#3a8a3a';
  ctx.fillRect(0, groundY-2, w, 3);
  
  // Ground texture (bricks pattern)
  ctx.strokeStyle = '#a06020'; ctx.lineWidth = 1;
  for(let gy = groundY+6; gy < h; gy += 16){
    const offset = ((gy/16) % 2) * 20;
    for(let gx = -scrollX % 40 + offset; gx < w; gx += 40){
      ctx.strokeRect(gx, gy, 20, 16);
    }
  }
  
  // === PITS ===
  for(let o of obstacles){
    if(o.type !== 'pit') continue;
    const ox = o.x - scrollX;
    if(ox < -60 || ox > w+60) continue;
    // Dark pit
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ox, groundY-4, 50, h - groundY + 4);
    // Pit edge highlight
    ctx.fillStyle = '#c47a3a';
    ctx.fillRect(ox-2, groundY-4, 4, 8);
    ctx.fillRect(ox+50-2, groundY-4, 4, 8);
  }
  
  // === OBSTACLES ===
  for(let o of obstacles){
    if(o.hit && o.type !== 'box') continue;
    const ox = o.x - scrollX;
    if(ox < -60 || ox > w+60) continue;
    const oy = o.y + (o.bumpY||0);
    
    if(o.type === 'pipe'){
      // Mario green pipe
      ctx.fillStyle = '#2a9a2a';
      ctx.fillRect(ox-5, groundY-10, 50, 12); // lip
      ctx.fillStyle = '#3ab43a';
      ctx.fillRect(ox, oy, 40, o.h);
      ctx.fillStyle = '#2a9a2a';
      ctx.fillRect(ox+6, oy, 6, o.h);
      // Highlight
      ctx.fillStyle = '#5ad45a';
      ctx.fillRect(ox+4, oy+2, 4, o.h-4);
    }
    else if(o.type === 'box'){
      if(o.hit){
        // Hit block (empty/darker)
        ctx.fillStyle = '#8a5a3a';
        ctx.fillRect(ox, oy, 32, 32);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, 32, 32);
      } else {
        // ? Block
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(ox, oy, 32, 32);
        ctx.strokeStyle = '#e8a828'; ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, 32, 32);
        ctx.fillStyle = '#FFE600';
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', ox+16, oy+16);
        // Shine
        ctx.fillStyle = 'rgba(255,255,200,0.2)';
        ctx.fillRect(ox+2, oy+2, 28, 14);
      }
    }
    else if(o.type === 'goomba'){
      if(o.hit){
        // Squished goomba
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('👾', ox+14, oy+24);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.ellipse(ox+14, oy+26, 12, 3, 0, 0, Math.PI*2); ctx.fill();
      } else {
        // Walking goomba
        const wobble = Math.sin(frame * 0.15) * 3;
        ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('👾', ox+14, oy+22 + wobble);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(ox+14, oy+28, 12, 3, 0, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  
  // === COINS ===
  for(let cItem of coinItems){
    if(cItem.got) continue;
    const cx = cItem.x - scrollX;
    if(cx < -20 || cx > w+20) continue;
    const bobY = Math.sin(frame * 0.1 + cItem.x) * 4;
    
    ctx.save();
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🪙', cx, cItem.y + bobY);
    ctx.restore();
  }
  
  // === PLAYER (MARIO) ===
  const px = player.x;
  const py = player.y;
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  const shadowW = player.jumping ? 14 : 22;
  ctx.beginPath(); ctx.ellipse(px+14, groundY-2, shadowW, 4, 0, 0, Math.PI*2);
  ctx.fill();
  
  // Player with run animation
  if(player.jumping){
    // Jump pose (arms up)
    ctx.font = '34px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🏃', px+14, py+24);
  } else {
    // Running animation - alternate legs
    const runFrame = Math.floor(frame * speed * 0.08) % 4;
    ctx.font = '32px sans-serif'; ctx.textAlign = 'center';
    if(runFrame === 1 || runFrame === 3){
      ctx.fillText('🏃', px+14, py+26);
    } else {
      ctx.fillText('🚶', px+14, py+26);
    }
  }
  
  // === PARTICLES ===
  if(particles.length > 0){
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
      ctx.globalAlpha = p.life / (p.type==='coin'?15:12);
      ctx.font = (p.type==='coin'?'14px':'10px')+' sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.type==='coin'?'🪙':(p.type==='stomp'?'💥':'•'), p.x, p.y);
      ctx.globalAlpha = 1;
    });
    particles = particles.filter(p => p.life > 0);
  }
  
  // === HUD ===
  ctx.save();
  ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
  ctx.fillText('🪙 '+coins, 12, 30);
  ctx.fillStyle = '#FFE600';
  ctx.fillText('SCORE: '+score, 12, 52);
  ctx.restore();
}

function checkPitFall(){
  // Check if player is over a pit
  for(let o of obstacles){
    if(o.type !== 'pit') continue;
    const ox = o.x - scrollX;
    if(player.x + player.w > ox + 5 && player.x < ox + 45 && !player.jumping){
      gameOver(); return;
    }
  }
}

function gameOver(){
  run = false; over = true;
  if(anim) cancelAnimationFrame(anim);
  document.getElementById('runnerOverlay').classList.remove('hidden');
  const total = score + coins * 5;
  document.getElementById('runnerTitle').textContent = '💥 GAME OVER';
  document.getElementById('runnerFinalScore').innerHTML = `SCORE: ${score} + 🪙${coins*5} = <strong>${total}</strong>`;
  document.querySelector('#runnerOverlay .ro-btn').textContent = '🔄 JOGAR DE NOVO';
  if(total > 50) celebrar();
  document.onkeydown = null;
}

function restartRunner(){
  if(anim) cancelAnimationFrame(anim);
  startRunner();
}
