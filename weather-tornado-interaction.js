/* Interactive Tornado visual: motion is a teaching overlay on real tornado photography. */
(function(){
"use strict";
const page=document.getElementById("weatherLabPage");
const visual=document.getElementById("wpScienceVisual");
const science=document.getElementById("wpScienceView");
const opener=page?.querySelector('[data-weather-topic="tornadoes"]');
if(!visual||!science||!opener)return;
let canvas,ctx,windLevel=5,clock=0,frameId=0,lastTime=0;
const random=i=>{const x=Math.sin(i*79.132+27.71)*14567.29;return x-Math.floor(x)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function ensureCanvas(){
 canvas=visual.querySelector("#wtTornadoMotion");
 if(!canvas){
  canvas=document.createElement("canvas");canvas.id="wtTornadoMotion";
  canvas.setAttribute("aria-hidden","true");
  visual.appendChild(canvas);
 }
 ctx=canvas.getContext("2d");
 resize();
}
function resize(){
 if(!canvas||!canvas.isConnected)return;
 const rect=visual.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.max(1,Math.round(rect.width*dpr));
 canvas.height=Math.max(1,Math.round(rect.height*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function update(){
 const slider=document.getElementById("wpTornadoStrength");
 if(!slider)return;
 windLevel=clamp(Number(slider.value)||1,1,10);
 const label=document.getElementById("wtTornadoReadout");
 const state=windLevel<=3?"Light rotating winds":windLevel<=6?"Moderate vortex winds":windLevel<=8?"Strong vortex winds":"Extreme vortex winds";
 if(label)label.textContent=state+" — "+windLevel+"/10";
 const pill=document.getElementById("wtTornadoSceneBadge");
 if(pill)pill.textContent=windLevel<=3?"Light circulation":windLevel<=6?"Rotating updraft":windLevel<=8?"Strong circulation":"Intense vortex";
 const shade=visual.querySelector(".wtTornadoShade");
 if(shade)shade.style.opacity=String(.035+windLevel*.032);
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent=windLevel<=3?
 "Mild shear: small air motions, light dust near the funnel.":
 windLevel<=6?"Increasing shear produces faster swirls and more dust near the funnel.":
 "Intense rotating flow: faster wind streaks and heavier dust. Illustrative simulation only.";
}
function draw(ms){
 frameId=requestAnimationFrame(draw);
 if(science.hidden||visual.dataset.scene!=="tornadoes"||!canvas?.isConnected||!ctx)return;
 const elapsed=Math.min(.08,Math.max(0,(ms-lastTime)/1000||.016));
 lastTime=ms;clock+=elapsed;
 const w=visual.clientWidth,h=visual.clientHeight;
 if(!w||!h)return;
 ctx.clearRect(0,0,w,h);
 const cx=w*.465,groundY=h*.58,level=windLevel;
 const speed=.6+level*.30,spread=27+level*12;
 // Translucent real-world-style airflow ribbons curl around the visible funnel.
 const ribbonCount=2+Math.round(level*.65);
 ctx.lineCap="round";
 for(let j=0;j<ribbonCount;j++){
  const elev=(j+1)/(ribbonCount+1);
  const y=groundY-elev*h*.42;
  const radius=(spread*.33+elev*spread*.65);
  const alpha=.035+level*.015;
  const phase=clock*speed+(j*.91);
  ctx.save();
  ctx.strokeStyle="rgba(229,239,246,"+alpha.toFixed(3)+")";
  ctx.lineWidth=.8+level*.14;
  ctx.shadowColor="#b8cdd5";ctx.shadowBlur=2+level*.4;
  ctx.beginPath();
  ctx.ellipse(cx+Math.sin(phase)*8,y,radius,Math.max(4,radius*.18),-.09,phase,phase+Math.PI*(.65+level*.055));
  ctx.stroke();
  ctx.restore();
 }
 // Fine debris and dirt at the ground surface whirl faster and spread wider.
 const count=12+level*22;
 for(let i=0;i<count;i++){
  const r=random(i+31),phase=clock*(.5+speed*(.6+random(i+91)))+i*2.399;
  const rad=12+r*spread*1.55;
  const depth=(Math.sin(phase)+1)*.5;
  const x=cx+Math.cos(phase)*rad;
  const y=groundY+Math.sin(phase)*rad*.2+(random(i+11)-.5)*24;
  const opacity=(.08+.44*level/10)*(.43+.57*depth);
  const warm=130+Math.round(r*43);
  ctx.fillStyle="rgba("+warm+","+(warm-16)+","+(warm-33)+","+opacity.toFixed(3)+")";
  ctx.beginPath();ctx.ellipse(x,y,1+level*.16+r*2,1+level*.04,phase,0,Math.PI*2);ctx.fill();
 }
 // More intense shear has more prominent animated horizontal inflow into the funnel.
 const n=8+level*6;
 ctx.lineWidth=.8+level*.12;
 for(let i=0;i<n;i++){
  const y=groundY*.55+random(i*13)*h*.46;
  const dir=i%2===0?1:-1;
  const drift=(clock*(18+level*11)*(random(i*3)+.55))%(w*.68);
  const baseX=dir>0?drift:w-drift;
  const reach=Math.min(45,10+level*3.5);
  const near=1-Math.min(1,Math.abs(baseX-cx)/(w*.6));
  const opacity=(.035+.014*level)*(.45+near*.55);
  ctx.strokeStyle="rgba(226,239,249,"+opacity.toFixed(3)+")";
  ctx.beginPath();ctx.moveTo(baseX,y);
  ctx.quadraticCurveTo(baseX+dir*reach*.5,y-3-level*.25,baseX+dir*reach,y-1-level*.4);
  ctx.stroke();
 }
 // The foreground dust veil increases with simulated intensity, not an image change.
 const haze=ctx.createRadialGradient(cx,groundY,6,cx,groundY,spread*1.5);
 haze.addColorStop(0,"rgba(164,152,128,"+(level*.015)+")");
 haze.addColorStop(1,"rgba(164,152,128,0)");
 ctx.fillStyle=haze;ctx.fillRect(cx-spread*1.5,groundY-spread*.8,spread*3,spread*1.6);
}
function start(){
 const slider=document.getElementById("wpTornadoStrength");
 if(!slider)return;
 const controls=document.getElementById("wpTornadoControl");
 if(!controls)return;
 ensureCanvas();
 if(!visual.querySelector(".wtTornadoShade")){
  const shade=document.createElement("div");shade.className="wtTornadoShade";shade.setAttribute("aria-hidden","true");visual.appendChild(shade);
 }
 if(!visual.querySelector("#wtTornadoSceneBadge")){
  const badge=document.createElement("div");badge.id="wtTornadoSceneBadge";visual.appendChild(badge);
 }
 if(!document.getElementById("wtTornadoReadout")){
  const readout=document.createElement("div");readout.id="wtTornadoReadout";readout.setAttribute("role","status");controls.appendChild(readout);
 }
 if(!slider.dataset.wtConnected){
  slider.addEventListener("input",update);
  slider.addEventListener("change",update);
  slider.dataset.wtConnected="1";
 }
 update();
 lastTime=0;
 if(!frameId)frameId=requestAnimationFrame(draw);
}
// Original page renderer replaces the scene on every visit; attach afterward.
opener.addEventListener("click",start);
window.addEventListener("resize",resize);
})();
