// ===== SUPER MARIO WORLD - Mobile Edition =====
let mc, mctx, mRun = false, mAnim = null;
let mWorld = 1, mLevel = 1, mScore = 0, mCoins = 0, mLives = 3;
let mPlayer = {}, mCamera = 0, mObjs = [], mParticles = [];
let mKeys = {left:false, right:false, up:false, down:false, jump:false, attack:false};
let mLevelW = 0, mLevelH = 0, mGravity = 0.55, mOver = false;
let mLevelData = null, mBlocks = [], mEnemies = [], mItems = [];
let mStarTimer = 0, mPower = 0; // 0=small, 1=big, 2=fire

// ===== WORLDS (7 mundos estilo SMW) =====
const WORLDS = [
  {name:'YOSHI ISLAND',  bg:'#5c94fc', ground:'#5ab45a', brick:'#c47a3a', desc:'GRAMA'},
  {name:'DONUT PLAINS',  bg:'#f4c87a', ground:'#c49a5a', brick:'#a08040', desc:'DESERTO'},
  {name:'VANILLA DOME',  bg:'#2a2a3a', ground:'#5a4a3a', brick:'#7a6a5a', desc:'CAVERNA'},
  {name:'BUTTER BRIDGE', bg:'#c8e8ff', ground:'#8ac8e8', brick:'#68a8c8', desc:'GELO'},
  {name:'FOREST ILLUSION',bg:'#2a5a2a',ground:'#3a6a3a', brick:'#4a7a4a', desc:'FLORESTA'},
  {name:'CHOCOLATE ISL', bg:'#d4a060', ground:'#a08040', brick:'#806030', desc:'MONTANHA'},
  {name:'BOWSER VALLEY', bg:'#3a1a1a', ground:'#5a2a2a', brick:'#7a3a3a', desc:'CASTELO'},
];

// ===== LEVEL GENERATORS =====
function genLevel(world, level){
  const wdata = [];
  const W = 200, H = 15;
  mLevelW = W * 32;
  mLevelH = H * 32;
  
  // Fill with air
  for(let y=0;y<H;y++){ wdata[y]=[]; for(let x=0;x<W;x++) wdata[y][x]=0; }
  
  // Ground
  for(let x=0;x<W;x++){ wdata[H-1][x]=1; wdata[H-2][x]=1; }
  
  // Generate based on world theme
  const seed = world * 100 + level;
  const rng = (max)=>Math.floor(Math.random() * max);
  
  // Pipes
  for(let i=0;i<3+level;i++){
    const px = 15 + i * rng(20) + level*5;
    const ph = 2 + rng(3);
    for(let y=0;y<ph;y++) wdata[H-3-y][px] = 2;
    wdata[H-3-ph][px] = 3; // pipe top
  }
  
  // ? Blocks
  for(let i=0;i<4+level*2;i++){
    const bx = 10 + i * rng(15);
    wdata[H-5][bx] = 4;
  }
  
  // Brick blocks (platforms)
  for(let p=0;p<3+level;p++){
    const px = 20 + p * rng(20);
    const pw = 3 + rng(4);
    const py = H - 5 - rng(3);
    for(let i=0;i<pw;i++) if(px+i < W) wdata[py][px+i] = 5;
  }
  
  // Coins in air
  for(let i=0;i<6+level*3;i++){
    const cx = 8 + rng(W-16);
    const cy = H - 6 - rng(5);
    wdata[cy][cx] = 6;
  }
  
  // Gaps (pits)
  const gapCount = Math.min(level, 4);
  for(let g=0;g<gapCount;g++){
    const gx = 40 + g * rng(30);
    const gw = 2 + rng(2);
    if(gx+gw < W-5){
      for(let x=0;x<gw;x++){ wdata[H-1][gx+x]=0; wdata[H-2][gx+x]=0; }
    }
  }
  
  return wdata;
}

// ===== START GAME =====
function startMario(world){
  mWorld = world || 1;
  mLevel = 1;
  mScore = 0; mCoins = 0; mLives = 3;
  mPower = 0; mStarTimer = 0;
  loadLevel();
}

