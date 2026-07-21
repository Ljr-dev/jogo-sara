// ===== RUNNER (Subway Surfers Style) - CORRIGIDO =====
let rC, rCtx, rRun = false, rAnim = null, rScore = 0, rSpd = 4;
let rLane = 1, rLX = 0, rY = 0, rJump = false, rJumpV = 0;
let rSlide = false, rSlT = 0, rObs = [], rCoins = [], rStars = [];
let rF = 0, rBg = 0, rGnd = 0, rRunCyc = 0;
let rSX = 0, rSY = 0, rOver = false;
let rCombo = 0, rTotCoins = 0, rObsT = 0, rCoinT = 0;

// Pre-generate building windows so they don't flicker
let rBuildWins = [];
function genBuildWins(){
  rBuildWins = [];
  for(let i=0;i<8;i++){
    const wins = [];
    const bh = 50 + Math.sin(i*2.3)*30 + 30;
    for(let wy=0;wy<bh-15;wy+=18)
      for(let wx=0;wx<55;wx+=20)
        wins.push(Math.random()>0.3);
    rBuildWins.push(wins);
  }
}
genBuildWins();

function startRunner(){
  const area = document.getElementById('runnerArea');
  rC = document.getElementById('runnerCanvas');
  if(!rC) return;
  rC.width = area.clientWidth;
  rC.height = area.clientHeight;
  rCtx = rC.getContext('2d');
  
  rRun = true; rOver = false; rScore = 0; rSpd = 4;
  rLane = 1; rLX = rC.width * 0.22; // Player on LEFT side
  rY = 0; rJump = false; rJumpV = 0;
  rSlide = false; rSlT = 0;
  rObs = []; rCoins = []; rStars = [];
  rF = 0; rBg = 0; rGnd = 0; rRunCyc = 0;
  rCombo = 0; rTotCoins = 0; rObsT = 0; rCoinT = 0;
  
  document.getElementById('runnerOverlay').classList.add('hidden');
  document.getElementById('runnerScore').textContent = '0';
  
  rC.ontouchstart = e=>{ const t=e.touches[0]; rSX=t.clientX; rSY=t.clientY; };
  rC.ontouchend = e=>{ const t=e.changedTouches[0]; swipe(t.clientX-rSX, t.clientY-rSY); };
  rC.onmousedown = e=>{ rSX=e.clientX; rSY=e.clientY; };
  rC.onmouseup = e=>{ swipe(e.clientX-rSX, e.clientY-rSY); };
  document.onkeydown = e=>{ keyHandler(e.key); };
  
  if(rAnim) cancelAnimationFrame(rAnim);
  rAnim = requestAnimationFrame(loop);
}

function swipe(dx,dy){
  if(!rRun||rOver) return;
  if(Math.abs(dx)>Math.abs(dy)){
    if(dx>30) rLane=Math.min(2,rLane+1);
    else if(dx<-30) rLane=Math.max(0,rLane-1);
  } else {
    if(dy<-30&&!rJump&&!rSlide){ rJump=true; rJumpV=-14; }
    else if(dy>30&&!rJump&&!rSlide){ rSlide=true; rSlT=30; }
  }
}
function keyHandler(k){
  if(!rRun||rOver) return;
  if(k==='ArrowLeft') rLane=Math.max(0,rLane-1);
  if(k==='ArrowRight') rLane=Math.min(2,rLane+1);
  if(k==='ArrowUp'&&!rJump&&!rSlide){ rJump=true; rJumpV=-14; }
  if(k==='ArrowDown'&&!rJump&&!rSlide){ rSlide=true; rSlT=30; }
}

