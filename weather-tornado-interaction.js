/* Fun With Physics — photographic tornado scene
 * Actual Kansas tornado photograph is in weather-cinematic.css.
 * Only atmospheric effects are drawn here; no synthetic funnel or wall cloud.
 * Image: Ks0stm / Wikimedia Commons, CC BY 4.0 (25 May 2016).
 */
(function(){
"use strict";
const page=document.getElementById("weatherLabPage");
const science=document.getElementById("wpScienceView");
const visual=document.getElementById("wpScienceVisual");
const opener=page?.querySelector('[data-weather-topic="tornadoes"]');
if(!page||!science||!visual||!opener)return;
const prefersReduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fract=x=>x-Math.floor(x);
const random=n=>fract(Math.sin(n*127.1+13.7)*43758.5453);
let canvas=null,ctx=null,raf=0,previous=0,time=0;
let width=0,height=0,level=5,nextFlash=7,flashAt=-100,flashX=.53;
const running=()=>!document.hidden&&!page.hidden&&!science.hidden&&
  visual.dataset.scene==="tornadoes"&&!!canvas?.isConnected;
const power=()=>clamp((level-1)/9,0,1);
function glow(x,y,rx,ry,tint,alpha){
 if(alpha<=.001||rx<2||ry<2)return;
 ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);
 const g=ctx.createRadialGradient(0,0,0,0,0,rx);
 g.addColorStop(0,"rgba("+tint+","+alpha.toFixed(3)+")");
 g.addColorStop(.55,"rgba("+tint+","+(alpha*.32).toFixed(3)+")");
 g.addColorStop(1,"rgba("+tint+",0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function rain(){
 const strength=power(),count=10+Math.round(strength*75);
 ctx.save();ctx.lineCap="round";
 for(let i=0;i<count;i++){
  const x0=random(i*7+3)*width;
  const y0=random(i*11+9)*height*.75;
  const v=9+level*4+random(i*31)*13;
  const x=(x0-time*v*.55%width+width)%width;
  const y=(y0+time*v*1.3)%(height*.8);
  const len=height*(.012+random(i*17)*.052);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.10,y+len);
  ctx.lineWidth=.55+random(i*19)*.6;
  ctx.strokeStyle="rgba(210,221,219,"+(.018+strength*.040*random(i*13)).toFixed(3)+")";
  ctx.stroke();
 }
 ctx.restore();
}
function surfaceWind(){
 const strength=power(),cx=width*.468,ground=height*.593;
 // The photograph already contains the funnel and contact cloud.
 // Animate only occasional fine gusts where the photographed tornado meets land.
 for(let i=0;i<9+Math.round(strength*19);i++){
  const phase=i*2.399+time*(.21+strength*.25);
  const distance=width*(.008+random(i*9)*(.026+strength*.050));
  const x=cx+Math.cos(phase)*distance;
  const y=ground-height*(.002+random(i*23)*(.016+strength*.025));
  glow(x,y,width*(.010+random(i*11)*.016),
       height*(.006+random(i*7)*.018),
       i%3===0?"170,163,149":"107,115,105",
       (.013+strength*.028)*(1+Math.sin(phase)*.15));
 }
 ctx.save();ctx.lineCap="round";
 const gusts=9+Math.round(strength*19);
 for(let i=0;i<gusts;i++){
  const x0=random(i*31)*width;
  const x=(x0+time*(8+strength*30)+width*2)%width;
  const y=height*(.60+random(i*17)*.14);
  ctx.beginPath();
  ctx.moveTo(x,y);ctx.lineTo(x+width*(.005+strength*.012),y-1);
  ctx.strokeStyle="rgba(178,181,167,"+(.020+strength*.028).toFixed(3)+")";
  ctx.lineWidth=.6;ctx.stroke();
 }
 ctx.restore();
}
function lightning(){
 if(prefersReduced?.matches)return;
 const age=time-flashAt;
 if(age<0||age>.70)return;
 const pulse=age<.075?Math.sin(age/.075*Math.PI*.5):
   age<.16?.35:Math.max(0,.35*(1-(age-.16)/.54));
 ctx.save();ctx.globalCompositeOperation="screen";
 glow(width*flashX,height*.23,width*.24,height*.23,
      "218,230,235",pulse*(.12+power()*.15));
 glow(width*(flashX-.11),height*.34,width*.12,height*.11,
      "216,223,222",pulse*(.06+power()*.08));
 ctx.restore();
}
function draw(now){
 raf=0;if(!running())return;
 if(!prefersReduced?.matches&&previous&&now-previous<38){
  raf=requestAnimationFrame(draw);return;
 }
 const delta=previous?Math.min(.07,(now-previous)/1000):.033;
 previous=now;if(!prefersReduced?.matches)time+=delta;
 if(!prefersReduced?.matches&&time>=nextFlash){
  flashAt=time;flashX=.34+Math.random()*.42;
  nextFlash=time+Math.max(5,14-5*power())+Math.random()*8;
 }
 if(width<=0||height<=0)return;
 ctx.clearRect(0,0,width,height);
 rain();surfaceWind();lightning();
 if(!prefersReduced?.matches)raf=requestAnimationFrame(draw);
}
function requestDraw(){
 if(!running())return;
 if(raf)cancelAnimationFrame(raf);
 raf=requestAnimationFrame(draw);
}
function resize(){
 if(!canvas?.isConnected||!ctx)return;
 const box=visual.getBoundingClientRect();
 width=box.width;height=box.height;
 if(width<1||height<1)return;
 const dpr=Math.min(1.5,window.devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);
 canvas.height=Math.round(height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 requestDraw();
}
function update(){
 const slider=document.getElementById("wpTornadoStrength");
 if(!slider)return;
 level=clamp(Number(slider.value)||5,1,10);
 visual.style.setProperty("--wtAtmosphere",(.09+.20*power()).toFixed(3));
 const label=level<=3?"Light wind effects":level<=7?"Rain and gusts":"Intense storm effects";
 const output=document.getElementById("wpTornadoStrengthOut");
 if(output)output.textContent=level+" / 10";
 const badge=visual.querySelector("#wtTornadoSceneBadge");
 if(badge)badge.textContent=label;
 const readout=document.getElementById("wtTornadoReadout");
 if(readout)readout.textContent=label+" • "+level+"/10";
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent=
  "Real Kansas tornado photograph with simulated wind, rain and distant lightning. The photographed funnel stays unchanged.";
 requestDraw();
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;previous=0;
}
function start(){
 const controls=document.getElementById("wpTornadoControl");
 const slider=document.getElementById("wpTornadoStrength");
 if(!controls||!slider)return;
 stop();
 nextFlash=time+5+Math.random()*5;
 flashAt=-100;
 canvas=visual.querySelector("#wtTornadoMotion");
 if(!canvas){
  canvas=document.createElement("canvas");
  canvas.id="wtTornadoMotion";
  canvas.setAttribute("aria-hidden","true");
  visual.appendChild(canvas);
 }
 ctx=canvas.getContext("2d");
 if(!ctx)return;
 if(!visual.querySelector(".wtTornadoShade")){
  const shade=document.createElement("div");
  shade.className="wtTornadoShade";
  shade.setAttribute("aria-hidden","true");
  visual.appendChild(shade);
 }
 if(!visual.querySelector("#wtTornadoSceneBadge")){
  const badge=document.createElement("div");
  badge.id="wtTornadoSceneBadge";
  visual.appendChild(badge);
 }
 if(!document.getElementById("wtTornadoReadout")){
  const readout=document.createElement("div");
  readout.id="wtTornadoReadout";
  readout.setAttribute("role","status");
  controls.appendChild(readout);
 }
 if(!slider.dataset.wtConnected){
  slider.addEventListener("input",update);
  slider.addEventListener("change",update);
  slider.dataset.wtConnected="1";
 }
 resize();update();
}
opener.addEventListener("click",start);
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="tornadoes"])')
 .forEach(b=>b.addEventListener("click",stop));
document.getElementById("wpScienceBack")?.addEventListener("click",stop);
document.querySelectorAll("[data-weather-open]").forEach(b=>b.addEventListener("click",stop));
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)stop();else requestDraw();
});
window.addEventListener("resize",resize);
prefersReduced?.addEventListener?.("change",()=>{stop();requestDraw()});
})();