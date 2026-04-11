import { C } from "../components/ui";
import { useState, useEffect, useRef, useCallback } from "react";

const COLORS_FW=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595'];
const SVG_PIECES={
  wK:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-width="1.5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-7 3c-1.5 5.5 5.5 7.5 5.5 7.5s-4.5 1.5-5.5 8z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,
  wQ:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M9 26c8.5-8.5 15.5-4 18 2 2.5-6 9.5-10.5 18-2l-6 2c3.5 3.5 1 5.5-1 3l-4 1c.5 5-1 8-5 8-3.5-1.5-7.5-2.5-9-5-2 2.5-4.5 1-3-3l-4-1c-2 2.5-4.5.5-1-3L9 26z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11 38.5a35 35 1 0 0 23 0" fill="none"/></g></svg>`,
  wR:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>`,
  wB:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zm6-4c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/></g><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#000" stroke="none"/></g></svg>`,
  wN:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 5.12-3.26 6.5-6 6-5 2-3.5-3.5-5-5.5-1.5-1.5-3-2-3-4-1-1 2-2 2-2s0-2 2-2c0 0 1 1.5 1 1.5s1-1.5 3.5-1.5c1.5 0 2 1.5 2 1.5" fill="#fff"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#000" stroke="none"/><path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 6.9 4.05C33.35 18.49 34 21.1 34 27 34 29.8 29 33 25 33H15V36h20v-3h-2c2.2-1.5 5-5 6-9 0-6-3.5-11.5-10-13.5l-.45-1.1z" fill="#000"/></g></svg>`,
  wP:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  bK:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-7 3c-1.5 5.5 5.5 7.5 5.5 7.5s-4.5 1.5-5.5 8z" fill="#000"/><path d="M20 8h5" stroke-linejoin="miter"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff"/></g></svg>`,
  bQ:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M9 26c8.5-8.5 15.5-4 18 2 2.5-6 9.5-10.5 18-2l-6 2c3.5 3.5 1 5.5-1 3l-4 1c.5 5-1 8-5 8-3.5-1.5-7.5-2.5-9-5-2 2.5-4.5 1-3-3l-4-1c-2 2.5-4.5.5-1-3L9 26z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke="#fff"/><path d="M11 29a35 35 1 0 1 23 0" fill="none" stroke="#fff"/></g></svg>`,
  bR:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3.5-7l1.5-2.5h17l1.5 2.5h-20zm-.5 0v-4h21v4H12z" stroke-linecap="butt"/><path d="M14 29.5v-13h17v13H14z" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt"/><path d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23" fill="none" stroke="#fff" stroke-width="1"/></g></svg>`,
  bB:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zm6-4c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/></g><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#fff" stroke="none"/><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" stroke-width="1.5" stroke-linecap="butt"/></g></svg>`,
  bN:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/><path d="M24 18c.38 5.12-3.26 6.5-6 6-5 2-3.5-3.5-5-5.5-1.5-1.5-3-2-3-4-1-1 2-2 2-2s0-2 2-2c0 0 1 1.5 1 1.5s1-1.5 3.5-1.5c1.5 0 2 1.5 2 1.5" fill="#000"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#fff" stroke="none"/><path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 6.9 4.05C33.35 18.49 34 21.1 34 27 34 29.8 29 33 25 33H15V36h20v-3h-2c2.2-1.5 5-5 6-9 0-6-3.5-11.5-10-13.5l-.45-1.1z" fill="#fff" stroke="none"/></g></svg>`,
  bP:`<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

const INIT=['bR','bN','bB','bQ','bK','bB','bN','bR','bP','bP','bP','bP','bP','bP','bP','bP',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'wP','wP','wP','wP','wP','wP','wP','wP','wR','wN','wB','wQ','wK','wB','wN','wR'];
const PIECE_VALUES={P:100,N:320,B:330,R:500,Q:900,K:20000};

function col(p){return p?p[0]:null}
function typ(p){return p?p[1]:null}
function opp(c){return c==='w'?'b':'w'}
function inB(r,c){return r>=0&&r<8&&c>=0&&c<8}
function idxF(r,c){return r*8+c}
function rcF(i){return[Math.floor(i/8),i%8]}

function getMoves(i,b,ep,cas,forCheck){
  const moves=[];const p=b[i];if(!p)return moves;
  const[r,c]=rcF(i);const cl=col(p);const t=typ(p);const op=opp(cl);const dir=cl==='w'?-1:1;
  const slide=(dr,dc)=>{let nr=r+dr,nc=c+dc;while(inB(nr,nc)){const ti=idxF(nr,nc);if(!b[ti]){moves.push(ti)}else{if(col(b[ti])===op)moves.push(ti);break}nr+=dr;nc+=dc}};
  if(t==='P'){const nr=r+dir;if(inB(nr,c)&&!b[idxF(nr,c)]){moves.push(idxF(nr,c));const sr=cl==='w'?6:1;if(r===sr&&!b[idxF(nr+dir,c)])moves.push(idxF(nr+dir,c))}for(const dc of[-1,1]){if(inB(nr,c+dc)){const ti=idxF(nr,c+dc);if(col(b[ti])===op)moves.push(ti);if(ep===ti)moves.push(ti)}}}
  else if(t==='N'){for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const nr=r+dr,nc=c+dc;if(inB(nr,nc)&&col(b[idxF(nr,nc)])!==cl)moves.push(idxF(nr,nc))}}
  else if(t==='B'){for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]])slide(dr,dc)}
  else if(t==='R'){for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]])slide(dr,dc)}
  else if(t==='Q'){for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])slide(dr,dc)}
  else if(t==='K'){for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){const nr=r+dr,nc=c+dc;if(inB(nr,nc)&&col(b[idxF(nr,nc)])!==cl)moves.push(idxF(nr,nc))}
  if(!forCheck){const row=cl==='w'?7:0;if(r===row&&c===4){const Kk=cl+'K',Rk=cl+'Rk',Rq=cl+'Rq';if(cas[Kk]&&cas[Rk]&&!b[idxF(row,5)]&&!b[idxF(row,6)])moves.push(idxF(row,6));if(cas[Kk]&&cas[Rq]&&!b[idxF(row,3)]&&!b[idxF(row,2)]&&!b[idxF(row,1)])moves.push(idxF(row,2))}}}
  return moves;
}

function isAtt(i,cl,b,ep,cas){const op=opp(cl);for(let j=0;j<64;j++){if(col(b[j])===op&&getMoves(j,b,ep,cas,true).includes(i))return true}return false}
function isInCheck(cl,b,ep,cas){const ki=b.indexOf(cl+'K');return ki>=0&&isAtt(ki,cl,b,ep,cas)}
function legalMoves(i,b,ep,cas){return getMoves(i,b,ep,cas,false).filter(to=>{const nb=[...b];applyML(nb,i,to,ep);return!isInCheck(col(b[i]),nb,null,cas)})}
function applyML(b,from,to,ep){const p=b[from];const t=typ(p);const[fr,fc]=rcF(from);const[tr,tc]=rcF(to);if(t==='P'&&to===ep)b[idxF(fr,tc)]=null;if(t==='K'&&Math.abs(tc-fc)===2){const row=fr;if(tc===6){b[idxF(row,5)]=b[idxF(row,7)];b[idxF(row,7)]=null}else{b[idxF(row,3)]=b[idxF(row,0)];b[idxF(row,0)]=null}}b[to]=p;b[from]=null}

function evalBoard(b){let s=0;for(let i=0;i<64;i++){const p=b[i];if(p){const v=PIECE_VALUES[typ(p)]||0;s+=col(p)==='w'?v:-v}}return s}
function getAllLegal(b,cl,ep,cas){const m=[];for(let i=0;i<64;i++){if(col(b[i])===cl){for(const to of getMoves(i,b,ep,cas,false)){const nb=[...b];applyML(nb,i,to,ep);if(!isInCheck(cl,nb,null,cas))m.push({from:i,to})}}}return m}
function minimax(b,depth,alpha,beta,maximizing,ep,cas){
  if(depth===0)return evalBoard(b);
  const cl=maximizing?'w':'b';const moves=getAllLegal(b,cl,ep,cas);
  if(!moves.length){if(isInCheck(cl,b,ep,cas))return maximizing?-99999:99999;return 0}
  if(maximizing){let best=-Infinity;for(const m of moves){const nb=[...b];applyML(nb,m.from,m.to,ep);const v=minimax(nb,depth-1,alpha,beta,false,null,cas);best=Math.max(best,v);alpha=Math.max(alpha,v);if(beta<=alpha)break}return best}
  else{let best=Infinity;for(const m of moves){const nb=[...b];applyML(nb,m.from,m.to,ep);const v=minimax(nb,depth-1,alpha,beta,true,null,cas);best=Math.min(best,v);beta=Math.min(beta,v);if(beta<=alpha)break}return best}
}
function getBestMove(b,ep,cas){
  const moves=getAllLegal(b,'b',ep,cas);if(!moves.length)return null;
  moves.sort(()=>Math.random()-0.5);
  let best=null,bestVal=Infinity;
  for(const m of moves){const nb=[...b];applyML(nb,m.from,m.to,ep);const v=minimax(nb,2,-Infinity,Infinity,true,null,cas);if(v<bestVal){bestVal=v;best=m}}
  return best;
}

export default function BawduBoard(){
  const[board,setBoard]=useState([...INIT]);
  const[turn,setTurn]=useState('w');
  const[selected,setSelected]=useState(null);
  const[possible,setPossible]=useState([]);
  const[lastMove,setLastMove]=useState(null);
  const[history,setHistory]=useState([]);
  const[capW,setCapW]=useState([]);
  const[capB,setCapB]=useState([]);
  const[ep,setEp]=useState(null);
  const[cas,setCas]=useState({wK:true,wRk:true,wRq:true,bK:true,bRk:true,bRq:true});
  const[status,setStatus]=useState('White to move');
  const[gameOver,setGameOver]=useState(false);
  const[winner,setWinner]=useState('');
  const[promo,setPromo]=useState(null);
  const[fireworks,setFireworks]=useState(false);
  const[thinking,setThinking]=useState(false);
  const[mode,setMode]=useState('ai'); // 'ai' or '2p'
  const canvasRef=useRef(null);
  const fwRef=useRef({interval:null,particles:[],raf:null});

  const newGame=()=>{setBoard([...INIT]);setTurn('w');setSelected(null);setPossible([]);setLastMove(null);setHistory([]);setCapW([]);setCapB([]);setEp(null);setCas({wK:true,wRk:true,wRq:true,bK:true,bRk:true,bRq:true});setStatus('White to move');setGameOver(false);setWinner('');setPromo(null);setThinking(false);stopFW()};
  const undo=()=>{if(!history.length)return;const h=history[history.length-1];setHistory(p=>p.slice(0,-1));setBoard(h.board);setTurn(h.turn);setEp(h.ep);setCas(h.cas);setLastMove(h.lastMove);setCapW(h.capW);setCapB(h.capB);setSelected(null);setPossible([]);setGameOver(false);setWinner('');setPromo(null);setThinking(false);stopFW()};

  const checkEnd=(b,cl,epV,casV)=>{
    let hm=false;for(let i=0;i<64&&!hm;i++){if(col(b[i])===cl&&legalMoves(i,b,epV,casV).length>0)hm=true}
    if(!hm){setGameOver(true);const chk=isInCheck(cl,b,epV,casV);if(chk){const w=cl==='w'?'Black':'White';setWinner(w+' wins!');setStatus('Checkmate!');setFireworks(true)}else setStatus('Stalemate — draw!')}
    else{const chk=isInCheck(cl,b,epV,casV);setStatus((cl==='w'?'White':'Black')+' to move'+(chk?' — check!':''));}
    return hm;
  };

  const commitMove=(nb,cl,newEp,newCas,newLM,newCapW,newCapB,prevBoard,prevTurn,prevEp,prevCas,prevLM,prevCapW,prevCapB)=>{
    setHistory(prev=>[...prev,{board:prevBoard,turn:prevTurn,ep:prevEp,cas:prevCas,lastMove:prevLM,capW:prevCapW,capB:prevCapB}]);
    setBoard(nb);setEp(newEp);setCas(newCas);setLastMove(newLM);setCapW(newCapW);setCapB(newCapB);
    const nextTurn=opp(cl);setTurn(nextTurn);
    return checkEnd(nb,nextTurn,newEp,newCas);
  };

  const doMoveLogic=(from,to,b,cl,epVal,casVal,capWArr,capBArr)=>{
    const nb=[...b];const p=nb[from];const tp=typ(p);
    const[fr,fc]=rcF(from);const[tr,tc]=rcF(to);
    const captured=nb[to];const newCapW=[...capWArr];const newCapB=[...capBArr];
    let epCap=null;
    if(tp==='P'&&to===epVal){epCap=nb[idxF(fr,tc)];nb[idxF(fr,tc)]=null}
    if(tp==='K'&&Math.abs(tc-fc)===2){const row=fr;if(tc===6){nb[idxF(row,5)]=nb[idxF(row,7)];nb[idxF(row,7)]=null}else{nb[idxF(row,3)]=nb[idxF(row,0)];nb[idxF(row,0)]=null}}
    const ac=captured||epCap;if(ac){if(col(ac)==='b')newCapB.push(ac);else newCapW.push(ac)}
    nb[to]=p;nb[from]=null;
    const newEp=(tp==='P'&&Math.abs(tr-fr)===2)?idxF((fr+tr)/2,fc):null;
    const newCas={...casVal};
    if(tp==='K'){newCas[cl+'K']=false;newCas[cl+'Rk']=false;newCas[cl+'Rq']=false}
    if(tp==='R'){if(fc===7)newCas[cl+'Rk']=false;if(fc===0)newCas[cl+'Rq']=false}
    return{nb,newEp,newCas,newCapW,newCapB,isPromo:tp==='P'&&(tr===0||tr===7)};
  };

  const clickSquare=(i)=>{
    if(gameOver||promo||thinking)return;
    if(mode==='ai'&&turn==='b')return;
    const p=board[i];
    if(selected===null){if(!p||col(p)!==turn)return;setSelected(i);setPossible(legalMoves(i,board,ep,cas));}
    else{
      if(possible.includes(i)){
        const cl=col(board[selected]);
        const{nb,newEp,newCas,newCapW,newCapB,isPromo}=doMoveLogic(selected,i,board,cl,ep,cas,capW,capB);
        setSelected(null);setPossible([]);
        if(isPromo){setBoard(nb);setPromo({sq:i,cl,nb,newEp,newCas,newCapW,newCapB,from:selected,prevBoard:[...board],prevTurn:turn,prevEp:ep,prevCas:cas,prevLM:lastMove,prevCapW:[...capW],prevCapB:[...capB]});return}
        const hasMore=commitMove(nb,cl,newEp,newCas,[selected,i],newCapW,newCapB,[...board],turn,ep,cas,lastMove,[...capW],[...capB]);
        if(hasMore&&mode==='ai')triggerAI(nb,newEp,newCas,newCapW,newCapB);
      }else if(p&&col(p)===turn){setSelected(i);setPossible(legalMoves(i,board,ep,cas));}
      else{setSelected(null);setPossible([]);}
    }
  };

  const completePromo=(choice)=>{
    if(!promo)return;
    const{sq,cl,nb,newEp,newCas,newCapW,newCapB,from,prevBoard,prevTurn,prevEp,prevCas,prevLM,prevCapW,prevCapB}=promo;
    const map={Q:cl+'Q',R:cl+'R',B:cl+'B',N:cl+'N'};
    nb[sq]=map[choice];setPromo(null);
    const hasMore=commitMove(nb,cl,newEp,newCas,[from,sq],newCapW,newCapB,prevBoard,prevTurn,prevEp,prevCas,prevLM,prevCapW,prevCapB);
    if(hasMore&&mode==='ai')triggerAI(nb,newEp,newCas,newCapW,newCapB);
  };

  const triggerAI=(b,epV,casV,capWA,capBA)=>{
    setThinking(true);
    setTimeout(()=>{
      const m=getBestMove(b,epV,casV);
      if(!m){setThinking(false);return}
      const cl='b';
      const{nb,newEp,newCas,newCapW,newCapB}=doMoveLogic(m.from,m.to,b,cl,epV,casV,capWA,capBA);
      setThinking(false);
      commitMove(nb,cl,newEp,newCas,[m.from,m.to],newCapW,newCapB,b,'b',epV,casV,null,capWA,capBA);
    },300);
  };

  useEffect(()=>{
    if(!fireworks)return;
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');const fw=fwRef.current;fw.particles=[];
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight};resize();
    const spawn=()=>{const x=Math.random()*canvas.width;const y=Math.random()*canvas.height*0.7;const color=COLORS_FW[Math.floor(Math.random()*COLORS_FW.length)];for(let i=0;i<40;i++){const a=Math.random()*Math.PI*2;const s=2+Math.random()*4;fw.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,alpha:1,color,r:2+Math.random()*2})}};
    spawn();spawn();fw.interval=setInterval(()=>{spawn();spawn()},700);
    const animate=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);fw.particles=fw.particles.filter(p=>p.alpha>0.02);for(const p of fw.particles){p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.alpha-=0.014;ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}fw.raf=requestAnimationFrame(animate)};
    animate();setTimeout(()=>stopFW(),7000);return()=>stopFW();
  },[fireworks]);

  const stopFW=()=>{const fw=fwRef.current;if(fw.interval){clearInterval(fw.interval);fw.interval=null}if(fw.raf){cancelAnimationFrame(fw.raf);fw.raf=null}fw.particles=[];setFireworks(false);const canvas=canvasRef.current;if(canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)};

  const sqBg=(r,c,i)=>{if(selected===i)return'#7fc97f';if(possible.includes(i))return'#aed6ae';if(lastMove&&lastMove.includes(i))return'#cdd16f';return(r+c)%2===0?'#f0d9b5':'#b58863'};
  const PROMO_P={w:{Q:'wQ',R:'wR',B:'wB',N:'wN'},b:{Q:'bQ',R:'bR',B:'bB',N:'bN'}};

  return(
    <div style={{padding:'20px 16px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4,fontFamily:'var(--font-serif)',textAlign:'center'}}>Bawdu Board</h1>
      <p style={{fontSize:13,color:C.textSec,marginBottom:12,textAlign:'center'}}>Classic chess</p>

      <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:16}}>
        <button onClick={()=>{setMode('ai');newGame()}} style={{padding:'7px 16px',borderRadius:100,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid '+(mode==='ai'?C.accent:C.border),background:mode==='ai'?'var(--accent-soft)':'transparent',color:mode==='ai'?C.accent:C.textSec}}>vs Computer</button>
        <button onClick={()=>{setMode('2p');newGame()}} style={{padding:'7px 16px',borderRadius:100,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid '+(mode==='2p'?C.accent:C.border),background:mode==='2p'?'var(--accent-soft)':'transparent',color:mode==='2p'?C.accent:C.textSec}}>2 Players</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
        <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:999,display:fireworks?'block':'none'}} />

        {mode==='ai'&&<div style={{fontSize:12,color:C.textMuted,marginBottom:6}}>You play as White</div>}

        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:4,minHeight:18}}>
          {capB.map((p,i)=><span key={i} style={{width:18,height:18,display:'inline-block'}} dangerouslySetInnerHTML={{__html:SVG_PIECES[p]}} />)}
          {mode==='ai'&&<span style={{fontSize:11,color:C.textMuted,marginLeft:4}}>Computer</span>}
        </div>

        <div style={{position:'relative',width:'100%',maxWidth:400,borderRadius:10,overflow:'hidden',border:'2px solid #8B6914',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',width:'100%',aspectRatio:'1'}}>
            {Array.from({length:64},(_,i)=>{
              const[r,c]=rcF(i);const piece=board[i];
              const isClickable=!gameOver&&!promo&&!thinking&&(mode==='2p'||(mode==='ai'&&turn==='w'));
              return(
                <div key={i} onClick={()=>clickSquare(i)} style={{background:sqBg(r,c,i),cursor:isClickable?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',aspectRatio:'1',position:'relative'}}>
                  {piece&&<div style={{width:'85%',height:'85%',display:'flex',alignItems:'center',justifyContent:'center',filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'}} dangerouslySetInnerHTML={{__html:SVG_PIECES[piece]}} />}
                  {possible.includes(i)&&!piece&&<div style={{position:'absolute',width:'33%',height:'33%',borderRadius:'50%',background:'rgba(0,0,0,0.25)'}} />}
                  {possible.includes(i)&&piece&&<div style={{position:'absolute',inset:0,border:'4px solid rgba(0,0,0,0.25)',boxSizing:'border-box',borderRadius:'50%'}} />}
                </div>
              );
            })}
          </div>
          {promo&&(
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#2a2a3a',border:'2px solid #6c63ff',borderRadius:14,padding:16,display:'flex',gap:12,zIndex:10}}>
              {['Q','R','B','N'].map(ch=>(
                <div key={ch} onClick={()=>completePromo(ch)} style={{width:56,height:56,background:'#1a1a26',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'1px solid #3a3a4a'}}>
                  <div style={{width:44,height:44}} dangerouslySetInnerHTML={{__html:SVG_PIECES[PROMO_P[promo.cl][ch]]}} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:4,minHeight:18,alignItems:'center'}}>
          {capW.map((p,i)=><span key={i} style={{width:18,height:18,display:'inline-block'}} dangerouslySetInnerHTML={{__html:SVG_PIECES[p]}} />)}
          {mode==='ai'&&<span style={{fontSize:11,color:C.textMuted,marginLeft:4}}>You</span>}
        </div>

        {winner&&<div style={{fontSize:18,fontWeight:700,color:C.green,marginTop:10,textAlign:'center'}}>{winner}</div>}

        <div style={{display:'flex',gap:8,marginTop:12,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <span style={{fontSize:13,color:C.textSec}}>{thinking?'Computer thinking...':status}</span>
          <button onClick={undo} style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+C.border,background:C.surface,color:C.text,fontSize:13,cursor:'pointer'}}>Undo</button>
          <button onClick={newGame} style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+C.accent,background:'var(--accent-soft)',color:C.accent,fontSize:13,cursor:'pointer',fontWeight:600}}>New game</button>
        </div>
      </div>
    </div>
  );
}
