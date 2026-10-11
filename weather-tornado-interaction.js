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
let canvas=null,ctx=null,raf=0,lastFrame=0,time=0,level=5,width=0,height=0,texture=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*79.132+27.71)*14567.29;return v-Math.floor(v)};
const running=()=>!document.hidden&&!page.hidden&&!science.hidden&&visual.dataset.scene==="tornadoes"&&canvas?.isConnected;

function noisePattern(){
 const c=document.createElement("canvas");c.width=96;c.height=96;
 const x=c.getContext("2d"),img=x.createImageData(96,96);
 for(let i=0;i<img.data.length;i+=4){
  const n=45+Math.floor(Math.random()*75);
  img.data[i]=n;img.data[i+1]=n+4;img.data[i+2]=n+9;
  img.data[i+3]=Math.floor(Math.random()*58);
 }
 x.putImageData(img,0,0);
 return c;
}
function radial(x,y,rx,ry,color,alpha){
 if(rx<1||ry<1)return;
 ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);
 const gr=ctx.createRadialGradient(0,0,0,0,0,rx);
 gr.addColorStop(0,"rgba("+color+","+(alpha*.88)+")");
 gr.addColorStop(.38,"rgba("+color+","+(alpha*.48)+")");
 gr.addColorStop(1,"rgba("+color+",0)");
 ctx.fillStyle=gr;ctx.fillRect(-rx,-rx,2*rx,2*rx);ctx.restore();
}
/* Smooth evolving radius; density is made from mist, never a clipped polygon. */
function funnelRadius(p,wind){
 const taper=Math.pow(Math.max(0,1-p),1.28);
 return width*(.017+.119*taper)*(.70+wind*.043);
}
function funnelAxis(cx,p,phase){
 return cx+width*(Math.sin(p*5.6+phase*.33)*.0045+
                     Math.sin(p*12.2-phase*.24)*.0025);
}
function cloudPuff(x,y,rx,ry,color,alpha){
 radial(x,y,rx,ry,color,clamp(alpha,0,.85));
}
function paintRain(t,wind){
 // Rain behind the circulation: translucent shafts and soft perspective haze.
 const density=20+Math.round(wind*3.4);
 ctx.save();
 for(let i=0;i<density;i++){
  const k=noise(i*7+1);
  const x=(k*width+t*(4.4+wind*1.3)*(i%3?1:-1)+width*4)%width;
  const y=noise(i*19+3)*height*.63;
  const len=height*(.04+noise(i*9)*.19);
  ctx.strokeStyle="rgba(172,193,202,"+(.012+noise(i*5)*.029)+")";
  ctx.lineWidth=.6+noise(i*15);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len*.08,y+len);ctx.stroke();
 }
 ctx.restore();
 for(let i=0;i<8;i++){
  const x=width*(.075+i*.13)+Math.sin(time*.10+i)*width*.011;
  cloudPuff(x,height*.49,width*(.035+noise(i*12)*.038),
    height*.34,"98,117,124",.028+wind*.004);
 }
}
function rainForeground(cx,wind){
 // Some rain passes in front of the funnel and breaks its visible outline.
 for(let i=0;i<17;i++){
  const x=cx+width*(noise(i*19+4)-.5)*.36+
    Math.sin(time*.33+i*4)*width*.009;
  const y=height*(.30+noise(i*16)*.29);
  cloudPuff(x,y,width*(.015+noise(i*13)*.020),
     height*(.12+noise(i*7)*.14),
     i%3?"141,158,161":"84,100,113",.029+wind*.0025);
 }
}
function paintCloudDeck(cx,baseY,wind){
 // Slowly layered, textured wall cloud visually merges into the funnel top.
 const shade=ctx.createLinearGradient(0,0,0,height*.64);
 shade.addColorStop(0,"rgba(18,25,35,0)");
 shade.addColorStop(.53,"rgba(22,29,36,"+(.012+wind*.003)+")");
 shade.addColorStop(1,"rgba(19,27,35,0)");
 ctx.fillStyle=shade;ctx.fillRect(0,0,width,height*.66);
 for(let i=0;i<17;i++){
  const n=noise(i*13+1);
  const px=cx+(n-.5)*width*.46+Math.sin(time*.14+i)*width*.006;
  const y=baseY-height*(.025+noise(i*16)*.105);
  const rx=width*(.045+noise(i*21)*.074);
  const tone=i%4===0?"121,138,147":i%3===0?"60,75,86":"28,38,46";
  cloudPuff(px,y,rx,height*(.06+noise(i*7)*.066),
            tone,.044+wind*.004);
 }
 // Wisps spill downward from cloud base, softening the attachment.
 for(let i=0;i<24;i++){
  const p=noise(i*17+3);
  const x=cx+(p-.5)*width*.23;
  const y=baseY+height*(noise(i*9)*.035);
  cloudPuff(x,y,width*(.023+noise(i*21)*.027),
           height*(.025+noise(i*14)*.038),
           i%3?"76,89,96":"142,153,155",.043+wind*.002);
 }
}
function paintFunnel(cx,top,bottom,wind){
 // The funnel has no polygon edge. Its silhouette is the overlap of many
 // semi-transparent, feathered condensation packets at different depths.
 const length=bottom-top;
 const count=37;
 for(let i=0;i<count;i++){
  const p=(i+.45)/count;
  const radius=funnelRadius(p,wind);
  const x=funnelAxis(cx,p,time);
  const y=top+length*p;
  const roll=Math.sin(p*16.2-time*.55);
  const density=.088+wind*.007+roll*.010;
  // Dark central air, with a lighter storm-facing side.
  cloudPuff(x,y,radius*1.02,height*.032,
            p>.7?"53,57,58":"30,43,50",density);
  cloudPuff(x-radius*.37,y-height*.008,radius*.66,height*.037,
            "126,140,145",.032+wind*.001);
  cloudPuff(x+radius*.28,y+height*.004,radius*.73,height*.034,
            "34,40,44",.048+wind*.002);
 }
 // Irregular density pockets rotate around the funnel rather than painting
 // a uniform dark cone; behind-the-funnel clouds are more transparent.
 const packets=82+Math.round(wind*3);
 for(let i=0;i<packets;i++){
  const p=.015+noise(i*11+7)*.96;
  const y=top+length*p+Math.sin(time*.35+i)*height*.003;
  const radius=funnelRadius(p,wind);
  const phase=time*(.32+wind*.066)*(1+p*.6)+i*2.399;
  const depth=Math.sin(phase),radialPosition=.25+noise(i*19)*.83;
  const x=funnelAxis(cx,p,time)+Math.cos(phase)*radius*radialPosition;
  const rx=radius*(.15+noise(i*17)*.35)+width*.001;
  const ry=height*(.005+noise(i*23)*.019);
  const tone=depth>.3?
     (i%3===0?"147,158,163":"92,105,111"):
     (i%4===0?"85,102,113":"26,37,44");
  const alpha=(.041+noise(i*13)*.089)*
             (depth>=0?1:.62)*(1-p*.14);
  cloudPuff(x,y,rx,ry,tone,alpha);
 }
 // Partial, broken horizontal condensation streaks that wrap around
 // the rotating column. Never draw full circles or graphic guide-lines.
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 for(let j=0;j<40;j++){
  const p=.035+noise(j*31+3)*.90;
  const rr=funnelRadius(p,wind);
  const y=top+length*p;
  const phase=time*(.36+wind*.083)+j*1.618;
  const front=Math.sin(phase);
  const x=funnelAxis(cx,p,time)+Math.cos(phase)*rr*.64;
  const arc=rr*(.15+noise(j*17)*.38);
  const color=front>.0?"162,180,181":"57,78,87";
  const a=(.023+noise(j*11)*.044)*(front>.0?1:.56);
  ctx.strokeStyle="rgba("+color+","+a+")";
  ctx.lineWidth=.55+noise(j*7)*1.4;
  ctx.beginPath();
  ctx.moveTo(x-arc*.65,y+rr*.05*Math.sin(phase));
  ctx.bezierCurveTo(x-arc*.2,y-rr*.045,
                    x+arc*.35,y-rr*.036+Math.sin(phase)*2,
                    x+arc*.72,y+rr*.047);
  ctx.stroke();
 }
 ctx.restore();
 // Very soft stray condensation across the edges creates an irregular,
 // continuously changing boundary, not hard corners or jagged pixels.
 for(let i=0;i<28;i++){
  const p=noise(i*29+15)*.96;
  const r=funnelRadius(p,wind);
  const side=i%2?-1:1;
  const drift=.75+noise(i*7)*.47;
  const x=funnelAxis(cx,p,time)+side*r*drift+
      Math.sin(time*(.39+wind*.04)+i*2.5)*r*.18;
  const y=top+length*p;
  cloudPuff(x,y,r*(.19+noise(i*8)*.21),height*.014,
   i%3?"95,110,118":"164,169,167",.033+wind*.002);
 }
}
function dust(cx,ground,wind){
 // A chaotic, broad, turbulent debris cloud extends far past the funnel foot.
 const funnelFoot=funnelRadius(.98,wind);
 const spread=Math.max(width*.095,5.6*funnelFoot)*(0.76+wind*.046);
 const depth=height*(.062+wind*.009);
 // Wide rolling dust at ground level, in layered muted earth tones.
 for(let i=0;i<55;i++){
  const angle=noise(i*17+5)*6.283+time*(.15+wind*.052);
  const dist=(.22+noise(i*41)*1.12)*spread;
  const side=Math.cos(angle);
  const x=cx+side*dist+Math.sin(time*.18+i)*width*.003;
  const y=ground-Math.abs(Math.sin(angle))*depth*.38+
     (noise(i*29)-.55)*depth*.42;
  const rx=width*(.010+noise(i*13)*.023)*(1+wind*.013);
  const ry=height*(.015+noise(i*23)*.039);
  cloudPuff(x,y,rx,ry,
    i%5===0?"169,163,147":i%3===0?"126,120,108":"73,73,70",
    (.06+wind*.009)*(.60+noise(i*11)*.67));
 }
 // Layered opaque-looking heart, with completely soft edges.
 cloudPuff(cx,ground-depth*.16,spread*.89,depth*.68,
           "69,70,67",.17+wind*.016);
 cloudPuff(cx-spread*.18,ground-depth*.3,spread*.59,depth*.67,
           "140,135,123",.068+wind*.006);
 cloudPuff(cx+spread*.3,ground-depth*.1,spread*.82,depth*.47,
           "94,91,83",.095+wind*.008);
 // Eddies and debris of many sizes; no concentric circles.
 const pieces=62+wind*15;
 for(let i=0;i<pieces;i++){
  const fraction=noise(i*37),alt=noise(i*13+29);
  const omega=time*(.26+wind*.092)*(.6+noise(i*3));
  const phase=omega+i*2.399;
  const r=spread*(.1+fraction*1.26);
  const x=cx+Math.cos(phase)*r;
  const y=ground-alt*depth*(.15+wind*.067)+Math.sin(phase)*depth*.25;
  const a=(.034+wind*.012)*(.45+(Math.sin(phase)+1)*.25);
  const v=80+Math.round(alt*88);
  ctx.strokeStyle="rgba("+v+","+(v-7)+","+(v-19)+","+a+")";
  ctx.lineWidth=.5+fraction*1.3;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+Math.cos(phase+1.2)*(1+fraction*5),
             y+Math.sin(phase+1.2)*(1+fraction*5));
  ctx.stroke();
 }
}
function environment(wind){
 const base=height*.89;
 // Traveling gusts at field level, and short grass-like strokes that sway.
 for(let i=0;i<60;i++){
  const x=noise(i*17+2)*width;
  const y=base+noise(i*37)*height*.195;
  const lean=Math.sin(time*(1.2+wind*.22)+i*1.4)*(.8+wind*.27);
  ctx.strokeStyle="rgba(176,191,158,"+(.018+wind*.005)+")";
  ctx.lineWidth=.65;
  ctx.beginPath();ctx.moveTo(x,y+5);ctx.quadraticCurveTo(x+lean*2.4,y-1,
    x+lean*4.4,y-(3+noise(i*23)*7));ctx.stroke();
 }
 for(let i=0;i<31;i++){
  const phase=noise(i*23)*Math.PI*2;
  const x=(noise(i*11)*width+time*(12+wind*5))%(width+60)-30;
  const y=base-height*.015+noise(i*37)*height*.22;
  ctx.strokeStyle="rgba(210,212,194,"+(.025+wind*.006)+")";
  ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.quadraticCurveTo(x+9+wind*1.2,y-2+Math.sin(time+phase)*2,
    x+22+wind*2,y-2);ctx.stroke();
 }
}
function draw(now){
 raf=0;
 if(!running())return;
 if(!prefersReduced?.matches&&now-lastFrame<(width<700?58:45)){
  raf=requestAnimationFrame(draw);return;
 }
 const elapsed=lastFrame?Math.min(.06,(now-lastFrame)/1000):.033;
 lastFrame=now;time+=prefersReduced?.matches?0:elapsed;
 if(!width||!height)return;
 ctx.clearRect(0,0,width,height);
 const cx=width*.585,top=height*.355,ground=height*.892;
 paintRain(time,level);
 paintCloudDeck(cx,top,level);
 paintFunnel(cx,top,ground,level);
 rainForeground(cx,level);
 dust(cx,ground,level);
 environment(level);
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
 const output=document.getElementById("wpTornadoStrengthOut");
 if(output)output.textContent=level+" / 10";
 const description=level<=3?"Mild rotation":level<=6?"Developing funnel":
                   level<=8?"Powerful circulation":"Intense vortex";
 const badge=visual.querySelector("#wtTornadoSceneBadge");
 if(badge)badge.textContent=description;
 const readout=document.getElementById("wtTornadoReadout");
 if(readout)readout.textContent=description+" • "+level+"/10";
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent="Condensation, turbulent air, rain and swirling ground debris respond to the wind setting. Illustrative simulation, not a forecast.";
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
 canvas=visual.querySelector("#wtTornadoMotion");
 if(!canvas){
  canvas=document.createElement("canvas");
  canvas.id="wtTornadoMotion";
  canvas.setAttribute("aria-hidden","true");visual.appendChild(canvas);
 }
 ctx=canvas.getContext("2d");
 if(!ctx)return;
 if(!texture)texture=noisePattern();
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