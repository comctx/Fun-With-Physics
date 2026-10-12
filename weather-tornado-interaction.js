/* Fun With Physics — Tornado Weather Science
 * Volumetric mist vortex: soft density edges, internal cloud rotation,
 * rain curtains, wide debris cloud and ground-level wind. No solid silhouette.
 * An illustrative visualization, not a measured or predictive wind field.
 */
(function () {
"use strict";
const page=document.getElementById("weatherLabPage");
const science=document.getElementById("wpScienceView");
const visual=document.getElementById("wpScienceVisual");
const opener=page?.querySelector('[data-weather-topic="tornadoes"]');
if(!page||!science||!visual||!opener)return;
const prefersReduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
let canvas=null,ctx=null,raf=0,lastFrame=0,time=0,level=5,width=0,height=0;
// Brief, irregular distant cloud flashes. Scheduled once per event, not randomly per frame.
let nextLightningAt=0,flashStart=-100,flashX=.35,flashIsBolt=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*79.132+27.71)*14567.29;return v-Math.floor(v)};
const running=()=>!document.hidden&&!page.hidden&&!science.hidden&&visual.dataset.scene==="tornadoes"&&canvas?.isConnected;

/* New weather-science tornado renderer: a ragged low supercell,
   photolike slender condensation funnel and modest contact debris.
   No artificial ring lines, opaque wedge cone or gigantic dust halo.
   A visual explanation rather than a fluid-dynamics simulation. */
