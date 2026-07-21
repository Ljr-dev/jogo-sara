// ===== SUPER MARIO WORLD - v2 Funcional =====
let c, ctx, run = false, anim = null;
let world = 1, score = 0, coins = 0, lives = 3;
let player = {}, camera = 0, particles = [];
let keys = {left:false, right:false, jump:false, down:false, attack:false};
let level = [], blocks = [], enemies = [], items = [];
let power = 0, starTimer = 0, levelW = 6400; // 200 tiles

const T = 32; // tile size
const GRAVITY = 0.55;
const GROUND_Y_ROW = 13; // ground starts at row 13 (0-indexed)

const WORLDS = [
  {name:'YOSHI ISLAND',bg:'#5c94fc',grass:'#5ab45a',brick:'#c47a3a'},
  {name:'DONUT PLAINS',bg:'#f4c87a',grass:'#c49a5a',brick:'#a08040'},
  {name:'VANILLA DOME',bg:'#2a2a3a',grass:'#5a4a3a',brick:'#7a6a5a'},
  {name:'BUTTER BRIDGE',bg:'#c8e8ff',grass:'#8ac8e8',brick:'#68a8c8'},
  {name:'FOREST ILLUSION',bg:'#2a5a2a',grass:'#3a6a3a',brick:'#4a7a4a'},
  {name:'CHOCOLATE ISL',bg:'#d4a060',grass:'#a08040',brick:'#806030'},
  {name:'BOWSER VALLEY',bg:'#3a1a1a',grass:'#5a2a2a',brick:'#7a3a3a'},
];

function genLevel(){
  level = [];
  for(let y=0;y<15;y++){ level[y]=[]; for(let x=0;x<200;x++) level[y][x]=0; }
  // Ground rows 13 and 14
  for(let x=0;x<200;x++){ level[13][x]=1; level[14][x]=1; }
  // Pipes
  for(let i=0;i<4;i++){
    let px=20+i*40+Math.floor(Math.random()*15);
    if(px>190) continue;
    let ph=2+Math.floor(Math.random()*3);
    for(let y=0;y<ph;y++) if(13-y>=0) level[13-y][px]=2;
    if(13-ph>=0) level[13-ph][px]=3;
  }
  // ? blocks at row 10
  for(let i=0;i<6;i++){
    let bx=15+i*30+Math.floor(Math.random()*10);
    if(bx<200) level[10][bx]=4;
  }
  // Brick platforms at rows 8-10
  for(let p=0;p<4;p++){
    let px=25+p*45+Math.floor(Math.random()*10);
    let py=9-Math.floor(Math.random()*2);
    let pw=3+Math.floor(Math.random()*3);
    for(let i=0;i<pw;i++) if(px+i<200) level[py][px+i]=5;
  }
  // Coins in air (row 7-11)
  for(let i=0;i<15;i++){
    let cx=10+Math.floor(Math.random()*180);
    let cy=7+Math.floor(Math.random()*5);
    if(level[cy][cx]===0) level[cy][cx]=6;
  }
  // Gaps (pits)
  [50,100,150].forEach(gx=>{
    if(gx<195){ level[13][gx]=0; level[13][gx+1]=0; level[14][gx]=0; level[14][gx+1]=0; }
  });
}

function startMario(w){
  world = w||1; score=0; coins=0; lives=3; power=0; starTimer=0;
  loadLevel();
}