function loadLevel(){
  const area = document.getElementById('marioCanvas').parentElement;
  mc = document.getElementById('marioCanvas');
  mc.width = area.clientWidth;
  mc.height = area.clientHeight;
  mctx = mc.getContext('2d');
  
  mLevelData = genLevel(mWorld, mLevel);
  mCamera = 0;
  mOver = false;
  mObjs = []; mParticles = []; mBlocks = []; mEnemies = []; mItems = [];
  
  // Player
  mPlayer = {x:64, y:mc.height-100, w:24, h:32, vx:0, vy:0, onGround:false, jumping:false, facing:1, runFrame:0, invincible:0, ducking:false};
  
  // Build object arrays from level data
  const H = mLevelData.length;
  const W = mLevelData[0].length;
  const tileH = 32;
  
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const t = mLevelData[y][x];
      if(t===0) continue;
      const tx = x * 32, ty = y * 32 - (mc.height - H*32) + (H*32 - mc.height);
      // Adjust Y to canvas
      const cy = y * 32;
      
      if(t===1) mBlocks.push({x:tx, y:cy, w:32, h:32, type:'ground', hit:false});
      else if(t===2) mBlocks.push({x:tx, y:cy, w:32, h:32, type:'pipe', hit:false});
      else if(t===3) mBlocks.push({x:tx, y:cy-16, w:32, h:48, type:'pipe-top', hit:false});
      else if(t===4) mBlocks.push({x:tx, y:cy, w:32, h:32, type:'question', hit:false});
      else if(t===5) mBlocks.push({x:tx, y:cy, w:32, h:32, type:'brick', hit:false});
      else if(t===6) mItems.push({x:tx+8, y:cy+8, w:16, h:16, type:'coin', got:false, bob:Math.random()*Math.PI*2});
    }
  }
  
  // Spawn enemies
  for(let i=0;i<5+mLevel*2;i++){
    const ex = 200 + Math.random() * (mLevelW - 400);
    mEnemies.push({x:ex, y:0, w:28, h:28, vx:-1 - Math.random(), type:'goomba', alive:true, squished:0});
  }
  
  document.getElementById('marioOverlay').classList.add('hidden');
  document.getElementById('marioScore').textContent = mScore;
  document.getElementById('marioLives').textContent = '❤️ '+mLives;
  document.getElementById('marioCoins').textContent = '🪙 '+mCoins;
  document.getElementById('marioWorld').textContent = 'MUNDO '+mWorld+'-'+mLevel;
  
  if(mAnim) cancelAnimationFrame(mAnim);
  mRun = true;
  mAnim = requestAnimationFrame(marioLoop);
}

// ===== CONTROLS =====
document.getElementById('btnLeft').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.left=true;});
document.getElementById('btnLeft').addEventListener('touchend', e=>{e.preventDefault(); mKeys.left=false;});
document.getElementById('btnRight').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.right=true;});
document.getElementById('btnRight').addEventListener('touchend', e=>{e.preventDefault(); mKeys.right=false;});
document.getElementById('btnJump').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.jump=true; mKeys.up=true;});
document.getElementById('btnJump').addEventListener('touchend', e=>{e.preventDefault(); mKeys.jump=false; mKeys.up=false;});
document.getElementById('btnAttack').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.attack=true;});
document.getElementById('btnAttack').addEventListener('touchend', e=>{e.preventDefault(); mKeys.attack=false;});
document.getElementById('btnDown').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.down=true;});
document.getElementById('btnDown').addEventListener('touchend', e=>{e.preventDefault(); mKeys.down=false;});
document.getElementById('btnUp').addEventListener('touchstart', e=>{e.preventDefault(); mKeys.jump=true;});
document.getElementById('btnUp').addEventListener('touchend', e=>{e.preventDefault(); mKeys.jump=false;});

// Keyboard
document.onkeydown = e=>{
  if(e.key==='ArrowLeft') mKeys.left=true;
  if(e.key==='ArrowRight') mKeys.right=true;
  if(e.key==='ArrowUp') mKeys.jump=true;
  if(e.key==='ArrowDown') mKeys.down=true;
  if(e.key===' '||e.key==='x') mKeys.attack=true;
};
document.onkeyup = e=>{
  if(e.key==='ArrowLeft') mKeys.left=false;
  if(e.key==='ArrowRight') mKeys.right=false;
  if(e.key==='ArrowUp') mKeys.jump=false;
  if(e.key==='ArrowDown') mKeys.down=false;
  if(e.key===' '||e.key==='x') mKeys.attack=false;
};

