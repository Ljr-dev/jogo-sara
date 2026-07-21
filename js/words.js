// ===== WORDS =====
const WORD_LIST = [
  {w:'BOI',e:'🐂'},{w:'PAI',e:'👨'},{w:'MAO',e:'✋'},{w:'PE',e:'🦶'},{w:'SOL',e:'☀️'},
  {w:'OVO',e:'🥚'},{w:'UVA',e:'🍇'},{w:'BOLA',e:'⚽'},{w:'CASA',e:'🏠'},{w:'GATO',e:'🐱'},
  {w:'SAPO',e:'🐸'},{w:'PATO',e:'🦆'},{w:'VACA',e:'🐄'},{w:'LUA',e:'🌙'},{w:'BOLO',e:'🎂'},
  {w:'DADO',e:'🎲'},{w:'FOGO',e:'🔥'},{w:'MALA',e:'🧳'},{w:'CAMA',e:'🛏️'},{w:'BOCA',e:'👄'},
  {w:'VELA',e:'🕯️'},{w:'PIPA',e:'🪁'},{w:'BOTA',e:'👢'},{w:'MEIA',e:'🧦'},{w:'RATO',e:'🐀'},
  {w:'LEAO',e:'🦁'},{w:'URSO',e:'🐻'},{w:'GALO',e:'🐓'},{w:'TATU',e:'🦔'},{w:'TIGRE',e:'🐯'},
  {w:'OVELHA',e:'🐑'},{w:'IGUANA',e:'🦎'},{w:'JACARE',e:'🐊'},{w:'ABELHA',e:'🐝'},{w:'PINGUIM',e:'🐧'},
  {w:'BANANA',e:'🍌'},{w:'LIVRO',e:'📖'},{w:'PIZZA',e:'🍕'},{w:'CHAVE',e:'🔑'},{w:'ELEFANTE',e:'🐘'},
  {w:'CACHORRO',e:'🐕'},{w:'BORBOLETA',e:'🦋'},{w:'CHOCOLATE',e:'🍫'},{w:'MORANGO',e:'🍓'},{w:'ARVORE',e:'🌳'},
  {w:'DINOSSAURO',e:'🦕'}
];
let wordScore = 0;

function nextWord(){
  const word = WORD_LIST[Math.floor(Math.random()*WORD_LIST.length)];
  document.getElementById('wordDisplay').textContent = word.w;
  document.getElementById('wordFeedback').textContent = '';
  const wrong = WORD_LIST.filter(w=>w.w!==word.w).sort(()=>Math.random()-.5).slice(0,2);
  const opts = [word,...wrong].sort(()=>Math.random()-.5);
  const container = document.getElementById('wordOptions');
  container.innerHTML = '';
  opts.forEach(o=>{
    const card = document.createElement('div'); card.className = 'word-opt';
    card.textContent = o.e;
    card.dataset.word = o.w;
    card.onclick = ()=>{
      if(card.classList.contains('disabled')) return;
      document.querySelectorAll('.word-opt').forEach(c=>c.classList.add('disabled'));
      if(o.w===word.w){
        card.classList.add('correct'); wordScore++;
        document.getElementById('wordsScore').textContent = wordScore;
        document.getElementById('wordFeedback').textContent = '✅ ISSO! '+word.w+'!';
        celebrar();
        setTimeout(nextWord, 1500);
      } else {
        card.classList.add('wrong');
        document.getElementById('wordFeedback').textContent = '❌ TENTE DE NOVO!';
        setTimeout(()=>{ card.classList.remove('wrong','disabled'); document.querySelectorAll('.word-opt').forEach(c=>c.classList.remove('disabled')); }, 800);
      }
    };
    container.appendChild(card);
  });
}

window.onload = nextWord;
