// ===== RACE =====
let raceAnimal = null, raceTaps = 0, raceRunning = false, raceAnimals = [];

function initRace(){
  raceAnimal = null; raceTaps = 0; raceRunning = false;
  document.getElementById('raceScore').textContent = 'TAPS: 0';
  document.getElementById('raceTapArea').textContent = '👆 ESCOLHA SEU ANIMAL!';
  document.getElementById('raceTapArea').style.pointerEvents = 'none';
  document.querySelectorAll('.race-pick').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.race-animal,.race-lane,.race-winner').forEach(e=>e.remove());
  raceAnimals = [];
  const shuff = ['🐰','🐱','🐶','🐸'].sort(()=>Math.random()-.5);
  const track = document.getElementById('raceTrack');
  shuff.forEach((a,i)=>{
    const lane = document.createElement('div'); lane.className = 'race-lane'; lane.style.top = (i*25)+'%';
    const el = document.createElement('div'); el.className = 'race-animal'; el.textContent = a;
    el.style.top = (i*25+5)+'%'; el.style.left = '4px'; el.dataset.animal = a; el.dataset.pos = '0';
    track.appendChild(lane); track.appendChild(el);
    raceAnimals.push({el, pos:0, animal:a});
  });
  document.querySelectorAll('.race-pick').forEach(p=>{
    p.onclick = ()=>{
      document.querySelectorAll('.race-pick').forEach(x=>x.classList.remove('active'));
      p.classList.add('active'); raceAnimal = p.dataset.animal;
      document.querySelectorAll('.race-animal').forEach(a=>{ a.classList.remove('active-animal'); if(a.dataset.animal===raceAnimal) a.classList.add('active-animal'); });
      document.getElementById('raceTapArea').textContent = '👆 TAPE PARA CORRER!';
      document.getElementById('raceTapArea').style.pointerEvents = 'auto';
    };
  });
}

document.getElementById('raceTapArea').addEventListener('click', ()=>{
  if(!raceAnimal || raceRunning) return;
  raceTaps++; document.getElementById('raceScore').textContent = 'TAPS: '+raceTaps;
  const player = document.querySelector(`.race-animal[data-animal="${raceAnimal}"]`);
  if(!player) return;
  let pos = Math.min((parseInt(player.dataset.pos)||0) + 6, 94);
  player.dataset.pos = pos; player.style.left = pos+'%';
  raceAnimals.forEach(a=>{ if(a.animal!==raceAnimal && Math.random()>0.6){ a.pos = Math.min(a.pos+Math.floor(Math.random()*3),94); a.el.dataset.pos=a.pos; a.el.style.left=a.pos+'%'; } });
  if(pos>=94){ raceRunning=true; celebrar(); document.getElementById('raceTapArea').textContent='🎉 '+(raceAnimal||'')+' VENCEU!'; setTimeout(()=>{ raceRunning=false; initRace(); },3000); }
});

window.onload = initRace;