// ===== GAME LOOP =====
function marioLoop(){
  if(!mRun) return;
  const w = mc.width, h = mc.height;
  const W = mLevelData[0].length, tileH = 32;
  const levelH = W * tileH;
  
  // === UPDATE ===
  const p = mPlayer;
  const world = WORLDS[mWorld-1];
  
  // Horizontal movement
  let moveX = 0;
  if(mKeys.left){ moveX = -4; p.facing = -1; }
  if(mKeys.right){ moveX = 4; p.facing = 1; }
  if(mKeys.attack && mPower>=2){ /* fire run */ moveX *= 1.3; }
  
  p.vx = moveX;
  p.ducking = mKeys.down && p.onGround && !p.jumping;
  
  // Jump
  if(mKeys.jump && p.onGround && !p.jumping){
    p.vy = -11;
    p.onGround = false;
    p.jumping = true;
  }
  if(!mKeys.jump && p.jumping && p.vy < -3){
    p.vy *= 0.85; // Variable jump height
  }
  
  // Gravity
  p.vy += mGravity;
  if(p.vy > 12) p.vy = 12;
  
  // Attack
  if(mKeys.attack && !p.attacking){
    p.attacking = true;
    p.attackTimer = 10;
    // Fire if big
    if(mPower>=2){
      mItems.push({x:p.x+(p.facing>0?p.w:0), y:p.y+p.h/2, w:8, h:8, type:'fireball', vx:p.facing*8, vy:-2, got:false, life:60});
    }
  }
  if(p.attacking){
    p.attackTimer--;
    if(p.attackTimer<=0) p.attacking = false;
  }
  
  // Apply velocity
  p.x += p.vx;
  p.y += p.vy;
  
  // Run animation
  if(Math.abs(p.vx) > 0.5 && p.onGround) p.runFrame += 0.2;
  
  // Invincibility timer
  if(p.invincible > 0) p.invincible--;
  if(mStarTimer > 0) mStarTimer--;
  
  // === COLLISION WITH BLOCKS ===
  p.onGround = false;
  const pH = p.ducking && p.onGround ? 20 : p.h;
  
  for(let b of mBlocks){
    if(b.type === 'ground' || b.type === 'pipe' || b.type === 'pipe-top' || b.type === 'brick' || b.type === 'question'){
      if(collides(p.x, p.y, p.w, pH, b.x, b.y, b.w, b.h)){
        // From top (landing)
        if(p.vy > 0 && p.y + pH > b.y && p.y + pH < b.y + b.h + 8){
          p.y = b.y - pH;
          p.vy = 0;
          p.onGround = true;
          p.jumping = false;
        }
        // From bottom (head bump)
        else if(p.vy < 0 && p.y < b.y + b.h && p.y > b.y){
          p.vy = 0;
          p.y = b.y + b.h;
          // Hit ? block
          if(b.type === 'question' && !b.hit){
            b.hit = true;
            // Spawn coin
            mCoins++;
            mScore += 10;
            for(let i=0;i<5;i++) mParticles.push({x:b.x+16, y:b.y, vx:(Math.random()-0.5)*6, vy:-Math.random()*6-4, life:15, type:'coin'});
            // Bump animation
            b.bumpY = -6; b.bumpTimer = 6;
          }
          // Hit brick
          if(b.type === 'brick' && !b.hit && mPower > 0){
            b.hit = true;
            for(let i=0;i<8;i++) mParticles.push({x:b.x+16, y:b.y+16, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.5)*8-4, life:20, type:'break'});
          }
        }
        // Side collision
        else {
          if(p.vx > 0) p.x = b.x - p.w;
          else if(p.vx < 0) p.x = b.x + b.w;
          p.vx = 0;
        }
      }
    }
  }
  
  // Bump animation
  for(let b of mBlocks){
    if(b.bumpTimer){ b.bumpTimer--; b.bumpY += b.bumpTimer > 3 ? -2 : 2; if(b.bumpTimer<=0) b.bumpY=0; }
  }
  
  // Camera follow
  const targetCam = p.x - w * 0.25;
  mCamera += (targetCam - mCamera) * 0.1;
  if(mCamera < 0) mCamera = 0;
  if(mCamera > mLevelW - w) mCamera = mLevelW - w;
  
  // Fall off screen
  if(p.y > h + 50){
    playerDie();
    return;
  }
  
  // === ENEMIES ===
  for(let e of mEnemies){
    if(!e.alive) continue;
    e.x += e.vx;
    e.y = mLevelData.length * 32 - 64 - e.h;
    
    // Squished timer
    if(e.squished > 0) e.squished--;
    if(e.squished > 0 && e.squished < 30) continue;
    if(e.squished === 1) e.alive = false;
    
    // Off screen cleanup
    if(e.x < mCamera - 100 || e.x > mCamera + w + 100) continue;
    
    // Collision with player
    if(collides(p.x, p.y, p.w, pH, e.x, e.y, e.w, e.h)){
      if(p.vy > 0 && p.y + pH < e.y + 15){
        // Stomp!
        e.squished = 30;
        p.vy = -8;
        mScore += 20;
        for(let i=0;i<4;i++) mParticles.push({x:e.x+14, y:e.y, vx:(Math.random()-0.5)*5, vy:-Math.random()*3-2, life:12, type:'stomp'});
      } else if(p.invincible <= 0){
        // Hit by enemy
        playerHit();
      }
    }
  }
  
  // === ITEMS ===
  for(let item of mItems){
    if(item.got && item.type !== 'fireball') continue;
    
    // Coins float
    if(item.type === 'coin'){
      item.bob += 0.05;
      // Collection
      if(collides(p.x, p.y, p.w, pH, item.x-4, item.y-4+Math.sin(item.bob)*3, 24, 24) && !item.got){
        item.got = true;
        mCoins++;
        mScore += 5;
        for(let i=0;i<4;i++) mParticles.push({x:item.x+8, y:item.y+8, vx:(Math.random()-0.5)*4, vy:-Math.random()*4-2, life:10, type:'coin'});
      }
    }
    
    // Fireballs
    if(item.type === 'fireball'){
      item.x += item.vx;
      item.y += item.vy;
      item.vy += 0.3;
      item.life--;
      if(item.life <= 0) item.got = true;
      
      // Hit enemies
      for(let e of mEnemies){
        if(!e.alive) continue;
        if(collides(item.x, item.y, item.w, item.h, e.x, e.y, e.w, e.h)){
          e.alive = false;
          item.got = true;
          mScore += 30;
          for(let i=0;i<6;i++) mParticles.push({x:e.x+14, y:e.y+14, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.5)*8-4, life:15, type:'stomp'});
        }
      }
    }
    
    // Mushroom power-up
    if(item.type === 'mushroom' && !item.got){
      if(collides(p.x, p.y, p.w, pH, item.x, item.y, item.w, item.h)){
        item.got = true;
        mPower = Math.min(mPower + 1, 2);
        mScore += 50;
        p.invincible = 60;
        for(let i=0;i<8;i++) mParticles.push({x:p.x+12, y:p.y, vx:(Math.random()-0.5)*8, vy:-Math.random()*6-2, life:20, type:'power'});
      }
    }
  }
  
  // Clear collected
  mItems = mItems.filter(i => !i.got || i.type === 'fireball');
  
  // Score
  document.getElementById('marioScore').textContent = mScore;
  document.getElementById('marioLives').textContent = '❤️ '+mLives;
  document.getElementById('marioCoins').textContent = '🪙 '+mCoins;
  
  // === DRAW ===
  drawMario(w, h);
  
  mAnim = requestAnimationFrame(marioLoop);
}