function loadLevel(){
  const area = document.getElementById('marioCanvas').parentElement;
  c = document.getElementById('marioCanvas');
  c.width = area.clientWidth;
  c.height = area.clientHeight;
  ctx = c.getContext('2d');
  
  genLevel();
  camera = 0;
  blocks=[]; enemies=[]; items=[]; particles=[];
  
  // Player in world coords: x=pixels, y=pixels
  player = {x:80, y:GROUND_Y_ROW*T-40, w:24, h:30, vx:0, vy:0, onGround:false, jumping:false, facing:1, inv:0, ducking:false, attacking:false, atkTimer:0};
  
  // Build block list from level
  for(let y=0;y<15;y++) for(let x=0;x<200;x++){
    let t=level[y][x];
    if(t===0) continue;
    let bx=x*T, by=y*T;
    if(t===1) blocks.push({x:bx,y:by,w:T,h:T,type:'ground'});
    if(t===2) blocks.push({x:bx-3,y:by+8,w:38,h:24,type:'pipe'});
    if(t===3) blocks.push({x:bx-6,y:by-4,w:44,h:40,type:'pipe_top'});
    if(t===4) blocks.push({x:bx,y:by,w:T,h:T,type:'question',hit:false,bump:0,bumpT:0});
    if(t===5) blocks.push({x:bx,y:by,w:T,h:T,type:'brick',hit:false});
    if(t===6) items.push({x:bx+4,y:by+4,w:24,h:24,type:'coin',got:false,bob:Math.random()*6});
  }
  
  // Enemies
  for(let i=0;i<6;i++){
    let ex=300+Math.random()*(levelW-500);
    enemies.push({x:ex,y:GROUND_Y_ROW*T-32,w:28,h:28,vx:-(0.8+Math.random()*0.5),alive:true,squish:0});
  }
  
  document.getElementById('marioOverlay').classList.add('hidden');
  document.getElementById('marioScore').textContent=score;
  document.getElementById('marioLives').textContent='❤️ '+lives;
  document.getElementById('marioCoins').textContent='🪙 '+coins;
  document.getElementById('marioWorld').textContent='MUNDO '+world+'-1';
  
  if(anim) cancelAnimationFrame(anim);
  run=true;
  anim=requestAnimationFrame(gameLoop);
}

function gameLoop(){
  if(!run) return;
  update();
  draw();
  anim=requestAnimationFrame(gameLoop);
}

function update(){
  let p=player, w=c.width, h=c.height;
  let wo=WORLDS[world-1];
  
  // Movement
  let mx=0;
  if(keys.left){ mx=-3.5; p.facing=-1; }
  if(keys.right){ mx=3.5; p.facing=1; }
  if(keys.attack && power>=2) mx*=1.3;
  p.vx=mx;
  
  p.ducking=keys.down&&p.onGround;
  
  // Jump
  if(keys.jump && p.onGround && !p.jumping){
    p.vy=-10.5; p.onGround=false; p.jumping=true;
  }
  if(!keys.jump && p.jumping && p.vy<-3) p.vy*=0.85; // variable height
  
  // Gravity
  p.vy+=GRAVITY;
  if(p.vy>12) p.vy=12;
  
  // Attack
  if(keys.attack && !p.attacking){
    p.attacking=true; p.atkTimer=10;
    if(power>=2){
      items.push({x:p.x+(p.facing>0?p.w:0),y:p.y+p.h/2,w:10,h:10,type:'fire',vx:p.facing*7,vy:-1.5,life:50});
    } else {
      // Melee hit
      for(let e of enemies){
        if(!e.alive) continue;
        let fx=p.x+(p.facing>0?p.w:-20);
        if(Math.abs(e.x-fx)<30 && Math.abs(e.y-p.y)<30){ e.alive=false; score+=30; spawnParticles(e.x,e.y,6,'stomp'); }
      }
    }
  }
  if(p.attacking){ p.atkTimer--; if(p.atkTimer<=0) p.attacking=false; }
  
  // Apply velocity
  p.x+=p.vx;
  p.y+=p.vy;
  
  // Invincibility
  if(p.inv>0) p.inv--;
  if(starTimer>0) starTimer--;
  
  // === COLLISION ===
  p.onGround=false;
  let pH=p.ducking&&p.onGround?20:p.h;
  
  for(let b of blocks){
    if(!b.x) continue; // skip if removed
    if(!rectCollide(p.x,p.y,p.w,pH,b.x,b.y,b.w,b.h)) continue;
    
    // From top (landing)
    if(p.vy>0 && p.y+pH>b.y && p.y+pH<b.y+b.h+6){
      p.y=b.y-pH; p.vy=0; p.onGround=true; p.jumping=false;
    }
    // From bottom (head bump)
    else if(p.vy<0 && p.y<b.y+b.h && p.y>b.y){
      p.vy=0; p.y=b.y+b.h;
      if(b.type==='question'&&!b.hit){
        b.hit=true; b.bump=-6; b.bumpT=6;
        coins++; score+=10; spawnParticles(b.x+16,b.y,5,'coin');
      }
      if(b.type==='brick'&&!b.hit&&power>0){
        b.hit=true; spawnParticles(b.x+16,b.y+16,8,'break');
        b.x=undefined; // remove
      }
    }
    // Side
    else {
      if(p.vx>0) p.x=b.x-p.w;
      else if(p.vx<0) p.x=b.x+b.w;
      p.vx=0;
    }
  }
  
  // Bump animations
  blocks.forEach(b=>{
    if(b.bumpT){ b.bumpT--; b.bump+=b.bumpT>3?-2:2; if(b.bumpT<=0)b.bump=0; }
  });
  
  // Remove hit blocks
  blocks=blocks.filter(b=>b.x!==undefined);
  
  // Camera
  let target=p.x-w*0.3;
  camera+=(target-camera)*0.1;
  if(camera<0)camera=0;
  if(camera>levelW-w)camera=levelW-w;
  
  // Fall off
  if(p.y>h+60){ playerDie(); return; }
  
  // === ENEMIES ===
  for(let e of enemies){
    if(!e.alive) continue;
    e.x+=e.vx;
    e.y=GROUND_Y_ROW*T-32;
    if(e.squish>0){ e.squish--; if(e.squish===1)e.alive=false; continue; }
    
    let sx=e.x-camera;
    if(sx<-80||sx>w+80) continue;
    
    if(rectCollide(p.x,p.y,p.w,pH,e.x,e.y,e.w,e.h)){
      if(p.vy>0 && p.y+pH<e.y+12){
        e.squish=25; p.vy=-8; score+=20;
        spawnParticles(e.x+14,e.y,4,'stomp');
      } else if(p.inv<=0){ playerHit(); }
    }
  }
  
  // === ITEMS ===
  for(let i of items){
    if(i.type==='coin'&&!i.got){
      i.bob+=0.05;
      if(rectCollide(p.x,p.y,p.w,pH,i.x-2,i.y-2+Math.sin(i.bob)*3,28,28)){
        i.got=true; coins++; score+=5;
        spawnParticles(i.x+12,i.y+12,4,'coin');
      }
    }
    if(i.type==='fire'&&i.life){
      i.x+=i.vx; i.y+=i.vy; i.vy+=0.3; i.life--;
      for(let e of enemies){
        if(!e.alive) continue;
        if(rectCollide(i.x,i.y,i.w,i.h,e.x,e.y,e.w,e.h)){
          e.alive=false; score+=30; i.life=0;
          spawnParticles(e.x+14,e.y+14,6,'stomp');
        }
      }
    }
    if(i.type==='mushroom'&&!i.got){
      if(rectCollide(p.x,p.y,p.w,pH,i.x,i.y,i.w,i.h)){
        i.got=true; power=Math.min(power+1,2); score+=50; p.inv=60;
        spawnParticles(p.x+12,p.y,8,'power');
      }
    }
  }
  items=items.filter(i=>i.type!=='fire'||i.life>0);
  
  document.getElementById('marioScore').textContent=score;
  document.getElementById('marioLives').textContent='❤️ '+lives;
  document.getElementById('marioCoins').textContent='🪙 '+coins;
}

