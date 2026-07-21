// ===== COOKING =====
const RECIPES = [
  {name:'BOLO', icon:'🎂', ings:['🥚','🧈','🥛','🍫']},
  {name:'SOPA', icon:'🍜', ings:['🥕','🧅','🥔','🥩']},
  {name:'SALADA', icon:'🥗', ings:['🥬','🍅','🥒','🫒']},
  {name:'PIZZA', icon:'🍕', ings:['🧀','🍅','🫒','🍄']},
];
const ALL_INGS = ['🥚','🧈','🥛','🍫','🥕','🧅','🥔','🥩','🥬','🍅','🥒','🫒','🧀','🍄'];
let cookRound = 0, cookScore = 0, cookSelected = [], cookRecipe = null;

function initCooking(){ cookRound=0; cookScore=0; nextRecipe(); }

function nextRecipe(){
  if(cookRound>=3){ celebrar(); alert('🎉 VOCE FEZ '+cookScore+'/'+cookRound+' RECEITAS!'); initCooking(); return; }
  cookRound++;
  cookRecipe = RECIPES[Math.floor(Math.random()*RECIPES.length)];
  cookSelected = [];
  document.getElementById('cookRecipe').textContent = '🧑‍🍳 FACA '+cookRecipe.name+'! '+cookRecipe.icon;
  document.getElementById('cookProgress').textContent = 'ESCOLHA '+cookRecipe.ings.length+' INGREDIENTES';
  document.getElementById('cookScore').textContent = cookScore+'/'+cookRound;
  const pool = [...cookRecipe.ings, ...ALL_INGS.filter(i=>!cookRecipe.ings.includes(i)).sort(()=>Math.random()-.5).slice(0,6-cookRecipe.ings.length)].sort(()=>Math.random()-.5);
  const container = document.getElementById('cookIngredients');
  container.innerHTML = '';
  pool.forEach(ing=>{
    const el = document.createElement('div'); el.className = 'cook-ing'; el.textContent = ing;
    el.onclick = ()=>{
      if(el.classList.contains('selected')||el.classList.contains('wrong')) return;
      if(cookRecipe.ings.includes(ing)){
        el.classList.add('selected'); cookSelected.push(ing);
        if(cookSelected.length===cookRecipe.ings.length){
          cookScore++; celebrar();
          document.getElementById('cookProgress').textContent = '✅ RECEITA PRONTA!';
          document.getElementById('cookScore').textContent = cookScore+'/'+cookRound;
          setTimeout(nextRecipe, 1500);
        } else {
          document.getElementById('cookProgress').textContent = 'FALTA '+(cookRecipe.ings.length-cookSelected.length)+' INGREDIENTES';
        }
      } else {
        el.classList.add('wrong');
        setTimeout(()=>{ el.classList.remove('wrong'); }, 600);
        document.getElementById('cookProgress').textContent = '❌ INGREDIENTE ERRADO!';
      }
    };
    container.appendChild(el);
  });
}

window.onload = initCooking;
