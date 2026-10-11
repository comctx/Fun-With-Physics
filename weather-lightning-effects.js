/* WEATHER PHYSICS — lightning animation over the photograph.
   Simulated branching discharge and single bright sky pulse.
   No sound and no seizure-like rapid strobing. */
(function(){
"use strict";
const view=document.getElementById("wpScienceView");
const visual=document.getElementById("wpScienceVisual");
const page=document.getElementById("weatherLabPage");
const lightning=document.querySelector('[data-weather-topic="lightning"]');
if(!view||!visual||!page||!lightning)return;
const ns="http://www.w3.org/2000/svg";
const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let layer=null,button=null,timer=0,lastStrike=0;
function visible(){return !view.hidden&&!page.hidden&&visual.dataset.scene==="lightning"}
function nextStrike(){
 window.clearTimeout(timer);timer=0;
 if(!visible()||reduced)return;
 timer=window.setTimeout(()=>{if(visible())strike(false);nextStrike()},8200+Math.random()*4600);
}
function makePath(){
 const startX=710+Math.random()*115;
 let x=startX,y=-10;
 const points=[[x,y]],branches=[];
 const len=11+Math.floor(Math.random()*3);
 for(let i=0;i<len;i++){
  const oldX=x,oldY=y;
  y+=48+Math.random()*18;
  x+=-29+Math.random()*50;
  points.push([x,y]);
  if(i>=2&&i<=len-3&&i%2===0){
   let bx=x,by=y,dir=Math.random()<.5?-1:1,branch="M "+bx.toFixed(1)+" "+by.toFixed(1);
   for(let j=0;j<3+Math.floor(Math.random()*3);j++){
    bx+=dir*(17+Math.random()*40);by+=17+Math.random()*25;
    branch+=" L "+bx.toFixed(1)+" "+by.toFixed(1);
   }
   branches.push(branch);
  }
 }
 return {main:points.map((p,i)=>(i?"L ":"M ")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" "),branches};
}
function path(d,cls){
 const e=document.createElementNS(ns,"path");
 e.setAttribute("d",d);e.setAttribute("class",cls);
 e.setAttribute("fill","none");e.setAttribute("stroke-linejoin","round");e.setAttribute("stroke-linecap","round");
 return e;
}
function drawStrike(){
 const svg=layer.querySelector("svg");
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 const p=makePath();
 svg.appendChild(path(p.main,"wlfxBoltGlow"));
 svg.appendChild(path(p.main,"wlfxBoltBody"));
 svg.appendChild(path(p.main,"wlfxBoltCore"));
 for(const d of p.branches){
  svg.appendChild(path(d,"wlfxBranchGlow"));
  svg.appendChild(path(d,"wlfxBranchCore"));
 }
}
function strike(manual){
 if(!visible()||!layer)return;
 const now=performance.now();
 if(now-lastStrike<950)return;
 lastStrike=now;
 drawStrike();
 layer.classList.remove("wlfxActive");
 // Restart the animation, including subsequent user-triggered flashes.
 void layer.offsetWidth;
 layer.classList.add("wlfxActive");
 if(manual){
  const status=layer.querySelector(".wlfxCaption");
  if(status)status.textContent="Lightning strike! The bright channel briefly lights up the storm clouds.";
 }
}
function cleanup(){
 window.clearTimeout(timer);timer=0;
 if(layer){layer.remove();layer=null}
 if(button){button.remove();button=null}
}
function open(){
 cleanup();
 if(!visible())return;
 layer=document.createElement("div");layer.className="wlfxLayer";layer.setAttribute("aria-hidden","true");
 const flash=document.createElement("div");flash.className="wlfxSkyFlash";
 const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 1000 700");svg.setAttribute("preserveAspectRatio","none");svg.classList.add("wlfxSvg");
 const caption=document.createElement("span");caption.className="wlfxCaption";caption.textContent="Simulated lightning • flashes automatically";
 layer.append(flash,svg,caption);
 visual.appendChild(layer);
 button=document.createElement("button");button.type="button";button.className="wlfxTrigger";button.textContent="⚡ Flash Lightning";
 button.setAttribute("aria-label","Trigger a simulated lightning strike");
 button.addEventListener("click",()=>strike(true));
 visual.appendChild(button);
 if(reduced){
  caption.textContent="Automatic flashes off (reduced motion). Use Flash Lightning to trigger a strike.";
 }else{
  timer=window.setTimeout(()=>{if(visible())strike(false);nextStrike()},550);
 }
}
lightning.addEventListener("click",open);
// Opening from the new photographic gallery forwards its click to the topic button.
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="lightning"])').forEach(b=>b.addEventListener("click",cleanup));
document.getElementById("wpScienceBack")?.addEventListener("click",cleanup);
document.querySelectorAll("[data-weather-open]").forEach(b=>b.addEventListener("click",cleanup));
})();