// ===== DRAW =====
function drawMario(w, h){
  const ctx = mctx;
  const world = WORLDS[mWorld-1];
  
  ctx.clearRect(0, 0, w, h);
  
  // Sky
  ctx.fillStyle = world.bg;
  ctx.fillRect(0, 0, w, h);
  
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for(let i=0;i<3;i++){
    const cx = ((i*280 - mCamera*0.3) % 840 + 840) % 840 - 80;
    const cy = 30 + i*25;
    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+20, cy-6, 30, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-15, cy+3, 25, 0, Math.PI*2); ctx.fill();
  }
  
  // Hills
  ctx.fillStyle = world.ground;
  for(let i=0;i<3;i++){
    const hx = ((i*350 - mCamera*0.4) % 1050 + 1050) % 1050 - 150;
    const hh = 40 + Math.sin(i*1.7)*15;
    ctx.beginPath(); ctx.moveTo(hx, h-80);
    ctx.quadraticCurveTo(hx+40, h-80-hh-15, hx+80, h-80);
    ctx.fill();
  }
  
  // Level blocks
  const H = mLevelData.length;
  const W = mLevelData[0].length;
  
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const t = mLevelData[y][x];
      if(t===0) continue;
      const sx = x*32 - mCamera;
      const sy = y*32;
      if(sx < -40 || sx > w+40) continue;
      
      if(t===1){
        // Ground
        ctx.fillStyle = world.brick;
        ctx.fillRect(sx, sy, 32, 32);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth=1;
        ctx.strokeRect(sx, sy, 32, 32);
        // Grass on top
        if(mLevelData[y-1] && mLevelData[y-1][x]===0){
          ctx.fillStyle = world.ground;
          ctx.fillRect(sx, sy-3, 32, 6);
        }
      }
      else if(t===2 || t===3){
        // Pipe
        ctx.fillStyle = '#2a9a2a';
        ctx.fillRect(sx-4, sy+(t===3?0:8), 40, t===3?40:24);
        ctx.fillStyle = '#3ab43a';
        ctx.fillRect(sx, sy+(t===3?0:8), 32, t===3?40:24);
        ctx.fillStyle = '#5ad45a';
        ctx.fillRect(sx+4, sy+(t===3?0:8), 6, t===3?40:24);
        if(t===3){ ctx.fillStyle='#2a9a2a'; ctx.fillRect(sx-6, sy-4, 44, 8); ctx.fillStyle='#3ab43a'; ctx.fillRect(sx-2, sy-4, 36, 8); }
      }
      else if(t===4){
        // ? Block
        const b = mBlocks.find(bx => bx.x===x*32 && bx.y===y*32 && bx.type==='question');
        const bump = (b && b.bumpY) || 0;
        if(b && b.hit){
          ctx.fillStyle = '#8a6a4a';
          ctx.fillRect(sx, sy+bump, 32, 32);
          ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth=2; ctx.strokeRect(sx, sy+bump, 32, 32);
        } else {
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(sx, sy+bump, 32, 32);
          ctx.strokeStyle = '#e8a828'; ctx.lineWidth=2; ctx.strokeRect(sx, sy+bump, 32, 32);
          ctx.fillStyle = '#FFE600'; ctx.font = 'bold 18px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('?', sx+16, sy+16+bump);
        }
      }
      else if(t===5){
        // Brick
        ctx.fillStyle = world.brick;
        ctx.fillRect(sx, sy, 32, 32);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth=1;
        ctx.strokeRect(sx, sy, 32, 32);
        ctx.strokeRect(sx, sy+16, 32, 1);
        ctx.strokeRect(sx+16, sy, 1, 32);
      }
    }
  }
  
  // Items (coins)
  for(let item of mItems){
    if(item.got && item.type !== 'fireball') continue;
    const sx = item.x - mCamera;
    if(sx < -20 || sx > w+20) continue;
    
    if(item.type === 'coin'){
      const bob = Math.sin(item.bob)*4;
      ctx.save();
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🪙', sx+8, item.y+8+bob);
      ctx.restore();
    }
    if(item.type === 'fireball'){
      ctx.font = '18px sans-serif'; ctx.textAlign='center';
      ctx.fillText('🔥', sx, item.y);
    }
    if(item.type === 'mushroom' && !item.got){
      ctx.font = '24px sans-serif'; ctx.textAlign='center';
      ctx.fillText('🍄', sx+8, item.y+12);
    }
  }
  
  // Enemies
  for(let e of mEnemies){
    if(!e.alive && e.squished <= 0) continue;
    const sx = e.x - mCamera;
    if(sx < -40 || sx > w+40) continue;
    
    if(e.squished > 0 && e.squished < 28){
      // Squished
      ctx.font = '20px sans-serif'; ctx.textAlign='center';
      ctx.fillText('👾', sx+14, e.y+24);
    } else if(e.alive){
      const wobble = Math.sin(mPlayer.runFrame*3 + e.x) * 2;
      ctx.font = '26px sans-serif'; ctx.textAlign='center';
      ctx.fillText('👾', sx+14, e.y+20 + wobble);
    }
  }
  
  // Particles
  for(let p of mParticles){
    p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
    ctx.globalAlpha = p.life / 15;
    ctx.font = '14px sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.type==='coin'?'🪙':(p.type==='break'?'🧱':(p.type==='power'?'✨':'💥')), p.x, p.y);
    ctx.globalAlpha = 1;
  }
  mParticles = mParticles.filter(p => p.life > 0);
  
  // === PLAYER ===
  const px = p.x - mCamera;
  const py = p.y;
  
  if(p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return; // Flash
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(px+12, mLevelData.length*32-4, 14, 3, 0, 0, Math.PI*2);
  ctx.fill();
  
  // Draw Mario
  const facing = p.facing || 1;
  ctx.save();
  if(facing < 0) ctx.scale(-1, 1);
  const dx = facing < 0 ? -px - p.w : px;
  
  if(p.ducking && p.onGround){
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🏃', dx+12, py+22);
  } else if(!p.onGround){
    ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🏃', dx+12, py+22);
  } else {
    const rf = Math.floor(p.runFrame * 4) % 4;
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    if(rf === 1 || rf === 3) ctx.fillText('🏃', dx+12, py+24);
    else ctx.fillText('🚶', dx+12, py+24);
  }
  ctx.restore();
  
  // Star effect
  if(mStarTimer > 0){
    ctx.fillStyle = `rgba(255,255,0,${0.2 + Math.sin(mStarTimer*0.3)*0.1})`;
    ctx.fillRect(px-4, py-4, p.w+8, p.h+8);
  }
}

