/* Fun With Physics — Tornado Weather Science
 * Photographic vortex enhancement: turbulent condensation, rotating dust,
 * rain curtains, debris and ground-level wind. No artificial spiral guides.
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
function beginFunnel(cx,top,bottom,phase,expand){
 const parts=26;
 const left=[],right=[];
 for(let i=0;i<=parts;i++){
  const p=i/parts,y=top+(bottom-top)*p;
  const radius=(width*(.112*Math.pow(1-p,1.20)+.015))*expand;
  const wobble=Math.sin(phase*.62+p*7)*width*.0035+
               Math.sin(p*14-phase*.85)*width*.0018;
  const jag=Math.sin(i*2.81+phase*.9)*radius*.10+
             Math.sin(i*5.22-phase*1.2)*radius*.06;
  left.push([cx+wobble-radius-jag,y]);
  right.push([cx+wobble+radius+jag*.7,y]);
 }
 ctx.beginPath();ctx.moveTo(...left[0]);
 for(let i=1;i<left.length;i++)ctx.lineTo(...left[i]);
 for(let i=right.length-1;i>=0;i--)ctx.lineTo(...right[i]);
 ctx.closePath();
}
function paintRain(t,wind){
 const n=36+Math.round(wind*5);
 for(let i=0;i<n;i++){
  const side=noise(i*8+4);
  // Rain curtains mostly behind the condensation funnel.
  const x=(side*width+time*(7+wind*.7)*(i%2?1:-1)+width*3)%width;
  const y=noise(i*11+3)*height*.74;
  const length=height*(.07+noise(i*15)*.18);
  const a=.025+noise(i*21)*.043;
  ctx.strokeStyle="rgba(197,211,219,"+a+")";
  ctx.lineWidth=.6+noise(i*4)*1.5;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+length*.13,y+length);
  ctx.stroke();
 }
 // Broad semitransparent rain shafts, not vertical white lines.
 for(let i=0;i<6;i++){
  const x=width*(.13+i*.145)+Math.sin(time*.19+i)*width*.014;
  radial(x,height*.40,width*.085,height*.42,"84,101,115",.08+wind*.006);
 }
}
function paintCloudDeck(cx,y,wind){
 const shade=ctx.createLinearGradient(0,0,0,height*.76);
 shade.addColorStop(0,"rgba(15,23,35,.06)");
 shade.addColorStop(.62,"rgba(18,25,31,"+(.045+wind*.010)+")");
 shade.addColorStop(1,"rgba(16,25,30,0)");
 ctx.fillStyle=shade;ctx.fillRect(0,0,width,height*.77);
 for(let i=0;i<13;i++){
  const dx=(noise(i*13)-.5)*width*.40;
  const px=cx+dx+Math.sin(time*.15+i)*width*.006;
  const py=y-height*(.015+noise(i*16)*.08);
  radial(px,py,width*(.042+noise(i*21)*.065),height*.09,
         i%3===0?"91,107,116":"19,29,39",.09+wind*.008);
 }
}
function paintFunnel(cx,top,bottom,wind){
 const expand=.73+wind*.042;
 beginFunnel(cx,top,bottom,time,expand);
 ctx.save();ctx.filter="blur(11px)";
 ctx.fillStyle="rgba(19,28,36,"+(.13+wind*.012)+")";ctx.fill();
 ctx.restore();
 beginFunnel(cx,top,bottom,time,expand);
 ctx.save();ctx.clip();
 const fill=ctx.createLinearGradient(cx-width*.12,top,cx+width*.08,bottom);
 fill.addColorStop(0,"rgba(31,39,48,.23)");
 fill.addColorStop(.32,"rgba(30,37,42,"+(.18+wind*.018)+")");
 fill.addColorStop(.57,"rgba(19,26,30,"+(.20+wind*.021)+")");
 fill.addColorStop(.84,"rgba(46,47,46,.29)");
 fill.addColorStop(1,"rgba(70,65,56,.23)");
 ctx.fillStyle=fill;ctx.fillRect(cx-width*.19,top,width*.38,bottom-top);
 ctx.globalAlpha=.22;
 ctx.fillStyle=ctx.createPattern(texture,"repeat");
 ctx.translate(Math.sin(time*.4)*11,time*16%96);
 ctx.fillRect(cx-width*.2-15,top-96,width*.4+30,bottom-top+110);
 ctx.restore();

 // Condensation wisps orbit different altitudes at different speeds.
 // They are irregular blurred cloud packets, never outlined ellipses.
 const count=23+Math.round(wind*2.5);
 for(let i=0;i<count;i++){
  const p=.05+noise(i*23+6)*.91;
  const y=top+(bottom-top)*p;
  const rad=width*(.106*Math.pow(1-p,1.22)+.019)*expand;
  const theta=time*(.32+wind*.105)*(1+p*.8)+i*2.399+noise(i*8);
  const depth=Math.sin(theta);
  const xpos=cx+Math.cos(theta)*rad*.94+Math.sin(time*.41+p*8)*width*.004;
  const r=width*(.009+noise(i*5)*.019)*(1-p*.5);
  const alpha=(.028+noise(i*7)*.07)*(depth>.05?1.14:.53);
  radial(xpos,y,r,r*(.54+noise(i*15)*.5),
         depth>.2?"168,179,182":"39,51,57",alpha+wind*.002);
 }
 // Sparse, short turbulent patches at the edge; not guide-lines.
 for(let i=0;i<12;i++){
  const p=.05+noise(i*13)*.87;
  const y=top+(bottom-top)*p;
  const r=width*(.105*Math.pow(1-p,1.2)+.018)*expand;
  const side=i%2?-1:1;
  radial(cx+side*r*(.68+Math.sin(time+i)*.12),y,
         width*.011,height*.027,"119,131,132",.025+wind*.002);
 }
}
function dust(cx,ground,wind){
 const base=width*(.045+wind*.006),lift=height*(.055+wind*.004);
 // Uneven billowing dust along ground rather than an obvious circular ring.
 for(let i=0;i<32;i++){
  const angle=noise(i*7)*Math.PI*2+time*(.20+wind*.055);
  const depth=(Math.sin(angle)+1)*.5;
  const orbit=(.22+noise(i*17)*1.1)*base;
  const px=cx+Math.cos(angle)*orbit+Math.sin(time*.4+i)*3;
  const py=ground-Math.abs(Math.sin(angle))*(lift*.55)
          +(noise(i*19)-.5)*lift*.38;
  const rad=width*(.011+noise(i*13)*.024);
  const a=(.055+wind*.010)*(.35+depth*.65);
  radial(px,py,rad,rad*.64,
     i%4===0?"154,148,135":"86,83,75",a);
 }
 radial(cx,ground-width*.003,base*1.4,lift*.65,"100,94,81",.12+wind*.022);
 radial(cx,ground+lift*.14,base*1.25,lift*.48,"42,48,46",.11+wind*.013);

 // Bits of dirt and plant material circulate at varied depths.
 const count=25+wind*9;
 for(let i=0;i<count;i++){
  const r=noise(i*37),alt=noise(i*13+29);
  const spin=time*(.55+wind*.16)*( .7+noise(i*3))+i*2.399;
  const orbit=base*(.13+r*1.65);
  const depth=(Math.sin(spin)+1)*.5;
  const x=cx+Math.cos(spin)*orbit+Math.sin(time+i)*2.2;
  const y=ground-alt*lift*(.3+wind*.11)+Math.sin(spin)*lift*.16;
  const opacity=(.06+wind*.032)*(.35+depth*.65);
  ctx.strokeStyle="rgba("+(82+Math.round(alt*72))+","+
    (75+Math.round(alt*67))+","+(61+Math.round(alt*56))+","+opacity+")";
  ctx.lineWidth=.5+depth*1.3;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(spin+1.3)*(1.5+r*4),
    y+Math.sin(spin+1.3)*(1.5+r*4));ctx.stroke();
 }
}
function environment(wind){
 const base=height*.79;
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
 if(!prefersReduced?.matches&&now-lastFrame<33){
  raf=requestAnimationFrame(draw);return;
 }
 const elapsed=lastFrame?Math.min(.06,(now-lastFrame)/1000):.033;
 lastFrame=now;time+=prefersReduced?.matches?0:elapsed;
 if(!width||!height)return;
 ctx.clearRect(0,0,width,height);
 const cx=width*.428,top=height*.36,ground=height*.77;
 paintRain(time,level);
 paintCloudDeck(cx,top,level);
 paintFunnel(cx,top,ground,level);
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
 const dpr=Math.min(1.7,devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 requestDraw();
}
function update(){
 const slider=document.getElementById("wpTornadoStrength");
 if(!slider)return;
 level=clamp(Number(slider.value)||5,1,10);
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