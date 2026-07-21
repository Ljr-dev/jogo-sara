// ===== RUNNER (Subway Surfers Clone) =====
let rCanvas, rCtx, rRunning = false, rAnimId = null, rScore = 0, rSpeed = 3;
let rLane = 1, rY = 0, rJumping = false, rJumpVel = 0, rSliding = false;
let rObstacles = [], rFrame = 0, rBgOff = 0;

function startRunner(){
  const area = document.getElementById('runnerArea');
  rCanvas = document.getElementById('runnerCanvas');
  if(!rCanvas) return;
  rCanvas.width = area.clientWidth;
  rCanvas.height = area.clientHeight;
  rCtx = rCanvas.getContext('2d');
  rRunning = true; rScore = 0; rSpeed = 3; rLane = 1; rY = 0;
  rJumping = false; rJumpVel = 0; rSliding = false; rObstacles = []; rFrame = 0; rBgOff = 0;
  document.getElementById('runnerOverlay').classList.add('hidden');
  document.getElementById('runnerScore').textContent = '0';
  let sx, sy;
  rCanvas.onmousedown = e=>{ sx=e.clientX; sy=e.clientY; };
  rCanvas.onmouseup = e=>{ const dx=e.clientX-sx, dy=e.clientY-sy; swiper(dx,dy); };
  rCanvas.ontouchstart = e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; };
  rCanvas.ontouchend = e=>{ const t=e.changedTouches[0]; swiper(t.clientX-sx, t.clientY-sy); };
  if(rAnimId) cancelAnimationFrame(rAnimId);
  rAnimId = requestAnimationFrame(rLoop);
}

function swiper(dx,dy){
  if(!rRunning) return;
  if(Math.abs(dx)>Math.abs(dy)){ if(dx>20) rLane=Math.min(2,rLane+1); else if(dx<-20) rLane=Math.max(0,rLane-1); }
  else { if(dy<-20 && !rJumping && !rSliding){ rJumping=true; rJumpVel=-12; } else if(dy>20 && !rJumping) rSliding=true; }
}

document.onkeydown = e=>{
  if(!rRunning) return;
  if(e.key==='ArrowLeft') rLane=Math.max(0,rLane-1);
  if(e.key==='ArrowRight') rLane=Math.min(2,rLane+1);
  if(e.key==='ArrowUp' && !rJumping && !rSliding){ rJumping=true; rJumpVel=-12; }
  if(e.key==='ArrowDown' && !rJumping) rSliding=true;
};
document.onkeyup = e=>{ if(e.key==='ArrowDown') rSliding=false; };

function rLoop(){
  if(!rRunning) return;
  rFrame++; const w=rCanvas.width, h=rCanvas.height, lw=w/3;
  rSpeed += 0.002; rBgOff = (rBgOff+rSpeed)%w;
  if(rJumping){ rY+=rJumpVel; rJumpVel+=0.8; if(rY>=0){ rY=0; rJumping=false; } }
  if(rFrame%Math.max(30,Math.floor(60-rSpeed*3))===0){
    rObstacles.push({lane:Math.floor(Math.random()*3), x:w, type:['🚧','🚂','📦'][Math.floor(Math.random()*3)], passed:false});
  }
  rObstacles.forEach(o=>o.x-=rSpeed);
  rObstacles = rObstacles.filter(o=>o.x>-40);
  for(let o of rObstacles){
    if(o.passed) continue;
    const px=lw*rLane+lw/2, pw=lw*0.6;
    if(Math.abs(o.x-px)<pw/2+15 && o.lane===rLane){
      if(!(rY<-5) && !(rSliding&&o.type==='📦')){ gameOver(); return; }
    }
    if(o.x<px-lw) o.passed=true;
  }
  if(rFrame%5===0){ rScore++; document.getElementById('runnerScore').textContent=rScore; }
  rCtx.clearRect(0,0,w,h);
  const g=rCtx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#87CEEB'); g.addColorStop(1,'#E0F7FA');
  rCtx.fillStyle=g; rCtx.fillRect(0,0,w,h);
  rCtx.fillStyle='#B0BEC5';
  for(let i=0;i<6;i++){ const bx=(i*100-rBgOff%600+600)%600-100, bh=40+Math.sin(i*1.5)*20; rCtx.fillRect(bx,h-70-bh,80,bh); rCtx.fillStyle='#90A4AE'; for(let j=0;j<4;j++) rCtx.fillRect(bx+10+j*18,h-60-bh+j*15,8,12); rCtx.fillStyle='#B0BEC5'; }
  rCtx.fillStyle='#555'; rCtx.fillRect(0,h-30,w,30);
  rCtx.fillStyle='#FFE600'; for(let i=0;i<10;i++){ const lx=(i*60-rBgOff%600+600)%600; rCtx.fillRect(lx,h-28,30,6); }
  rCtx.fillStyle='#444'; rCtx.fillRect(0,h-35,w,5);
  for(let i=0;i<3;i++){ rCtx.strokeStyle='rgba(255,255,255,.2)'; rCtx.lineWidth=1; rCtx.setLineDash([8,8]); rCtx.beginPath(); rCtx.moveTo(lw*i,h-35); rCtx.lineTo(lw*i,0); rCtx.stroke(); }
  rCtx.setLineDash([]);
  rObstacles.forEach(o=>{ rCtx.font='36px sans-serif'; rCtx.textAlign='center'; rCtx.fillText(o.type,o.x,h-70); });
  const px=lw*rLane+lw/2, py=h-50+(rY<0?rY*3:0);
  rCtx.font=rSliding?'32px sans-serif':'40px sans-serif';
  rCtx.fillText(rSliding?'🛹':'🏃',px,py+(rJumping?-20:0));
  rCtx.fillStyle='rgba(0,0,0,.15)'; rCtx.beginPath(); rCtx.ellipse(px,h-28,18,6,0,0,Math.PI*2); rCtx.fill();
  rAnimId = requestAnimationFrame(rLoop);
}

function gameOver(){
  rRunning=false; if(rAnimId) cancelAnimationFrame(rAnimId);
  document.getElementById('runnerOverlay').classList.remove('hidden');
  document.getElementById('runnerTitle').textContent='💥 GAME OVER';
  document.getElementById('runnerFinalScore').textContent='PONTOS: '+rScore;
  document.querySelector('#runnerOverlay .ro-btn').textContent='🔄 JOGAR DE NOVO';
  celebrar();
}

function restartRunner(){
  if(rAnimId) cancelAnimationFrame(rAnimId);
  startRunner();
}
