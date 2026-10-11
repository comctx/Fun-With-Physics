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
 const severity=clamp((wind-1)/9,0,1);
 // Broad, slow "breathing" and smaller independent eddies along the funnel.
 // Keep these deformations continuous so the edge never jumps or pixelates.
 const breathing=1+
   Math.sin(time*.72+p*4.3)*.034+
   Math.sin(time*1.43-p*9.1)*.019;
 const localTurbulence=1+
   Math.sin(time*1.17+p*12.4)*(.024+severity*.023)+
   Math.sin(time*2.13-p*22.7)*(.011+severity*.012);
 return Math.max(width*.006,
   width*(.017+.119*taper)*(.70+wind*.043)*breathing*localTurbulence);
}
function funnelAxis(cx,p,phase){
 // Ground stays near the moving debris base; upper levels curve and twist.
 // Multiple nonmatching frequencies prevent mechanical side-to-side repetition.
 const upper=1-p*.76;
 const bend=upper*(Math.sin(phase*.32+p*4.6)*.007+
                   Math.sin(phase*.67-p*8.8)*.0038);
 const kink=(Math.sin(phase*1.22+p*15.3)*.0023+
             Math.sin(phase*.86-p*26.2)*.0014)*(1-p*.5);
 return cx+width*(bend+kink);
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
 // The supercell darkens around a powerful vortex, not equally over the sky.
 const severity=clamp((wind-1)/9,0,1);
 cloudPuff(cx,baseY+height*.14,width*.31,height*.30,
           "18,26,34",.025+severity*.13);
 // Slowly layered, textured wall cloud visually merges into the funnel top.
 const shade=ctx.createLinearGradient(0,0,0,height*.64);
 shade.addColorStop(0,"rgba(18,25,35,0)");
 shade.addColorStop(.53,"rgba(22,29,36,"+(.024+severity*.10)+")");
 shade.addColorStop(1,"rgba(19,27,35,0)");
 ctx.fillStyle=shade;ctx.fillRect(0,0,width,height*.66);
 for(let i=0;i<17;i++){
  const n=noise(i*13+1);
  const px=cx+(n-.5)*width*.46+Math.sin(time*.14+i)*width*.006;
  const y=baseY-height*(.025+noise(i*16)*.105);
  const rx=width*(.045+noise(i*21)*.074);
  const tone=i%4===0?"121,138,147":i%3===0?"60,75,86":"28,38,46";
  cloudPuff(px,y,rx,height*(.06+noise(i*7)*.066),
            tone,.050+severity*.055);
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
 const severity=clamp((wind-1)/9,0,1);
 // A strong tornado should read as a dense condensation column, not faint mist.
 // More overlapping feathered packets build opacity without a hard outline.
 const count=37+Math.round(severity*12);
 for(let i=0;i<count;i++){
  const p=(i+.45)/count;
  const radius=funnelRadius(p,wind);
  const x=funnelAxis(cx,p,time)+
          Math.sin(time*.82+p*8.2)*width*.0015;
  const y=top+length*p+
          Math.sin(time*1.15+i*.39)*height*.0011;
  const roll=Math.sin(p*16.2-time*.55);
  const density=.072+severity*.185+roll*.012;
  const softness=height*(.033+severity*.009);
  // Darker inner condensation at higher wind, with translucent, feathered edges.
  cloudPuff(x,y,radius*(1.02+severity*.10),softness,
            p>.72?"39,45,47":"24,34,42",density);
  // Asymmetric illumination and darker rear streaks preserve depth and rotation.
  cloudPuff(x-radius*.38,y-height*.008,radius*.69,softness*.90,
            "112,126,133",.028+severity*.058);
  cloudPuff(x+radius*.28,y+height*.004,radius*.70,softness*.95,
            "27,36,40",.046+severity*.14);
 }
 // Irregular density pockets rotate around the funnel rather than painting
 // a uniform dark cone; behind-the-funnel clouds are more transparent.
 const packets=82+Math.round(wind*3)+Math.round(severity*25);
 for(let i=0;i<packets;i++){
  const p=.015+noise(i*11+7)*.96;
  const y=top+length*p+
           Math.sin(time*(.85+noise(i*2)) + i*.41)*height*.0032;
  const radius=funnelRadius(p,wind);
  const basePhase=time*(.32+wind*.066)*(1+p*.6)+i*2.399;
  const phase=basePhase+
      Math.sin(time*.91+i*.67)*(.07+severity*.035);
  const depth=Math.sin(phase),radialPosition=.25+noise(i*19)*.83;
  // Orbiting cloudy eddies move asynchronously but remain within the vortex.
  const flutterX=Math.sin(time*1.85+i*.73+p*11)*radius*.055;
  const flutterY=Math.sin(time*1.49-i*.42+p*15)*height*.0019;
  const x=funnelAxis(cx,p,time)+
          Math.cos(phase)*radius*radialPosition+flutterX;
  const rx=radius*(.15+noise(i*17)*.35)+width*.001;
  const ry=height*(.005+noise(i*23)*.019)*
           (1+Math.sin(time*.84+i*.31)*.11);
  const tone=depth>.3?
     (i%3===0?"147,158,163":"92,105,111"):
     (i%4===0?"85,102,113":"26,37,44");
  const alpha=(.044+noise(i*13)*.085+severity*.068)*
             (depth>=0?1:.62)*(1-p*.14);
  cloudPuff(x,y+flutterY,rx,ry,tone,alpha);
 }
 // Partial, broken horizontal condensation streaks that wrap around
 // the rotating column. Never draw full circles or graphic guide-lines.
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 for(let j=0;j<40;j++){
  const p=.035+noise(j*31+3)*.90;
  const rr=funnelRadius(p,wind);
  const y=top+length*p;
  const phase=time*(.36+wind*.083)+j*1.618+
              Math.sin(time*.72+j*.38)*.08;
  const front=Math.sin(phase);
  const x=funnelAxis(cx,p,time)+Math.cos(phase)*rr*.64;
  const arc=rr*(.15+noise(j*17)*.38)*
            (1+Math.sin(time*1.11+j*.37)*.14);
  const color=front>.0?"162,180,181":"57,78,87";
  const a=(.021+noise(j*11)*.045+severity*.020)*(front>.0?1:.56);
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
 for(let i=0;i<33;i++){
  const p=noise(i*29+15)*.96;
  const r=funnelRadius(p,wind);
  const side=i%2?-1:1;
  const drift=.70+noise(i*7)*.54;
  const x=funnelAxis(cx,p,time)+side*r*drift+
      Math.sin(time*(.39+wind*.04)+i*2.5)*r*.17+
      Math.sin(time*1.48+i*.73)*r*.065;
  const y=top+length*p+
          Math.sin(time*1.07+i*.91)*height*.002;
  cloudPuff(x,y,r*(.17+noise(i*8)*.24),
    height*(.011+noise(i*13)*.007),
    i%3?"95,110,118":"164,169,167",.034+wind*.002);
 }
}
function dust(cx,ground,wind){
 // A chaotic, broad, turbulent debris cloud extends far past the funnel foot.
 const funnelFoot=funnelRadius(.98,wind);
 const severity=clamp((wind-1)/9,0,1);
 const turbulentPulse=1+Math.sin(time*.67)*.055+
                         Math.sin(time*1.26+1.9)*.027;
 const spread=Math.max(width*(.082+severity*.083),5.6*funnelFoot)*turbulentPulse;
 const depth=height*(.07+severity*.095)*
             (1+Math.sin(time*.92+1.4)*.047);
 // Wide rolling dust at ground level, in layered muted earth tones.
 for(let i=0;i<55+Math.round(severity*27);i++){
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
    (.068+severity*.115)*(.60+noise(i*11)*.67));
 }
 // Layered opaque-looking heart, with completely soft edges.
 cloudPuff(cx,ground-depth*.16,spread*.88,depth*.72,
           "52,57,55",.17+severity*.34);
 cloudPuff(cx-spread*.18,ground-depth*.30,spread*.66,depth*.68,
           "124,123,112",.068+severity*.13);
 cloudPuff(cx+spread*.30,ground-depth*.10,spread*.85,depth*.51,
           "79,77,68",.09+severity*.20);
 // Eddies and debris of many sizes; no concentric circles.
 const pieces=62+wind*15+Math.round(severity*35);
 for(let i=0;i<pieces;i++){
  const fraction=noise(i*37),alt=noise(i*13+29);
  const omega=time*(.26+wind*.092)*(.6+noise(i*3));
  const phase=omega+i*2.399;
  const r=spread*(.1+fraction*1.26);
  const x=cx+Math.cos(phase)*r;
  const y=ground-alt*depth*(.15+wind*.067)+Math.sin(phase)*depth*.25;
  const a=(.035+wind*.012+severity*.035)*(.45+(Math.sin(phase)+1)*.25);
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
 // The funnel, dust column, and inflow travel together; the landscape does not.
 const drift=width*(Math.sin(time*.25)*.009+
                    Math.sin(time*.57+1.2)*.0037+
                    Math.sin(time*1.12)*.0014);
 const cx=width*.585+drift,top=height*.355,ground=height*.892;
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
 visual.style.setProperty("--wtAtmosphere",(.07+((level-1)/9)*.34).toFixed(3));
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