function mist(x,y,rx,ry,color,alpha){
 if(rx<1||ry<1||alpha<=0)return;
 ctx.save();
 ctx.translate(x,y);ctx.scale(1,ry/rx);
 const g=ctx.createRadialGradient(0,0,0,0,0,rx);
 g.addColorStop(0,"rgba("+color+","+Math.min(.9,alpha).toFixed(3)+")");
 g.addColorStop(.42,"rgba("+color+","+Math.min(.7,alpha*.55).toFixed(3)+")");
 g.addColorStop(1,"rgba("+color+",0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function severity(){return clamp((level-1)/9,0,1)}
function axis(cx,p){
 // Larger-scale motion near the cloud, calm ground contact.
 const upper=Math.pow(1-p,1.6);
 return cx+width*upper*(Math.sin(time*.22+.8)*.012+
       Math.sin(time*.43+p*5)*.004);
}
function radiusAt(p){
 const strength=severity();
 const upper=width*(.029+strength*.017)*Math.pow(1-p,.98);
 const foot=width*(.0045+strength*.0037)*p;
 const rough=1+Math.sin(time*.75+p*9)*.058+
    Math.sin(time*1.18-p*19)*.022;
 return (upper+foot)*rough;
}
function shelfHeight(x){
 const main=Math.exp(-Math.pow((x-.57)/.25,2));
 const left=Math.exp(-Math.pow((x-.16)/.20,2));
 return height*(.34+.162*main+.045*left+
     Math.sin(x*16+time*.14)*.012+
     Math.sin(x*47-time*.32)*.004);
}
function paintStorm(cx,top){
 const strength=severity();
 // Preserve some of the licensed prairie photograph at the edges.
 const atmosphere=ctx.createLinearGradient(0,0,0,height*.86);
 atmosphere.addColorStop(0,"rgba(13,23,30,.29)");
 atmosphere.addColorStop(.57,"rgba(16,27,31,.07)");
 atmosphere.addColorStop(.80,"rgba(172,189,187,.055)");
 atmosphere.addColorStop(1,"rgba(255,255,255,0)");
 ctx.fillStyle=atmosphere;ctx.fillRect(0,0,width,height);

 // A backlit bright clearing beneath the huge low storm base.
 mist(width*.78,height*.69,width*.46,height*.28,
      "196,206,200",.15);
 mist(width*.26,height*.69,width*.31,height*.23,
      "200,210,206",.075);

 // Dark shelf-cloud mass drawn as a single continuous boundary, not bands.
 const cloud=ctx.createLinearGradient(0,0,0,height*.61);
 cloud.addColorStop(0,"rgba(19,27,29,.86)");
 cloud.addColorStop(.58,"rgba(30,40,41,.83)");
 cloud.addColorStop(1,"rgba(49,57,55,.57)");
 ctx.fillStyle=cloud;
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(width,0);
 const segments=64;
 for(let i=segments;i>=0;i--){
  const fraction=i/segments;
  ctx.lineTo(width*fraction,shelfHeight(fraction)/height*height);
 }
 ctx.closePath();ctx.fill();

 // Uneven patches sculpt cloud texture; their contrast is subtle.
 for(let i=0;i<57;i++){
  const xx=noise(i*13+2)*width;
  const q=xx/width;
  const y=shelfHeight(q)/height*(.18+noise(i*17)*.75)*height;
  const w=width*(.032+noise(i*11+7)*.10);
  const h=height*(.05+noise(i*19+3)*.12);
  const tone=i%5===0?"126,132,126":i%3===0?"10,18,20":"60,69,67";
  const opacity=i%5===0?.035+.025*strength:.058+.048*strength;
  mist(xx+Math.sin(time*.08+i)*width*.002,y,w,h,tone,opacity);
 }

 // Ragged bottom of the storm, wisps evaporate into brighter horizon.
 for(let i=0;i<74;i++){
  const xx=noise(i*29+3)*width;
  const q=xx/width;
  const y=shelfHeight(q)+height*(noise(i*17+2)-.5)*.066;
  const tone=i%5===0?"145,149,140":i%3===0?"28,37,39":"55,62,61";
  mist(xx+Math.sin(time*.17+i*3)*width*.004,y,
       width*(.018+noise(i*7+1)*.052),
       height*(.023+noise(i*23+1)*.051),
       tone,.065+strength*.045);
 }

 // A low rotating wall cloud directly attached to the upper condensation.
 mist(cx,top-height*.012,width*.22,height*.18,
      "27,36,37",.30+strength*.16);
 for(let i=0;i<33;i++){
  const angle=i*2.399+time*(.08+.03*strength);
  const r=width*(.015+noise(i*7+5)*.15);
  const xx=cx+Math.cos(angle)*r;
  const yy=top+height*(Math.sin(angle)*.037+noise(i*11)*.02);
  const shadow=i%4===0?"125,132,127":i%3===0?"17,25,26":"56,67,65";
  mist(xx,yy,width*(.020+noise(i*13)*.050),
       height*(.020+noise(i*23)*.052),shadow,
       .055+strength*.075);
 }
}
function paintRain(){
 const strength=severity();
 // Fine distant rain is strongest underneath the shelf's left shoulder.
 ctx.save();ctx.lineCap="round";
 const streaks=52+Math.round(strength*44);
 for(let i=0;i<streaks;i++){
  const n=noise(i*7+12),xx=width*n;
  const yy=height*(.38+noise(i*19+4)*.42);
  const tail=height*(.035+noise(i*31+6)*.095);
  const drift=(time*(4+level*.65)*(i%3===0?-1:1))%width;
  const x=(xx+drift+width*2)%width;
  ctx.strokeStyle="rgba(184,201,200,"+(.012+noise(i*37)*.027)+")";
  ctx.lineWidth=.5+noise(i*15)*.65;
  ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+tail*.1,yy+tail);
  ctx.stroke();
 }
 ctx.restore();
 for(let i=0;i<11;i++){
  const x=width*(.12+i*.085);
  mist(x,height*.70,width*(.025+noise(i*5)*.034),
       height*.21,"96,109,110",.021+strength*.014);
 }
}
function traceFunnel(cx,top,ground,scale){
 const n=44;
 ctx.beginPath();
 for(let i=0;i<=n;i++){
  const p=i/n;
  const axisX=axis(cx,p);
  const w=radiusAt(p)*scale;
  const out=1+.055*Math.sin(13*p-time*.78)+
    .025*Math.sin(29*p+time*1.03);
  const x=axisX-w*out,y=top+(ground-top)*p;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 for(let i=n;i>=0;i--){
  const p=i/n;
  const axisX=axis(cx,p);
  const w=radiusAt(p)*scale;
  const out=1+.06*Math.sin(10*p+time*.64)+
    .025*Math.sin(33*p-time*1.05);
  ctx.lineTo(axisX+w*out,top+(ground-top)*p);
 }
 ctx.closePath();
}
function paintFunnel(cx,top,ground){
 const strength=severity();
 // Soft outline merges into the parent cloud; no stacked puffs or fake rings.
 ctx.save();ctx.filter="blur("+Math.max(4,Math.round(width*.006))+"px)";
 traceFunnel(cx,top,ground,1.36);
 ctx.fillStyle="rgba(45,53,53,"+(.24+strength*.12)+")";
 ctx.fill();
 ctx.restore();

 const tone=ctx.createLinearGradient(0,top,0,ground);
 tone.addColorStop(0,"rgba(43,49,47,.81)");
 tone.addColorStop(.25,"rgba(65,74,71,.67)");
 tone.addColorStop(.60,"rgba(94,100,95,.63)");
 tone.addColorStop(1,"rgba(69,73,67,.60)");
 traceFunnel(cx,top,ground,1);
 ctx.fillStyle=tone;ctx.fill();

 // Asymmetric rolling interior, with a shaded left side and partly lit right edge.
 const core=ctx.createLinearGradient(cx-width*.06,top,cx+width*.062,ground);
 core.addColorStop(0,"rgba(20,29,30,.34)");
 core.addColorStop(.55,"rgba(37,44,44,.14)");
 core.addColorStop(1,"rgba(167,175,168,.10)");
 ctx.fillStyle=core;
 traceFunnel(cx,top,ground,.75);
 ctx.fill();

 // Small, vertically elongated packets supply real rotation cues
 // without horizontal rings or bright drawn spiral lines.
 const count=61+Math.round(strength*27);
 for(let i=0;i<count;i++){
  const p=.03+noise(i*17+7)*.93;
  const phase=time*(.34+strength*.33)*(1+p*.35)+i*2.399;
  const front=Math.sin(phase),side=Math.cos(phase);
  const w=radiusAt(p);
  const x=axis(cx,p)+side*w*(.38+noise(i*9)*.66);
  const y=top+(ground-top)*p+
     Math.sin(time*.62+i)*height*.003;
  const color=front>0?(i%3===0?"184,190,178":"125,136,130"):
                   (i%3===0?"42,51,50":"57,67,64");
  const opa=(.025+strength*.045)*(front>0?1:.72);
  mist(x,y,w*(.15+noise(i*11)*.25),
       height*(.014+noise(i*21)*.032),color,opa);
 }

 // Long thin wisps emphasize descending, twisting condensation.
 ctx.save();ctx.lineCap="round";
 for(let i=0;i<30;i++){
  const p=.06+noise(i*37+4)*.74;
  const pEnd=Math.min(.98,p+.10+noise(i*23)*.12);
  const phase=time*(.36+strength*.32)+i*1.9;
  const side=Math.cos(phase)*(.36+noise(i*11)*.53);
  const x1=axis(cx,p)+radiusAt(p)*side;
  const x2=axis(cx,pEnd)+radiusAt(pEnd)*
      Math.cos(phase+(pEnd-p)*5)*(.35+noise(i*11)*.53);
  const y1=top+(ground-top)*p,y2=top+(ground-top)*pEnd;
  ctx.lineWidth=.5+noise(i*13)*1.4;
  ctx.strokeStyle="rgba("+(i%3===0?"181,186,176":"24,32,32")+","+
    (.022+strength*.032).toFixed(3)+")";
  ctx.beginPath();ctx.moveTo(x1,y1);
  ctx.bezierCurveTo(x1+radiusAt(p)*.2,y1+(y2-y1)*.33,
      x2-radiusAt(pEnd)*.2,y1+(y2-y1)*.67,x2,y2);
  ctx.stroke();
 }
 ctx.restore();

 // Cover the join with trailing wall-cloud scud, as in observed footage.
 for(let i=0;i<19;i++){
  const x=cx+(noise(i*29+4)-.5)*width*.22;
  const y=top-height*(.018+noise(i*9)*.050);
  mist(x+Math.sin(time*.13+i)*width*.004,y,
       width*(.027+noise(i*11)*.050),
       height*(.025+noise(i*19)*.060),
       i%4===0?"109,119,113":"36,45,43",
       .06+strength*.063);
 }
}
function paintDust(cx,ground){
 const strength=severity(), radius=radiusAt(1);
 const spread=width*(.039+strength*.040)+radius*1.55;
 const lift=height*(.025+strength*.036);
 // Keep road/fields visible: real dust plume, not an opaque gray smoke wall.
 for(let i=0;i<36+Math.round(strength*25);i++){
  const angle=i*2.399+time*(.28+strength*.30);
  const r=spread*Math.sqrt(noise(i*13+3));
  const x=cx+Math.cos(angle)*r+
       Math.sin(time*.28+i)*width*.002;
  const y=ground-Math.abs(Math.sin(angle))*lift*.35+
          (noise(i*19)-.5)*lift*.32;
  mist(x,y,width*(.009+noise(i*23)*.018),
       height*(.013+noise(i*29)*.028),
       i%4===0?"129,122,105":i%3===0?"65,66,62":"95,94,83",
       (.032+strength*.07)*(.7+noise(i*11)*.4));
 }
 mist(cx,ground-lift*.14,spread*.69,lift*.71,
      "71,72,65",.078+strength*.15);
 // Windblown very small debris dots follow the ground, near the funnel foot.
 ctx.save();
 for(let i=0;i<41+Math.round(strength*39);i++){
  const theta=i*2.399+time*(.45+strength*.48);
  const r=spread*(.12+noise(i*7)*1.02);
  const x=cx+Math.cos(theta)*r;
  const y=ground-lift*(.12+noise(i*17)*.70);
  const grey=85+Math.round(noise(i*31)*60);
  ctx.fillStyle="rgba("+grey+","+(grey-4)+","+(grey-13)+","+
     (.06+strength*.10).toFixed(3)+")";
  ctx.fillRect(x,y,.7+noise(i*13)*1.4,.7+noise(i*23)*1.3);
 }
 ctx.restore();
}
function paintGround(){
 // Distant fine gusts stay subtle over the photographic prairie.
 const strength=severity();
 ctx.save();ctx.strokeStyle="rgba(183,190,166,"+
         (.022+strength*.017).toFixed(3)+")";
 for(let i=0;i<30;i++){
  const x=(width*noise(i*17+7)+time*(1.5+strength*4)*7)%(width+50)-25;
  const y=height*(.89+noise(i*23)*.09);
  ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+12+strength*11,y-2);ctx.stroke();
 }
 ctx.restore();
}
function paintLightning(){
 if(prefersReduced?.matches)return;
 const age=time-flashStart;
 if(age<0||age>.46)return;
 const p=age<.09?Math.sin(age/.09*Math.PI*.5):
        Math.exp(-(age-.09)*10)*.6;
 ctx.save();ctx.globalCompositeOperation="screen";
 mist(width*flashX,height*.27,width*.24,height*.24,
      "194,215,227",p*.21);
 mist(width*(flashX+.06),height*.40,width*.13,height*.14,
      "208,224,229",p*.11);
 ctx.restore();
}
function draw(now){
 raf=0;if(!running())return;
 if(!prefersReduced?.matches&&now-lastFrame<(width<700?52:42)){
  raf=requestAnimationFrame(draw);return;
 }
 const elapsed=lastFrame?Math.min(.06,(now-lastFrame)/1000):.033;
 lastFrame=now;
 if(!prefersReduced?.matches)time+=elapsed;
 if(!prefersReduced?.matches&&time>=nextLightningAt){
  flashStart=time;
  flashX=.20+Math.random()*.65;
  nextLightningAt=time+8+Math.random()*10;
 }
 if(width<1||height<1)return;
 ctx.clearRect(0,0,width,height);
 const cx=width*.585+width*Math.sin(time*.12)*.002;
 const top=height*.52,ground=height*.895;
 paintStorm(cx,top);
 paintRain();
 paintFunnel(cx,top,ground);
 paintDust(cx,ground);
 paintGround();
 paintLightning();
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
 const dpr=Math.min(1.4,window.devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 requestDraw();
}
function update(){
 const slider=document.getElementById("wpTornadoStrength");
 if(!slider)return;
 level=clamp(Number(slider.value)||5,1,10);
 visual.style.setProperty("--wtAtmosphere",(.12+((level-1)/9)*.42).toFixed(3));
 const output=document.getElementById("wpTornadoStrengthOut");
 if(output)output.textContent=level+" / 10";
 const description=level<=3?"Mild rotation":level<=6?"Developing funnel":
                   level<=8?"Powerful circulation":"Intense vortex";
 const badge=visual.querySelector("#wtTornadoSceneBadge");
 if(badge)badge.textContent=description;
 const readout=document.getElementById("wtTornadoReadout");
 if(readout)readout.textContent=description+" • "+level+"/10";
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent="Watch condensation extend below a rotating wall cloud. Adjust intensity to change funnel size, motion and ground debris. Illustrative simulation.";
 requestDraw();
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;lastFrame=0;
}
function start(){
 const controls=document.getElementById("wpTornadoControl");
 const slider=document.getElementById("wpTornadoStrength");
 if(!controls||!slider)return;
 stop();
 // A new lesson visit starts with a calm interval before its first distant flash.
 nextLightningAt=time+5+Math.random()*5;
 flashStart=-100;
 canvas=visual.querySelector("#wtTornadoMotion");
 if(!canvas){
  canvas=document.createElement("canvas");
  canvas.id="wtTornadoMotion";
  canvas.setAttribute("aria-hidden","true");visual.appendChild(canvas);
 }
 ctx=canvas.getContext("2d");
 if(!ctx)return;
 // The redesigned renderer no longer needs the old precomputed texture.
 if(!visual.querySelector(".wtTornadoShade")){
  const shade=document.createElement("div");
  shade.className="wtTornadoShade";shade.setAttribute("aria-hidden","true");
  visual.appendChild(shade);
 }
 if(!visual.querySelector("#wtTornadoSceneBadge")){
  const badge=document.createElement("div");badge.id="wtTornadoSceneBadge";
  visual.appendChild(badge);
 }
 if(!document.getElementById("wtTornadoReadout")){
  const readout=document.createElement("div");readout.id="wtTornadoReadout";
  readout.setAttribute("role","status");controls.appendChild(readout);
 }
 if(!slider.dataset.wtConnected){
  slider.addEventListener("input",update);slider.addEventListener("change",update);
  slider.dataset.wtConnected="1";
 }
 resize();update();
}
opener.addEventListener("click",start);
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="tornadoes"])')
 .forEach(b=>b.addEventListener("click",stop));
document.getElementById("wpScienceBack")?.addEventListener("click",stop);
document.querySelectorAll("[data-weather-open]").forEach(b=>b.addEventListener("click",stop));
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else requestDraw()});
window.addEventListener("resize",resize);
prefersReduced?.addEventListener?.("change",()=>{stop();requestDraw()});
})();