function draw(){
  let wo=WORLDS[world-1], w=c.width, h=c.height;
  ctx.clearRect(0,0,w,h);
  
  // Sky
  ctx.fillStyle=wo.bg; ctx.fillRect(0,0,w,h);
  
  // Clouds
  ctx.fillStyle='rgba(255,255,255,0.5)';
  for(let i=0;i<3;i++){
    let cx=((i*280-camera*0.3)%840+840)%840-80;
    ctx.beginPath(); ctx.arc(cx,30+i*25,35,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+18,22+i*25,28,0,Math.PI*2); ctx.fill();
  }
  
  // Hills
  ctx.fillStyle=wo.grass;
  for(let i=0;i<3;i++){
    let hx=((i*350-camera*0.4)%1050+1050)%1050-100;
    ctx.beginPath();
    ctx.moveTo(hx,GROUND_Y_ROW*T);
    ctx.quadraticCurveTo(hx+50,GROUND_Y_ROW*T-70,hx+100,GROUND_Y_ROW*T);
    ctx.fill();
  }
  
  // Level tiles
  for(let y=0;y<15;y++) for(let x=0;x<200;x++){
    let t=level[y][x];
    if(t===0) continue;
    let sx=x*T-camera, sy=y*T;
    if(sx<-T||sx>w+T) continue;
    
    if(t===1){ // Ground
      ctx.fillStyle=wo.brick; ctx.fillRect(sx,sy,T,T);
      ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);
      if(y>0&&level[y-1][x]===0){ ctx.fillStyle=wo.grass; ctx.fillRect(sx,sy-3,T,6); }
    } else if(t===2||t===3){ // Pipe
      let lip=t===3?4:0;
      ctx.fillStyle='#2a9a2a'; ctx.fillRect(sx-5,sy+lip,T+10,T-lip);
      ctx.fillStyle='#3ab43a'; ctx.fillRect(sx,sy+lip,T,T-lip);
      ctx.fillStyle='#5ad45a'; ctx.fillRect(sx+4,sy+lip,6,T-lip);
      if(t===3){ ctx.fillStyle='#2a9a2a'; ctx.fillRect(sx-7,sy-4,T+14,8); ctx.fillStyle='#3ab43a'; ctx.fillRect(sx-2,sy-4,T+4,8); }
    } else if(t===4){ // ? block
      let b=blocks.find(b=>b.x===x*T&&b.y===y*T);
      let bp=(b&&b.bump)||0;
      if(b&&b.hit){ ctx.fillStyle='#8a6a4a'; ctx.fillRect(sx,sy+bp,T,T); ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=2; ctx.strokeRect(sx,sy+bp,T,T); }
      else {
        ctx.fillStyle='#c84c0c'; ctx.fillRect(sx,sy+bp,T,T);
        ctx.strokeStyle='#e8a828'; ctx.lineWidth=2; ctx.strokeRect(sx,sy+bp,T,T);
        ctx.fillStyle='#FFE600'; ctx.font='bold 18px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('?',sx+16,sy+16+bp);
      }
    } else if(t===5){ // Brick
      ctx.fillStyle=wo.brick; ctx.fillRect(sx,sy,T,T);
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.strokeRect(sx,sy,T,T);
      ctx.beginPath(); ctx.moveTo(sx,sy+16); ctx.lineTo(sx+32,sy+16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx+16,sy); ctx.lineTo(sx+16,sy+32); ctx.stroke();
    } else if(t===6){ // Coin
      let item=items.find(i=>Math.abs(i.x-(x*T+4))<5);
      let bob=item?Math.sin(item.bob)*4:0;
      ctx.save(); ctx.shadowColor='#FFD700'; ctx.shadowBlur=8;
      ctx.font='20px sans-serif'; ctx.textAlign='center';
      ctx.fillText('🪙',sx+16,sy+16+bob);
      ctx.restore();
    }
  }
  
  // Enemies
  for(let e of enemies){
    if(!e.alive&&e.squish<=0) continue;
    let sx=e.x-camera;
    if(sx<-40||sx>w+40) continue;
    if(e.squish>5){ ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText('👾',sx+14,e.y+26); }
    else if(e.alive){ let wb=Math.sin(Date.now()*0.005+e.x)*3; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText('👾',sx+14,e.y+20+wb); }
  }
  
  // Items
  for(let i of items){
    if(i.type!=='coin'&&i.type!=='fire'&&i.type!=='mushroom') continue;
    if(i.got) continue;
    let sx=i.x-camera;
    if(sx<-20||sx>w+20) continue;
    if(i.type==='coin'){ ctx.save(); ctx.shadowColor='#FFD700'; ctx.shadowBlur=6; ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText('🪙',sx+12,i.y+12); ctx.restore(); }
    if(i.type==='fire'){ ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.fillText('🔥',sx+5,i.y+8); }
    if(i.type==='mushroom'){ ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.fillText('🍄',sx+12,i.y+12); }
  }
  
  // Particles
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.3; p.life--;
    ctx.globalAlpha=p.life/12;
    ctx.font='12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.type==='coin'?'🪙':(p.type==='break'?'•':(p.type==='power'?'✨':'💥')),p.x,p.y);
  });
  ctx.globalAlpha=1;
  particles=particles.filter(p=>p.life>0);
  
  // Player
  let px=player.x-camera, py=player.y;
  if(player.inv>0&&Math.floor(player.inv/4)%2===0) return;
  
  ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(px+12,GROUND_Y_ROW*T+4,14,3,0,0,Math.PI*2); ctx.fill();
  
  ctx.save();
  if(player.facing<0) ctx.scale(-1,1);
  let dx=player.facing<0?-px-player.w:px;
  
  if(player.ducking&&player.onGround){ ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.fillText('🏃',dx+12,py+22); }
  else if(!player.onGround){ ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText('🏃',dx+12,py+22); }
  else { ctx.font='26px sans-serif'; ctx.textAlign='center'; ctx.fillText(Math.floor(Date.now()/150)%2===0?'🏃':'🚶',dx+12,py+24); }
  ctx.restore();
}

