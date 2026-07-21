// ===== SHARED: Celebração =====
function celebrar(){
  const el = document.getElementById('celebration');
  if(!el) return;
  el.classList.add('active'); el.innerHTML = '';
  const colors = ['#ff3b30','#FFE600','#34c759','#007AFF','#AF52DE','#FF9500'];
  for(let i=0;i<40;i++){
    const c = document.createElement('div'); c.className = 'confetti';
    c.style.left = Math.random()*window.innerWidth+'px';
    c.style.background = colors[Math.floor(Math.random()*colors.length)];
    c.style.animationDuration = (1.5+Math.random()*1.5)+'s';
    c.style.animationDelay = Math.random()*0.5+'s';
    el.appendChild(c);
  }
  for(let i=0;i<15;i++){
    const s = document.createElement('div'); s.className = 'star-burst';
    s.textContent = ['⭐','🌟','✨','🎉','🎊'][Math.floor(Math.random()*5)];
    s.style.left = (20+Math.random()*60)+'%'; s.style.top = (20+Math.random()*60)+'%';
    el.appendChild(s);
  }
  setTimeout(()=>{ el.classList.remove('active'); el.innerHTML = ''; }, 2500);
}
