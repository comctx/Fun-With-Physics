/* Atom Builder: cinematic animated nucleus and approximate electron cloud */
(function(){
"use strict";
const app=window.__funPhysicsAtom;if(!app)return;
const page=app.page,model=app.model,canvas=page.querySelector("#abCanvas"),ctx=canvas.getContext("2d");
const rand=n=>{const x=Math.sin(n*91.17+7.71)*24728.292;return x-Math.floor(x)};
let angle=0,last=0;
function paint(ts){
 requestAnimationFrame(paint);
 if(page.hidden)return;
 if(last&&ts-last<28)return;
 const delta=last?Math.min(.09,(ts-last)/1000):.03;last=ts;angle+=delta*.35;
 const box=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=box.width,h=box.height;
 if(w<1||h<1)return;
 const ww=Math.round(w*dpr),hh=Math.round(h*dpr);
 if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);
 const cx=w*.5,cy=h*.53,scale=Math.min(w,h),R=scale*.137,total=model.p+model.n;
 // Deep photographic-style ambient light and microscopic particles.
 let glow=ctx.createRadialGradient(cx,cy,4,cx,cy,scale*.44);
 glow.addColorStop(0,"#5979f118");glow.addColorStop(.5,"#8b6af016");glow.addColorStop(1,"#1e174000");
 ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(let i=0;i<135;i++){const x=rand(i*3)*w,y=rand(i*7+4)*h;ctx.fillStyle="rgba(179,220,255,"+(.08+rand(i*11)*.30)+")";ctx.fillRect(x,y,.4+rand(i)*1.2,.4+rand(i)*1.2)}
 if(model.e>0){
  const cloud=ctx.createRadialGradient(cx,cy,R*.65,cx,cy,scale*.44);
  cloud.addColorStop(0,"#273bce00");cloud.addColorStop(.23,"#7462e916");cloud.addColorStop(.64,"#8466f323");cloud.addColorStop(1,"#6b49df00");
  ctx.fillStyle=cloud;ctx.fillRect(0,0,w,h);
  const points=Math.min(950,105+model.e*19);
  for(let i=0;i<points;i++){
   const radius=(.20+.78*Math.sqrt(rand(i*19+5)))*scale*.43;
   const phase=rand(i*41)*Math.PI*2+angle*.13*(i%3?1:-1);
   const x=cx+Math.cos(phase)*radius,y=cy+Math.sin(phase)*radius*.70;
   const opa=.09+rand(i*17)*.40;
   ctx.fillStyle="rgba("+(155+Math.round(rand(i*4)*62))+",173,255,"+opa+")";
   ctx.beginPath();ctx.arc(x,y,.5+rand(i*29)*1.25,0,Math.PI*2);ctx.fill();
  }
 }
 // Dense nucleus: depth-sorted nucleons, lit by sphere gradients.
 const nuc=[];
 for(let i=0;i<total;i++){
  const dist=R*Math.cbrt((i+.55)/total);
  const phi=Math.acos(1-2*rand(i*17+23)),theta=i*2.399963+angle;
  const x=Math.sin(phi)*Math.cos(theta),y=Math.sin(phi)*Math.sin(theta),z=Math.cos(phi);
  nuc.push({x:cx+dist*x,y:cy+dist*y*.91,z,proton:i<model.p});
 }
 nuc.sort((a,b)=>a.z-b.z);
 const ball=Math.max(3,Math.min(17,R/(Math.cbrt(total)*1.10)));
 for(const q of nuc){
  const radius=ball*(.78+.14*(q.z+1));
  const grad=ctx.createRadialGradient(q.x-radius*.32,q.y-radius*.39,.2,q.x,q.y,radius);
  grad.addColorStop(0,"#fff");grad.addColorStop(.19,q.proton?"#ffccd6":"#bdefff");
  grad.addColorStop(.65,q.proton?"#e9527b":"#34b8e8");
  grad.addColorStop(1,q.proton?"#591344":"#0c4277");
  ctx.shadowColor=q.proton?"#fb5277":"#2ebff5";ctx.shadowBlur=Math.max(3,ball*.48);
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(q.x,q.y,radius,0,Math.PI*2);ctx.fill();
 }
 ctx.shadowBlur=0;
}
requestAnimationFrame(paint);
})();
