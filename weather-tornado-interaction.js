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
// Brief, irregular distant cloud flashes. Scheduled once per event, not randomly per frame.
let nextLightningAt=0,flashStart=-100,flashX=.35,flashIsBolt=false;
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
 const severity=clamp((wind-1)/9,0,1);
 const taper=Math.pow(Math.max(0,1-p),1.28);
 // At 8-10, the condensation body broadens into a wedge instead of
 // ending as a narrow cone. Lower settings preserve the original tapered funnel.
 const intense=clamp((severity-.56)/.44,0,1);
 const wedge=intense*width*.054*Math.pow(p,2.15);
 const breathing=1+
   Math.sin(time*.84+p*4.6)*.044+
   Math.sin(time*1.55-p*9.4)*.025;
 const eddies=1+
   Math.sin(time*1.35+p*12.8)*(.029+severity*.031)+
   Math.sin(time*2.42-p*22.4)*(.015+severity*.018);
 return Math.max(width*.006,
   (width*(.017+.119*taper)*(.74+wind*.050)+wedge)*breathing*eddies);
}
function funnelAxis(cx,p,phase){
 // Upper funnel gently wanders under the cloud base; the ground contact stays anchored.
 const topWeight=Math.pow(Math.max(0,1-p),1.18);
 const upperSway=(Math.sin(phase*.22)*.016+
                  Math.sin(phase*.48+1.1)*.0062)*topWeight;
 const bend=(Math.sin(phase*.31+p*4.9)*.0086+
             Math.sin(phase*.66-p*8.3)*.0044)*topWeight;
 const eddy=(Math.sin(phase*1.12+p*15.2)*.0026+
             Math.sin(phase*.87-p*24.8)*.0016)*topWeight;
 return cx+width*(upperSway+bend+eddy);
}
function cloudPuff(x,y,rx,ry,color,alpha){
 radial(x,y,rx,ry,color,clamp(alpha,0,.85));
}
function paintRain(t,wind){
 // Rain behind the circulation: translucent shafts and soft perspective haze.
 const density=24+Math.round(wind*4.0);
 ctx.save();
 for(let i=0;i<density;i++){
  const k=noise(i*7+1);
  const x=(k*width+t*(4.4+wind*1.3)*(i%3?1:-1)+width*4)%width;
  const y=noise(i*19+3)*height*.63;
  const len=height*(.04+noise(i*9)*.19);
  ctx.strokeStyle="rgba(172,193,202,"+(.015+noise(i*5)*.035)+")";
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
 cloudPuff(cx,baseY+height*.12,width*.39,height*.36,
           "10,16,22",.095+severity*.26);
 // A lowered, irregular wall-cloud underside connects the funnel to its parent storm.
 for(let j=0;j<16;j++){
  const offset=(noise(j*13+2)-.5)*width*.48;
  const y=baseY+height*(.018+noise(j*17)*.042);
  const moving=Math.sin(time*.17+j*2.3)*width*.005;
  cloudPuff(cx+offset+moving,y,
            width*(.029+noise(j*19)*.042),
            height*(.027+noise(j*21)*.033),
            j%4===0?"115,122,126":"22,32,39",.035+severity*.042);
 }
 // Slowly layered, textured wall cloud visually merges into the funnel top.
 const shade=ctx.createLinearGradient(0,0,0,height*.64);
 shade.addColorStop(0,"rgba(18,25,35,0)");
 shade.addColorStop(.53,"rgba(14,20,28,"+(.065+severity*.20)+")");
 shade.addColorStop(1,"rgba(19,27,35,0)");
 ctx.fillStyle=shade;ctx.fillRect(0,0,width,height*.66);
 for(let i=0;i<20;i++){
  const n=noise(i*13+1);
  const px=cx+(n-.5)*width*.46+Math.sin(time*.14+i)*width*.006;
  const y=baseY-height*(.025+noise(i*16)*.105);
  const rx=width*(.045+noise(i*21)*.074);
  const tone=i%4===0?"121,138,147":i%3===0?"60,75,86":"28,38,46";
  cloudPuff(px,y,rx,height*(.06+noise(i*7)*.066),
            tone,.060+severity*.072);
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
 // Volumetric turbulent condensation: no solid cone and no visible stacked rings.
 const length=bottom-top, severity=clamp((wind-1)/9,0,1);
 const layers=52+Math.round(severity*18);
 for(let i=0;i<layers;i++){
  const p=(i+.4)/layers;
  const radius=funnelRadius(p,wind);
  const x=funnelAxis(cx,p,time)+
          Math.sin(time*.95+p*8.8)*width*.0024+
          Math.sin(time*1.8-p*6.2)*width*.0014;
  const y=top+length*p+
          Math.sin(time*1.25+i*.37)*height*.0017+
          Math.sin(time*2.15+p*11.5)*height*.0009;
  const density=.095+severity*.26+Math.sin(p*17-time*.65)*.018;
  const softness=height*(.040+severity*.015);
  cloudPuff(x,y,radius*(1.04+severity*.15),softness,
            p>.70?"27,32,34":"12,21,28",density);
  // Shadowed condensation core is darkest in the wedge, not across the whole sky.
  cloudPuff(x+radius*.04,y,radius*.52,softness*.82,
            "11,18,22",(.05+severity*.13)*(p>.25?1:.55));
  cloudPuff(x-radius*.40,y-height*.008,radius*.70,softness*.92,
            "104,118,126",.028+severity*.08);
  cloudPuff(x+radius*.26,y+height*.004,radius*.76,softness*.98,
            "18,26,31",.065+severity*.19);
 }
 // Irregular cloud pockets revolve with independent vertical and orbital motion.
 const packets=120+Math.round(severity*45);
 for(let i=0;i<packets;i++){
  const p=.015+noise(i*11+7)*.96;
  const radius=funnelRadius(p,wind);
  const basePhase=time*(.38+wind*.085)*(1+p*.6)+i*2.399;
  const phase=basePhase+Math.sin(time*1.08+i*.67)*(.10+severity*.06);
  const radialPosition=.18+noise(i*19)*.92;
  const depth=Math.sin(phase);
  const x=funnelAxis(cx,p,time)+
          Math.cos(phase)*radius*radialPosition+
          Math.sin(time*2.1+i*.73+p*11)*radius*.08;
  const y=top+length*p+
          Math.sin(time*(.95+noise(i*2))+i*.45)*height*.0042+
          Math.sin(time*1.62-i*.42+p*15)*height*.0025;
  const rx=radius*(.17+noise(i*17)*.42)+width*.001;
  const ry=height*(.006+noise(i*23)*.024)*
           (1+Math.sin(time*.95+i*.31)*.18);
  const tone=depth>.3 ?
    (i%3===0?"140,152,158":"82,96,104"):
    (i%4===0?"74,88,98":"18,28,35");
  const alpha=(.055+noise(i*13)*.10+severity*.10)*
              (depth>=0?1:.60)*(1-p*.12);
  cloudPuff(x,y,rx,ry,tone,alpha);
 }
 // Small wisps imply turbulent rotation without conspicuous spiral guide lines.
 // Rotate with the funnel, but break up both position and opacity.
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 for(let j=0;j<18;j++){
  const p=.05+noise(j*31+3)*.88;
  const rr=funnelRadius(p,wind);
  const y=top+length*p;
  const phase=time*(.43+wind*.10)+j*1.7+
              Math.sin(time*.78+j*.41)*.12;
  const front=Math.sin(phase);
  const x=funnelAxis(cx,p,time)+Math.cos(phase)*rr*.60;
  const arc=rr*(.12+noise(j*17)*.24)*
            (1+Math.sin(time*1.2+j*.37)*.16);
  const color=front>0?"155,172,178":"46,64,74";
  const a=(.010+noise(j*11)*.021+severity*.012)*(front>0?1:.48);
  ctx.strokeStyle="rgba("+color+","+a+")";
  ctx.lineWidth=.45+noise(j*7)*.8;
  ctx.beginPath();
  ctx.moveTo(x-arc*.6,y+rr*.04*Math.sin(phase));
  ctx.bezierCurveTo(x-arc*.15,y-rr*.04,
                    x+arc*.28,y-rr*.03+Math.sin(phase)*1.5,
                    x+arc*.62,y+rr*.04);
  ctx.stroke();
 }
 ctx.restore();
 // Fast rotating short condensation streamers: textured wisps rather than rings.
 // Their motion, curvature and visibility change independently at each height.
 if(severity>.36){
  ctx.save();ctx.lineCap="round";
  const streamers=11+Math.round(severity*20);
  for(let k=0;k<streamers;k++){
   const p=.13+noise(k*24+9)*.78;
   const radius=funnelRadius(p,wind);
   const theta=time*(.48+wind*.13)*(1+p*.43)+k*2.17;
   const front=Math.sin(theta),inside=.38+noise(k*13)*.53;
   const x=funnelAxis(cx,p,time)+Math.cos(theta)*radius*inside;
   const y=top+length*p+Math.sin(theta*.8)*height*.004;
   const span=radius*(.10+noise(k*31)*.28);
   ctx.strokeStyle="rgba("+(front>0?"171,182,185":"49,65,73")+","+
     ((.015+severity*.055)*(front>0?1:.42)).toFixed(3)+")";
   ctx.lineWidth=.5+severity*.75*noise(k*11);
   ctx.beginPath();
   ctx.moveTo(x-span,y+height*.004);
   ctx.bezierCurveTo(x-span*.5,y-height*.008,
    x+span*.4,y-height*.006,x+span,y+height*.004);
   ctx.stroke();
  }
  ctx.restore();
 }
 // Uneven, diffused wisps fray the funnel boundary.
 for(let i=0;i<42;i++){
  const p=noise(i*29+15)*.96;
  const r=funnelRadius(p,wind);
  const side=i%2?-1:1, drift=.65+noise(i*7)*.62;
  const x=funnelAxis(cx,p,time)+side*r*drift+
          Math.sin(time*(.44+wind*.05)+i*2.6)*r*.19+
          Math.sin(time*1.7+i*.75)*r*.08;
  const y=top+length*p+
          Math.sin(time*1.14+i*.88)*height*.0026;
  cloudPuff(x,y,r*(.16+noise(i*8)*.28),
            height*(.012+noise(i*13)*.010),
            i%3?"88,102,110":"154,160,158",.042+wind*.003);
 }
}
/* Lightning stays in the distant storm; a short cloud flash may reveal a faint bolt.
   It is deliberately subtle, without full-screen strobing or thunder audio. */
function paintLightning(wind){
 if(prefersReduced?.matches)return;
 const age=time-flashStart;
 if(age<0||age>.55)return;
 const pulse=(age<.065?.42+age/.065*.5:
              age<.125?.94-(age-.065)/.06*.76:
              age<.21?.08+(age-.125)/.085*.36:
              age<.28?.44-(age-.21)/.07*.35:
              .09*Math.max(0,1-(age-.28)/.27));
 if(pulse<=0)return;
 const strength=pulse*(.90+wind*.055);
 ctx.save();
 ctx.globalCompositeOperation="screen";
 // Illuminated upper cloud cells fade unevenly, not the entire sky.
 radial(width*flashX,height*.27,width*.18,height*.21,
        "215,232,250",Math.min(.34,strength*.24));
 radial(width*(flashX+.08),height*.39,width*.12,height*.15,
        "170,198,232",Math.min(.16,strength*.11));
 if(flashIsBolt){
  const x=width*flashX,y=height*.37;
  ctx.lineCap="round";
  ctx.strokeStyle="rgba(230,240,255,"+Math.min(.28,strength*.22)+")";
  ctx.lineWidth=Math.max(.65,width*.0008);
  ctx.beginPath();
  ctx.moveTo(x,y);ctx.lineTo(x-width*.008,y+height*.045);
  ctx.lineTo(x+width*.002,y+height*.080);
  ctx.lineTo(x-width*.011,y+height*.125);ctx.stroke();
 }
 ctx.restore();
}

function dust(cx,ground,wind){
 // A chaotic, broad, turbulent debris cloud extends far past the funnel foot.
 const funnelFoot=funnelRadius(.98,wind);
 const severity=clamp((wind-1)/9,0,1);
 const turbulentPulse=1+Math.sin(time*.72)*.048+
                         Math.sin(time*1.33+1.9)*.024;
 // A 30–45% wider dust field at maximum intensity, not at mild settings.
 const spread=Math.max(width*(.11+severity*.12),6.2*funnelFoot)*
              turbulentPulse*(1+severity*.38);
 const depth=height*(.09+severity*.12)*
             (1+Math.sin(time*.98+1.4)*.038)*(1+severity*.22);
 // Slight turbulence stays close to the anchored ground contact.
 cx+=Math.sin(time*.55)*width*.0011;
 // Wide rolling dust at ground level, in layered muted earth tones.
 for(let i=0;i<62+Math.round(severity*65);i++){
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
    (.079+severity*.20)*(.62+noise(i*11)*.70));
 }
 // Layered opaque-looking heart, with completely soft edges.
 cloudPuff(cx,ground-depth*.14,spread*.98,depth*.82,
           "31,34,33",.28+severity*.54);
 // Fragmented turbulent dust rising from the wedge's outer edges.
 for(let k=0;k<12+Math.round(severity*15);k++){
  const shift=(noise(k*17+4)-.5)*spread*2.3;
  const altitude=noise(k*7+3);
  cloudPuff(cx+shift+Math.sin(time*.42+k)*spread*.05,
    ground-depth*(.20+altitude*.70),
    spread*(.08+noise(k*21)*.11),
    depth*(.15+noise(k*19)*.18),
    k%3===0?"115,111,101":"61,61,57",.032+severity*.075);
 }
 cloudPuff(cx-spread*.18,ground-depth*.30,spread*.66,depth*.68,
           "124,123,112",.068+severity*.13);
 cloudPuff(cx+spread*.30,ground-depth*.10,spread*.85,depth*.51,
           "79,77,68",.09+severity*.20);
 // Eddies and debris of many sizes; no concentric circles.
 const pieces=70+wind*16+Math.round(severity*61);
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
 if(!prefersReduced?.matches&&time>=nextLightningAt){
  flashStart=time;
  flashX=.21+Math.random()*.61;
  flashIsBolt=Math.random()<.40;
  nextLightningAt=time+6+Math.random()*7;
 }
 if(!width||!height)return;
 ctx.clearRect(0,0,width,height);
 // The funnel, dust column, and inflow travel together; the landscape does not.
 // Keep the whole circulation nearly stationary; the upper funnel does the swaying.
 const drift=width*(Math.sin(time*.17)*.0025+
                    Math.sin(time*.40+1.1)*.0007);
 const cx=width*.585+drift,top=height*.392,ground=height*.892;
 paintRain(time,level);
 paintCloudDeck(cx,top,level);
 paintLightning(level);
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
 // A new lesson visit starts with a calm interval before its first distant flash.
 nextLightningAt=time+3+Math.random()*4;
 flashStart=-100;
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