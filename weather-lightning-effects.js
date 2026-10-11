/* Fun With Physics — Lightning lesson
 * Animated branching lightning over real storm photography.
 * Automatic strikes every ~2–5 seconds, with occasional return-stroke pulses.
 * Reduced-motion users get manual-only flashes.
 */
(function(){
"use strict";
const view=document.getElementById("wpScienceView");
const visual=document.getElementById("wpScienceVisual");
const page=document.getElementById("weatherLabPage");
const topic=document.querySelector('[data-weather-topic="lightning"]');
if(!view||!visual||!page||!topic)return;
const NS="http://www.w3.org/2000/svg";
const reduced=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let layer=null,triggerButton=null,autoTimer=0,pulseTimers=[],lastStrike=-Infinity;
const rand=(a,b)=>a+Math.random()*(b-a);
const visible=()=>!view.hidden&&!page.hidden&&visual.dataset.scene==="lightning";
function clearTimers(){
 clearTimeout(autoTimer);autoTimer=0;
 pulseTimers.forEach(clearTimeout);pulseTimers=[];
}
function svgPath(d,cls){
 const e=document.createElementNS(NS,"path");
 e.setAttribute("d",d);e.setAttribute("class",cls);
 e.setAttribute("fill","none");e.setAttribute("stroke-linecap","round");e.setAttribute("stroke-linejoin","round");
 return e;
}
function toPath(points){
 return points.map(([x,y],i)=>(i?"L ":"M ")+x.toFixed(1)+" "+y.toFixed(1)).join(" ");
}
function buildBolt(type){
 const ground=type==="ground";
 let x=ground?rand(450,830):rand(75,250);
 let y=ground?-18:rand(80,195);
 const points=[[x,y]],branches=[];
 const steps=ground?17:15;
 for(let i=0;i<steps;i++){
  if(ground){x+=rand(-33,28);y+=rand(33,47)}
  else{x+=rand(42,62);y+=rand(-22,23)}
  const last=[x,y];points.push(last);
  if(i>1&&i<steps-2&&Math.random()<.6){
   const b=[[x,y]],side=Math.random()<.5?-1:1;
   let bx=x,by=y;
   const joints=2+Math.floor(rand(0,4));
   for(let n=0;n<joints;n++){
    bx+=ground?side*rand(17,45):rand(-22,30);
    by+=ground?rand(19,39):side*rand(15,35);
    b.push([bx,by]);
   }
   branches.push(toPath(b));
  }
 }
 return {main:toPath(points),branches};
}
function drawBolt(type){
 if(!layer)return;
 const svg=layer.querySelector("svg");
 svg.replaceChildren();
 const b=buildBolt(type);
 for(const cls of ["wlfxBoltGlow","wlfxBoltBody","wlfxBoltCore"]){
  svg.appendChild(svgPath(b.main,cls));
 }
 b.branches.forEach(path=>{
  svg.appendChild(svgPath(path,"wlfxBranchGlow"));
  svg.appendChild(svgPath(path,"wlfxBranchCore"));
 });
 // Illuminate the cloud near the current discharge.
 const flash=layer.querySelector(".wlfxSkyFlash");
 flash.style.background=type==="ground"?
  "radial-gradient(ellipse 70% 88% at 66% 37%, rgba(245,249,255,.96) 0%, rgba(184,206,250,.72) 38%, rgba(124,140,200,.26) 76%, transparent 100%)":
  "radial-gradient(ellipse 84% 55% at 50% 23%, rgba(242,250,255,.93) 0%, rgba(167,204,255,.65) 35%, rgba(121,136,195,.20) 77%, transparent 100%)";
}
function flashOnce(){
 if(!layer||!visible())return;
 layer.classList.remove("wlfxActive");
 void layer.offsetWidth;
 layer.classList.add("wlfxActive");
}
function schedule(){
 clearTimeout(autoTimer);
 if(reduced||!visible())return;
 autoTimer=setTimeout(()=>{if(visible())fire(false)},rand(2300,4700));
}
function fire(manual){
 if(!visible()||!layer)return;
 const now=performance.now();
 if(now-lastStrike<450)return;
 lastStrike=now;
 clearTimers();
 const type=Math.random()<.75?"ground":"cloud";
 drawBolt(type);
 // Multiple return strokes reuse the same channel rather than drawing a new zigzag.
 const pulses=reduced?1:(Math.random()<.30?3:Math.random()<.64?2:1);
 const delays=[0,145,315];
 for(let i=0;i<pulses;i++){
  const id=setTimeout(()=>{if(visible())flashOnce()},delays[i]);
  pulseTimers.push(id);
 }
 const caption=layer.querySelector(".wlfxCaption");
 if(caption){
  caption.textContent=manual?"Manual lightning strike • "+(type==="ground"?"cloud to ground":"within storm clouds"):
   type==="ground"?"Simulated cloud-to-ground lightning":"Simulated cloud-to-cloud lightning";
 }
 schedule();
}
function cleanup(){
 clearTimers();
 if(triggerButton){triggerButton.remove();triggerButton=null}
 if(layer){layer.remove();layer=null}
}
function open(){
 cleanup();
 if(!visible())return;
 layer=document.createElement("div");layer.className="wlfxLayer";layer.setAttribute("aria-hidden","true");
 const flash=document.createElement("div");flash.className="wlfxSkyFlash";
 const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 1000 700");
 svg.setAttribute("preserveAspectRatio","none");svg.classList.add("wlfxSvg");
 const caption=document.createElement("span");caption.className="wlfxCaption";
 caption.textContent=reduced?"Reduced motion: use Flash Lightning":"Simulated lightning • flashes automatically every few seconds";
 layer.append(flash,svg,caption);visual.appendChild(layer);
 triggerButton=document.createElement("button");triggerButton.type="button";
 triggerButton.className="wlfxTrigger";triggerButton.textContent="⚡ Flash Lightning";
 triggerButton.setAttribute("aria-label","Trigger a simulated lightning strike");
 triggerButton.addEventListener("click",()=>fire(true));visual.appendChild(triggerButton);
 if(!reduced)autoTimer=setTimeout(()=>fire(false),650);
}
topic.addEventListener("click",open);
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="lightning"])').forEach(b=>b.addEventListener("click",cleanup));
document.querySelectorAll("[data-weather-open]").forEach(b=>b.addEventListener("click",cleanup));
document.getElementById("wpScienceBack")?.addEventListener("click",cleanup);
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){clearTimers();if(layer)layer.classList.remove("wlfxActive")}
 else if(visible()&&!reduced)schedule();
});
})();
