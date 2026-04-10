import { C } from "../components/ui";
import { useState, useEffect, useRef } from "react";

const PIECES={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
const INIT=['bR','bN','bB','bQ','bK','bB','bN','bR','bP','bP','bP','bP','bP','bP','bP','bP',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'wP','wP','wP','wP','wP','wP','wP','wP','wR','wN','wB','wQ','wK','wB','wN','wR'];
const COLORS=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595'];

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

export default function BawduBoard() {
  const [board, setBoard]         = useState([...INIT]);
  const [turn, setTurn]           = useState('w');
  const [selected, setSelected]   = useState(null);
  const [possible, setPossible]   = useState([]);
  const [lastMove, setLastMove]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [capW, setCapW]           = useState([]);
  const [capB, setCapB]           = useState([]);
  const [ep, setEp]               = useState(null);
  const [cas, setCas]             = useState({wK:true,wRk:true,wRq:true,bK:true,bRk:true,bRq:true});
  const [status, setStatus]       = useState('White to move');
  const [gameOver, setGameOver]   = useState(false);
  const [winner, setWinner]       = useState('');
  const [promo, setPromo]         = useState(null);
  const [fireworks, setFireworks] = useState(false);
  const canvasRef = useRef(null);
  const fwRef     = useRef({interval:null, particles:[], raf:null});

  const newGame = () => {
    setBoard([...INIT]); setTurn('w'); setSelected(null); setPossible([]); setLastMove(null);
    setHistory([]); setCapW([]); setCapB([]); setEp(null);
    setCas({wK:true,wRk:true,wRq:true,bK:true,bRk:true,bRq:true});
    setStatus('White to move'); setGameOver(false); setWinner(''); setPromo(null);
    stopFW();
  };

  const undo = () => {
    if (!history.length) return;
    const h = history[history.length - 1];
    setHistory(p => p.slice(0,-1));
    setBoard(h.board); setTurn(h.turn); setEp(h.ep); setCas(h.cas);
    setLastMove(h.lastMove); setCapW(h.capW); setCapB(h.capB);
    setSelected(null); setPossible([]); setGameOver(false); setWinner('');
    setPromo(null); stopFW();
  };

  const clickSquare = (i) => {
    if (gameOver || promo) return;
    const p = board[i];
    if (selected === null) {
      if (!p || col(p) !== turn) return;
      setSelected(i);
      setPossible(legalMoves(i, board, ep, cas));
    } else {
      if (possible.includes(i)) {
        doMove(selected, i, board, turn, ep, cas);
      } else if (p && col(p) === turn) {
        setSelected(i);
        setPossible(legalMoves(i, board, ep, cas));
      } else {
        setSelected(null); setPossible([]);
      }
    }
  };

  const doMove = (from, to, b, t, epVal, casVal) => {
    const nb = [...b]; const p = nb[from];
    const cl = col(p); const tp = typ(p);
    const [fr,fc] = rcF(from); const [tr,tc] = rcF(to);
    const captured = nb[to];
    const newCapW = [...capW]; const newCapB = [...capB];
    let epCap = null;
    if (tp==='P'&&to===epVal){epCap=nb[idxF(fr,tc)];nb[idxF(fr,tc)]=null}
    if (tp==='K'&&Math.abs(tc-fc)===2){const row=fr;if(tc===6){nb[idxF(row,5)]=nb[idxF(row,7)];nb[idxF(row,7)]=null}else{nb[idxF(row,3)]=nb[idxF(row,0)];nb[idxF(row,0)]=null}}
    const ac=captured||epCap;if(ac){if(col(ac)==='b')newCapB.push(ac);else newCapW.push(ac)}
    nb[to]=p; nb[from]=null;
    const newEp=(tp==='P'&&Math.abs(tr-fr)===2)?idxF((fr+tr)/2,fc):null;
    const newCas={...casVal};
    if(tp==='K'){newCas[cl+'K']=false;newCas[cl+'Rk']=false;newCas[cl+'Rq']=false}
    if(tp==='R'){if(fc===7)newCas[cl+'Rk']=false;if(fc===0)newCas[cl+'Rq']=false}
    setHistory(prev=>[...prev,{board:[...b],turn:t,ep:epVal,cas:casVal,lastMove,capW:[...capW],capB:[...capB]}]);
    setCapW(newCapW); setCapB(newCapB); setLastMove([from,to]); setSelected(null); setPossible([]);
    if(tp==='P'&&(tr===0||tr===7)){setBoard(nb);setPromo({sq:to,cl,nb,newEp,newCas});return}
    const nextTurn=opp(cl);
    setBoard(nb); setEp(newEp); setCas(newCas);
    checkEndgame(nb,nextTurn,newEp,newCas);
    setTurn(nextTurn);
  };

  const completePromo=(choice)=>{
    if(!promo)return;
    const{sq,cl,nb,newEp,newCas}=promo;
    const map={Q:cl+'Q',R:cl+'R',B:cl+'B',N:cl+'N'};
    nb[sq]=map[choice];
    const nextTurn=opp(cl);
    setBoard([...nb]); setEp(newEp); setCas(newCas); setPromo(null);
    checkEndgame(nb,nextTurn,newEp,newCas);
    setTurn(nextTurn);
  };

  const checkEndgame=(b,cl,epV,casV)=>{
    let hm=false;
    for(let i=0;i<64&&!hm;i++){if(col(b[i])===cl&&legalMoves(i,b,epV,casV).length>0)hm=true}
    if(!hm){
      setGameOver(true);
      const chk=isInCheck(cl,b,epV,casV);
      if(chk){const w=cl==='w'?'Black':'White';setWinner(w+' wins!');setStatus('Checkmate!');setFireworks(true)}
      else{setStatus('Stalemate — draw!')}
    } else {
      const chk=isInCheck(cl,b,epV,casV);
      setStatus((cl==='w'?'White':'Black')+' to move'+(chk?' — check!':''));
    }
  };

  // Fireworks
  useEffect(()=>{
    if(!fireworks)return;
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const fw=fwRef.current;
    fw.particles=[];
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight};
    resize();
    const spawn=()=>{
      const x=Math.random()*canvas.width; const y=Math.random()*canvas.height*0.7;
      const color=COLORS[Math.floor(Math.random()*COLORS.length)];
      for(let i=0;i<40;i++){const a=Math.random()*Math.PI*2;const s=2+Math.random()*4;fw.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,alpha:1,color,r:2+Math.random()*2})}
    };
    spawn();spawn();
    fw.interval=setInterval(()=>{spawn();spawn()},700);
    const animate=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      fw.particles=fw.particles.filter(p=>p.alpha>0.02);
      for(const p of fw.particles){p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.alpha-=0.014;ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}
      fw.raf=requestAnimationFrame(animate);
    };
    animate();
    setTimeout(()=>stopFW(),7000);
    return ()=>stopFW();
  },[fireworks]);

  const stopFW=()=>{
    const fw=fwRef.current;
    if(fw.interval){clearInterval(fw.interval);fw.interval=null}
    if(fw.raf){cancelAnimationFrame(fw.raf);fw.raf=null}
    fw.particles=[];
    setFireworks(false);
    const canvas=canvasRef.current;
    if(canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  };

  const sqColor=(r,c,i)=>{
    if(selected===i)return'#7fc97f';
    if(possible.includes(i))return'#aed6ae';
    if(lastMove&&lastMove.includes(i))return'#cdd16f';
    return(r+c)%2===0?'#f0d9b5':'#b58863';
  };

  return (
    <div style={{padding:'20px 16px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4,fontFamily:'var(--font-serif)',textAlign:'center'}}>Bawdu Board</h1>
      <p style={{fontSize:13,color:C.textSec,marginBottom:20,textAlign:'center'}}>Classic chess — click a piece to move</p>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
        {/* Fireworks canvas */}
        <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:999,display:fireworks?'block':'none'}} />

        {/* Captured by white */}
        <div style={{display:'flex',gap:2,flexWrap:'wrap',marginBottom:6,minHeight:24,fontSize:16}}>
          {capB.map((p,i)=><span key={i}>{PIECES[p]}</span>)}
        </div>

        {/* Board */}
        <div style={{position:'relative',width:'100%',maxWidth:360}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',width:'100%',aspectRatio:'1'}}>
            {Array.from({length:64},(_,i)=>{
              const[r,c]=rcF(i);
              return(
                <div key={i} onClick={()=>clickSquare(i)} style={{
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:sqColor(r,c,i),cursor:'pointer',fontSize:'clamp(14px,4vw,26px)',
                  userSelect:'none',position:'relative',aspectRatio:'1',
                }}>
                  {board[i]&&PIECES[board[i]]}
                  {possible.includes(i)&&!board[i]&&<div style={{position:'absolute',width:'30%',height:'30%',borderRadius:'50%',background:'rgba(0,0,0,0.2)'}}/>}
                </div>
              );
            })}
          </div>

          {/* Promo picker */}
          {promo&&(
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:12,display:'flex',gap:8,zIndex:10}}>
              {['Q','R','B','N'].map(ch=>(
                <button key={ch} onClick={()=>completePromo(ch)} style={{fontSize:28,padding:'4px 8px',borderRadius:8,border:`1px solid ${C.border}`,background:'var(--surface-high)',cursor:'pointer'}}>
                  {promo.cl==='w'?{Q:'♕',R:'♖',B:'♗',N:'♘'}[ch]:{Q:'♛',R:'♜',B:'♝',N:'♞'}[ch]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Captured by black */}
        <div style={{display:'flex',gap:2,flexWrap:'wrap',marginTop:6,minHeight:24,fontSize:16}}>
          {capW.map((p,i)=><span key={i}>{PIECES[p]}</span>)}
        </div>

        {/* Winner message */}
        {winner&&<div style={{fontSize:18,fontWeight:700,color:C.green,marginTop:10,textAlign:'center'}}>{winner} 🎉</div>}

        {/* Controls */}
        <div style={{display:'flex',gap:8,marginTop:12,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <span style={{fontSize:13,color:C.textSec}}>{status}</span>
          <button onClick={undo} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,cursor:'pointer'}}>Undo</button>
          <button onClick={newGame} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${C.accent}`,background:'var(--accent-soft)',color:C.accent,fontSize:13,cursor:'pointer',fontWeight:600}}>New game</button>
        </div>
      </div>
    </div>
  );
}