function rectCollide(ax,ay,aw,ah,bx,by,bw,bh){ return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by; }

function spawnParticles(x,y,n,type){
  for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-0.5)*6,vy:-Math.random()*6-3,life:12,type});
}

function playerHit(){
  if(player.inv>0) return;
  if(power>0){ power--; player.inv=60; spawnParticles(player.x+12,player.y,6,'stomp'); }
  else playerDie();
}

function playerDie(){
  lives--;
  if(lives<=0){ gameOverMario(); }
  else { loadLevel(); }
}

function gameOverMario(){
  run=false; if(anim) cancelAnimationFrame(anim);
  document.getElementById('marioOverlay').classList.remove('hidden');
  document.getElementById('marioTitle').textContent='💥 GAME OVER';
  document.getElementById('marioSub').textContent='SCORE: '+score+' | 🪙 '+coins;
  document.getElementById('marioStartBtn').textContent='🔄 JOGAR DE NOVO';
  document.getElementById('worldSelect').innerHTML='';
  if(score>50) celebrar();
}

// ===== CONTROLS =====
['Left','Right','Jump','Down','Attack'].forEach(name=>{
  let id='btn'+name;
  let el=document.getElementById(id);
  if(!el) return;
  el.addEventListener('touchstart',e=>{e.preventDefault(); keys[name.toLowerCase()]=true;});
  el.addEventListener('touchend',e=>{e.preventDefault(); keys[name.toLowerCase()]=false;});
  el.addEventListener('mousedown',e=>{e.preventDefault(); keys[name.toLowerCase()]=true;});
  el.addEventListener('mouseup',e=>{e.preventDefault(); keys[name.toLowerCase()]=false;});
});
// Up also = jump
document.getElementById('btnUp').addEventListener('touchstart',e=>{e.preventDefault(); keys.jump=true;});
document.getElementById('btnUp').addEventListener('touchend',e=>{e.preventDefault(); keys.jump=false;});

