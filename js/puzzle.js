// ===== PUZZLE =====
let puzzleState = [];
let puzzleMoves = 0;
const pEmojis = ['🦁','🐘','🐒','🐶','🐱','🐰','🦊','🐸','🐼'];

function initPuzzle(){
  puzzleMoves = 0;
  document.getElementById('puzzleMoves').textContent = 'MOV: 0';
  document.getElementById('puzzleMovesDisplay').textContent = 'MOVIMENTOS: 0';
  let arr = [...Array(9).keys()];
  do { arr.sort(()=>Math.random()-.5); } while(!isSolvable(arr) || isSolved(arr));
  puzzleState = arr;
  renderPuzzle();
}

function isSolvable(arr){
  let inv = 0;
  for(let i=0;i<9;i++) for(let j=i+1;j<9;j++) if(arr[i] && arr[j] && arr[i]>arr[j]) inv++;
  return inv % 2 === 0;
}
function isSolved(arr){ return arr.every((v,i)=>v===i); }

function renderPuzzle(){
  const grid = document.getElementById('puzzleGrid');
  grid.innerHTML = '';
  puzzleState.forEach((val,i)=>{
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile' + (val===8?' empty':'');
    if(val!==8) tile.textContent = pEmojis[val];
    tile.onclick = ()=> moveTile(i);
    grid.appendChild(tile);
  });
  document.getElementById('puzzleMoves').textContent = 'MOV: '+puzzleMoves;
  document.getElementById('puzzleMovesDisplay').textContent = 'MOVIMENTOS: '+puzzleMoves;
}

function moveTile(idx){
  const empty = puzzleState.indexOf(8);
  const adj = [empty-1, empty+1, empty-3, empty+3];
  if(!adj.includes(idx) || (empty%3===0 && idx===empty-1) || (empty%3===2 && idx===empty+1)) return;
  [puzzleState[idx], puzzleState[empty]] = [puzzleState[empty], puzzleState[idx]];
  puzzleMoves++;
  renderPuzzle();
  if(isSolved(puzzleState)){ celebrar(); setTimeout(()=>{ alert('🎉 VOCE COMPLETOU EM '+puzzleMoves+' MOVIMENTOS!'); }, 500); }
}

window.onload = initPuzzle;