// ===== COLLISION =====
function collides(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ===== PLAYER HIT =====
function playerHit(){
  if(mPlayer.invincible > 0) return;
  if(mPower > 0){
    mPower--;
    mPlayer.invincible = 60;
    for(let i=0;i<6;i++) mParticles.push({x:mPlayer.x+12, y:mPlayer.y, vx:(Math.random()-0.5)*6, vy:-Math.random()*4-2, life:15, type:'stomp'});
  } else {
    playerDie();
  }
}

function playerDie(){
  mLives--;
  if(mLives <= 0){
    gameOverMario();
  } else {
    // Respawn
    loadLevel();
  }
}

function gameOverMario(){
  mRun = false;
  if(mAnim) cancelAnimationFrame(mAnim);
  document.getElementById('marioOverlay').classList.remove('hidden');
  document.getElementById('marioTitle').textContent = '💥 GAME OVER';
  document.getElementById('marioSub').textContent = 'SCORE: '+mScore+' | 🪙 '+mCoins;
  document.getElementById('marioStartBtn').textContent = '🔄 JOGAR DE NOVO';
  document.getElementById('worldSelect').innerHTML = '';
  if(mScore > 100) celebrar();
}

// ===== MENU SETUP =====
document.getElementById('marioStartBtn').addEventListener('click', ()=>{
  const ws = document.getElementById('worldSelect');
  if(ws.children.length === 0){
    showWorldSelect();
  } else {
    startMario(parseInt(document.getElementById('marioStartBtn').dataset.world) || 1);
  }
});

function showWorldSelect(){
  const ws = document.getElementById('worldSelect');
  ws.innerHTML = '';
  document.getElementById('marioTitle').textContent = '🌍 SELECIONE O MUNDO';
  document.getElementById('marioSub').textContent = '';
  document.getElementById('marioStartBtn').textContent = '▶ INICIAR';
  
  WORLDS.forEach((w,i)=>{
    const btn = document.createElement('div');
    btn.className = 'world-btn';
    btn.innerHTML = `<span class="wb-icon">${['🌿','🏜️','🕳️','❄️','🌲','⛰️','🏰'][i]}</span>MUNDO ${i+1}`;
    btn.onclick = ()=>{
      document.querySelectorAll('.world-btn').forEach(b=>b.style.borderColor='rgba(255,255,255,.3)');
      btn.style.borderColor = '#FFE600';
      document.getElementById('marioStartBtn').dataset.world = i+1;
      document.getElementById('marioStartBtn').textContent = '▶ MUNDO '+(i+1)+' - '+w.name;
    };
    ws.appendChild(btn);
  });
  // Auto-select first
  ws.firstChild.click();
}

// Init on load
document.addEventListener('DOMContentLoaded', ()=>{
  showWorldSelect();
});