document.onkeydown=e=>{
  if(e.key==='ArrowLeft') keys.left=true;
  if(e.key==='ArrowRight') keys.right=true;
  if(e.key==='ArrowUp'||e.key===' ') keys.jump=true;
  if(e.key==='ArrowDown') keys.down=true;
  if(e.key==='x'||e.key==='z') keys.attack=true;
};
document.onkeyup=e=>{
  if(e.key==='ArrowLeft') keys.left=false;
  if(e.key==='ArrowRight') keys.right=false;
  if(e.key==='ArrowUp'||e.key===' ') keys.jump=false;
  if(e.key==='ArrowDown') keys.down=false;
  if(e.key==='x'||e.key==='z') keys.attack=false;
};

// ===== MENU =====
document.getElementById('marioStartBtn').addEventListener('click',()=>{
  let ws=document.getElementById('worldSelect');
  if(ws.children.length===0) showWorlds();
  else startMario(parseInt(document.getElementById('marioStartBtn').dataset.world)||1);
});

function showWorlds(){
  let ws=document.getElementById('worldSelect');
  ws.innerHTML='';
  document.getElementById('marioTitle').textContent='🌍 SELECIONE O MUNDO';
  document.getElementById('marioSub').textContent='';
  document.getElementById('marioStartBtn').textContent='▶ INICIAR';
  WORLDS.forEach((w,i)=>{
    let btn=document.createElement('div');
    btn.className='world-btn';
    btn.innerHTML=`<span class="wb-icon">${['🌿','🏜️','🕳️','❄️','🌲','⛰️','🏰'][i]}</span>MUNDO ${i+1}`;
    btn.onclick=()=>{
      document.querySelectorAll('.world-btn').forEach(b=>b.style.borderColor='rgba(255,255,255,.3)');
      btn.style.borderColor='#FFE600';
      document.getElementById('marioStartBtn').dataset.world=i+1;
      document.getElementById('marioStartBtn').textContent='▶ MUNDO '+(i+1)+' - '+w.name;
    };
    ws.appendChild(btn);
  });
  ws.firstChild?.click();
}

document.addEventListener('DOMContentLoaded',showWorlds);