function loop(){
  if(!rRun) return;
  rF++; const w=rC.width, h=rC.height;
  
  rSpd = Math.min(rSpd+0.0015, 12);
  
  // Jump
  if(rJump){ rY+=rJumpV; rJumpV+=0.7; if(rY>=0){ rY=0; rJump=false; } }
  if(rSlide){ rSlT--; if(rSlT<=0) rSlide=false; }
  
  rRunCyc = (rRunCyc + rSpd*0.05) % (Math.PI*2);
  rBg = (rBg + rSpd*0.4) % 300;
  rGnd = (rGnd + rSpd) % 100;
  
  // --- SPAWN ---
  rObsT--;
  if(rObsT<=0){
    rObs.push({lane:Math.floor(Math.random()*3), x:w+40, type:['🚧','🚂','📦','🚧','🚂'][Math.floor(Math.random()*5)], hit:false});
    rObsT = Math.max(25, Math.floor(55-rSpd*2.5)) + Math.floor(Math.random()*20);
  }
  rCoinT--;
  if(rCoinT<=0){
    rCoins.push({lane:Math.floor(Math.random()*3), x:w+40, got:false});
    rCoinT = 12 + Math.floor(Math.random()*18);
  }
  if(Math.random()<0.004) rStars.push({lane:Math.floor(Math.random()*3), x:w+40, got:false});
  
  // --- MOVE (leftward = running right) ---
  rObs.forEach(o=>o.x-=rSpd);
  rObs = rObs.filter(o=>o.x>-60);
  rCoins.forEach(c=>c.x-=rSpd);
  rCoins = rCoins.filter(c=>c.x>-40);
  rStars.forEach(s=>s.x-=rSpd);
  rStars = rStars.filter(s=>s.x>-40);
  
  // Player lane position
  const laneW = w*0.22; // lanes on left portion
  const baseX = w*0.10; // left margin
  const px = baseX + rLane * laneW + laneW/2;
  
  // --- COLLISION ---
  for(let o of rObs){
    if(o.hit) continue;
    if(Math.abs(o.x-px)<20 && o.lane===rLane){
      if(rJump&&rY<-8){ o.hit=true; rCombo++; continue; }
      if(rSlide&&o.type==='📦'){ o.hit=true; rCombo++; continue; }
      gameOver(); return;
    }
  }
  
  // Coins
  rCoins.forEach(c=>{
    if(c.got) return;
    if(Math.abs(c.x-px)<18 && c.lane===rLane){
      c.got=true; rScore+=5; rTotCoins++;
      spawnParticles(c.x, h*0.6);
    }
  });
  rStars.forEach(s=>{
    if(s.got) return;
    if(Math.abs(s.x-px)<18 && s.lane===rLane){ s.got=true; rScore+=20; }
  });
  
  if(rF%3===0){ rScore++; document.getElementById('runnerScore').textContent=rScore; }
  
  // ===== DRAW =====
  rCtx.clearRect(0,0,w,h);
  
  // Sky
  const sg=rCtx.createLinearGradient(0,0,0,h*0.55);
  sg.addColorStop(0,'#4FC3F7'); sg.addColorStop(1,'#B3E5FC');
  rCtx.fillStyle=sg; rCtx.fillRect(0,0,w,h*0.6);
  
  // Clouds (scroll right = wind)
  rCtx.fillStyle='rgba(255,255,255,0.5)';
  for(let i=0;i<3;i++){
    const cx=(i*220-rBg*0.3%660+660)%660-80;
    const cy=25+i*25;
    rCtx.beginPath(); rCtx.ellipse(cx,cy,45,18,0,0,Math.PI*2); rCtx.fill();
    rCtx.beginPath(); rCtx.ellipse(cx+18,cy-6,30,15,0,0,Math.PI*2); rCtx.fill();
  }
  
  // Buildings (parallax)
  const bCols=['#90A4AE','#78909C','#B0BEC5','#546E7A','#607D8B'];
  for(let i=0;i<8;i++){
    const bx=(i*85-rBg*1.5%680+680)%680-60;
    const bh=45+Math.sin(i*2.3)*25+25;
    rCtx.fillStyle=bCols[i%5];
    rCtx.fillRect(bx,h*0.55-bh-8,70,bh+8);
    // Windows (pre-generated to avoid flicker)
    rCtx.fillStyle='rgba(255,255,200,0.6)';
    let wi=0;
    for(let wy=0;wy<bh-12;wy+=16)
      for(let wx=0;wx<50;wx+=18){
        if(rBuildWins[i]&&rBuildWins[i][wi]) rCtx.fillRect(bx+12+wx,h*0.55-bh+6+wy,7,9);
        wi++;
      }
  }
  
  // Road
  const rTop=h*0.55, rBot=h;
  const rg=rCtx.createLinearGradient(0,rTop,0,rBot);
  rg.addColorStop(0,'#555'); rg.addColorStop(0.4,'#444'); rg.addColorStop(1,'#222');
  rCtx.fillStyle=rg; rCtx.fillRect(0,rTop,w,rBot-rTop);
  
  // Road top edge
  rCtx.strokeStyle='#FFE600'; rCtx.lineWidth=3;
  rCtx.beginPath(); rCtx.moveTo(0,rTop); rCtx.lineTo(w,rTop); rCtx.stroke();
  
  // Lane lines (on the left portion where player runs)
  rCtx.strokeStyle='rgba(255,255,255,0.3)'; rCtx.lineWidth=2; rCtx.setLineDash([12,18]);
  for(let i=0;i<=2;i++){
    const lx=baseX+i*laneW;
    rCtx.beginPath(); rCtx.moveTo(lx,rTop); rCtx.lineTo(lx,rBot); rCtx.stroke();
  }
  rCtx.setLineDash([]);
  
  // Ground dashes (speed feel)
  rCtx.fillStyle='rgba(255,255,255,0.1)';
  for(let i=0;i<6;i++){
    const gx=(i*70-rGnd*2.5%420+420)%420-20;
    rCtx.fillRect(gx,rBot-14,18,3);
  }
  
  // Side objects
  rCtx.font='22px sans-serif'; rCtx.textAlign='center';
  for(let i=0;i<3;i++){
    const sx=(i*250-rBg*1.2%750+750)%750-60;
    rCtx.fillText(['🌳','🌲','🏪'][i%3],sx,rTop+25);
    rCtx.fillText(['🌳','🌲','🏪'][(i+1)%3],w-sx+20,rTop+25);
  }
  
  // Obstacles
  rObs.forEach(o=>{
    rCtx.font=(o.type==='🚂'?40:36)+'px sans-serif'; rCtx.textAlign='center';
    // Shadow
    rCtx.fillStyle='rgba(0,0,0,0.25)';
    rCtx.beginPath(); rCtx.ellipse(o.x,rBot-25,20,5,0,0,Math.PI*2); rCtx.fill();
    // Obstacle
    rCtx.fillText(o.type,o.x,rTop+25);
  });
  
  // Coins with glow
  rCoins.forEach(c=>{
    if(c.got) return;
    rCtx.save();
    rCtx.shadowColor='#FFD700'; rCtx.shadowBlur=10;
    rCtx.font='26px sans-serif'; rCtx.textAlign='center';
    rCtx.fillText('🪙',c.x,rTop+20+Math.sin(rF*0.08+c.lane)*6);
    rCtx.restore();
  });
  
  // Stars
  rStars.forEach(s=>{
    if(s.got) return;
    rCtx.save();
    rCtx.shadowColor='#FFE600'; rCtx.shadowBlur=12;
    rCtx.font='22px sans-serif'; rCtx.textAlign='center';
    rCtx.fillText('⭐',s.x,rTop+15);
    rCtx.restore();
  });
  
  // Player
  const py=rTop+10+(rJump?rY*3:0);
  const bounce=Math.abs(Math.sin(rRunCyc))*4;
  
  // Shadow
  rCtx.fillStyle=`rgba(0,0,0,${0.25-(rJump?Math.abs(rY)*0.015:0)})`;
  const ss=rJump?0.4:1;
  rCtx.beginPath(); rCtx.ellipse(px,rBot-22,18*ss,5*ss,0,0,Math.PI*2); rCtx.fill();
  
  if(rSlide){
    rCtx.font='26px sans-serif'; rCtx.textAlign='center';
    rCtx.fillText('🛹',px,py+6);
    // Slide sparks
    rCtx.fillStyle='rgba(255,200,0,0.3)';
    for(let i=0;i<3;i++) rCtx.fillRect(px-15-i*8,py+8+i*2,4,4);
  } else if(rJump){
    rCtx.font='34px sans-serif'; rCtx.textAlign='center';
    rCtx.fillText('🏃',px,py-5);
    // Wind lines
    rCtx.strokeStyle='rgba(255,255,255,0.15)'; rCtx.lineWidth=1;
    for(let i=0;i<2;i++){ rCtx.beginPath(); rCtx.moveTo(px-12,py+5+i*10); rCtx.lineTo(px-25,py+5+i*10); rCtx.stroke(); }
  } else {
    rCtx.font='36px sans-serif'; rCtx.textAlign='center';
    rCtx.fillText('🏃',px,py-bounce);
    // Speed trail
    if(rSpd>5){
      rCtx.strokeStyle=`rgba(255,255,255,${Math.min((rSpd-5)*0.04,0.2)})`; rCtx.lineWidth=1;
      for(let i=0;i<3;i++){ rCtx.beginPath(); rCtx.moveTo(px-10-i*6,py-bounce+3+i*4); rCtx.lineTo(px-20-i*8,py-bounce+3+i*4); rCtx.stroke(); }
    }
  }
  
  // Speed lines
  if(rSpd>6){
    rCtx.strokeStyle=`rgba(255,255,255,${Math.min((rSpd-6)*0.04,0.2)})`; rCtx.lineWidth=1;
    for(let i=0;i<4;i++){ const ly=Math.random()*h*0.5; rCtx.beginPath(); rCtx.moveTo(0,ly); rCtx.lineTo(w*0.3,ly); rCtx.stroke(); }
  }
  
  // Combo
  if(rCombo>1){
    rCtx.save();
    rCtx.font='bold 18px sans-serif'; rCtx.textAlign='center';
    rCtx.fillStyle='#FFE600'; rCtx.shadowColor='rgba(0,0,0,0.5)'; rCtx.shadowBlur=4;
    rCtx.fillText('🔥 COMBO x'+rCombo,w/2,50);
    rCtx.restore();
  }
  
  // Coin counter
  rCtx.save();
  rCtx.font='bold 15px sans-serif'; rCtx.textAlign='right';
  rCtx.fillStyle='#FFD700'; rCtx.shadowColor='rgba(0,0,0,0.5)'; rCtx.shadowBlur=3;
  rCtx.fillText('🪙 '+rTotCoins,w-12,50);
  rCtx.restore();
  
  // Particles
  if(particles.length>0){
    particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.3; p.life--; });
    particles=particles.filter(p=>p.life>0);
    particles.forEach(p=>{ rCtx.globalAlpha=p.life/20; rCtx.font='14px sans-serif'; rCtx.textAlign='center'; rCtx.fillText('✨',p.x,p.y); rCtx.globalAlpha=1; });
  }
  
  rAnim = requestAnimationFrame(loop);
}

// Particles
let particles = [];
function spawnParticles(x,y){
  for(let i=0;i<5;i++) particles.push({x,y,vx:(Math.random()-0.5)*5,vy:-Math.random()*7-2,life:18});
}

function gameOver(){
  rRun=false; rOver=true;
  if(rAnim) cancelAnimationFrame(rAnim);
  document.getElementById('runnerOverlay').classList.remove('hidden');
  const bonus=rTotCoins*5;
  document.getElementById('runnerTitle').textContent='💥 GAME OVER';
  document.getElementById('runnerFinalScore').innerHTML=`PONTOS: ${rScore} + 🪙${bonus} = <strong>${rScore+bonus}</strong>`;
  document.querySelector('#runnerOverlay .ro-btn').textContent='🔄 JOGAR DE NOVO';
  if(rScore+bonus>30) celebrar();
  document.onkeydown=null;
}

function restartRunner(){
  if(rAnim) cancelAnimationFrame(rAnim);
  startRunner();
}
