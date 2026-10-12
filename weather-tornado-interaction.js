/* Fun With Physics — real tornado video lesson
 * Footage: Sean Waugh / NOAA NSSL, St. Libory, Nebraska, 17 May 2026.
 * Wikimedia Commons lists the footage as U.S. public domain.
 * https://commons.wikimedia.org/wiki/File:Sean_Waugh_NOAA_NSSL_-_Saint_Libory_Nebraska_EF3_Tornado_17_05_2026.webm
 * The video depicts a real tornado. Only rainfall, wind gusts and cloud glow
 * are simulated; changing the slider does not alter the recorded tornado.
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
const noise=n=>{const x=Math.sin(n*127.1+13.7)*43758.5453;return x-Math.floor(x)};
const VIDEO_NAME="Sean_Waugh_NOAA_NSSL_-_Saint_Libory_Nebraska_EF3_Tornado_17_05_2026.webm";
const FILE_BASE="https://upload.wikimedia.org/wikipedia/commons/9/92/"+VIDEO_NAME;
const TRANSCODE="https://upload.wikimedia.org/wikipedia/commons/transcoded/9/92/"+VIDEO_NAME+"/"+VIDEO_NAME;
const FILE_PAGE="https://commons.wikimedia.org/wiki/File:"+VIDEO_NAME;
const HD_NAME="Tornado_time_lapse.webm";
const HD_BASE="https://upload.wikimedia.org/wikipedia/commons/f/fa/"+HD_NAME;
const HD_TRANSCODE="https://upload.wikimedia.org/wikipedia/commons/transcoded/f/fa/"+HD_NAME+"/"+HD_NAME;
const HD_PAGE="https://commons.wikimedia.org/wiki/File:Tornado_time_lapse.webm";
const CLIPS={
 hd:{page:HD_PAGE,label:"1080p time-lapse • Colorado 2018",
  credit:"HD: Runningonbrains • CC BY-SA 4.0",rate:.5},
 noaa:{page:FILE_PAGE,label:"720p NOAA footage • Nebraska 2026",
  credit:"NOAA/NSSL • public domain",rate:1}
};
let clip="hd",qualityToggle=null,creditLink=null;
const STILL="https://upload.wikimedia.org/wikipedia/commons/3/30/2016-05-16_Tornado_north_of_Solomon%2C_Kansas.jpg";
let canvas=null,ctx=null,video=null,toggle=null,status=null;
let raf=0,lastFrame=0,time=0,level=5,width=0,height=0,nextLightning=7,flashAt=-100,flashX=.45;
const strength=()=>clamp((level-1)/9,0,1);
const running=()=>!document.hidden&&!page.hidden&&!science.hidden&&
 visual.dataset.scene==="tornadoes"&&!!canvas?.isConnected;
function sourceNode(url,type){
 const el=document.createElement("source");
 el.src=url;el.type=type;return el;
}
function setVideoState(label){
 if(toggle){toggle.textContent=label;toggle.setAttribute("aria-label",label);}
}
function setStatus(message){
 if(status){status.textContent=message;status.hidden=!message;}
}
function describeClip(){
 const mode=CLIPS[clip];
 if(qualityToggle){
  qualityToggle.textContent=clip==="hd"?"Switch to NOAA 720p":"Switch to HD 1080p";
  qualityToggle.setAttribute("aria-label",qualityToggle.textContent);
 }
 if(creditLink){
  creditLink.href=mode.page;
  creditLink.textContent=mode.credit;
 }
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent=clip==="hd"?
  "Real Colorado tornado filmed in 1080p time-lapse. Motion is accelerated; storm effects are simulated.":
  "Real NOAA tornado footage from Nebraska in 720p. The storm effects are simulated.";
}
function configureSources(){
 if(!video)return;
 const wasPlaying=!video.paused;
 video.pause();
 // A fresh set of source children ensures each change reloads the right clip.
 video.replaceChildren();
 if(clip==="hd"){
  video.appendChild(sourceNode(HD_BASE,'video/webm; codecs="vp8, vorbis"'));
  video.appendChild(sourceNode(HD_TRANSCODE+".1080p.vp9.webm",'video/webm; codecs="vp9, opus"'));
  video.appendChild(sourceNode("https://upload.wikimedia.org/wikipedia/commons/transcoded/f/fa/"+HD_NAME+"/"+HD_NAME+".360p.mpeg4.mov","video/quicktime"));
  video.setAttribute("aria-label","High-definition 2018 Colorado tornado time-lapse, accelerated footage");
 }else{
  video.appendChild(sourceNode(FILE_BASE,'video/webm; codecs="av01, opus"'));
  video.appendChild(sourceNode(TRANSCODE+".480p.vp9.webm",'video/webm; codecs="vp9, opus"'));
  video.appendChild(sourceNode(TRANSCODE+".360p.mpeg4.mov","video/quicktime"));
  video.setAttribute("aria-label","Real-time 2026 NOAA/NSSL tornado footage from Nebraska");
 }
 video.playbackRate=CLIPS[clip].rate;
 video.style.display="";
 if(toggle)toggle.disabled=false;
 video.load();
 describeClip();
 setStatus("Loading "+CLIPS[clip].label+"…");
 if(wasPlaying||!prefersReduced?.matches)playVideo();
}
function playVideo(){
 if(!video||!video.isConnected||video.error)return;
 const outcome=video.play();
 if(outcome&&typeof outcome.catch==="function"){
  outcome.catch(()=>{setVideoState("Play tornado video");
   setStatus("Press Play to view the real tornado footage.");});
 }
}
function createVideo(){
 // The previous lesson handler clears the visual before this handler runs.
 video=document.createElement("video");
 video.id="wtTornadoVideo";
 video.className="wtTornadoVideo";
 video.muted=true;
 video.loop=true;
 video.autoplay=!prefersReduced?.matches;
 video.playsInline=true;
 video.preload="metadata";
 video.poster=STILL;
 video.setAttribute("muted","");
 video.setAttribute("loop","");
 video.setAttribute("playsinline","");
 video.setAttribute("aria-label","Real tornado video");
 visual.insertBefore(video,visual.firstChild);
 toggle=document.createElement("button");
 toggle.type="button";toggle.id="wtTornadoVideoToggle";
 toggle.className="wtTornadoVideoToggle";
 setVideoState("Play tornado video");
 toggle.addEventListener("click",()=>{if(!video||video.error)return;
  if(video.paused)playVideo();else video.pause();});
 visual.appendChild(toggle);
 qualityToggle=document.createElement("button");
 qualityToggle.type="button";
 qualityToggle.id="wtTornadoQualityToggle";
 qualityToggle.className="wtTornadoQualityToggle";
 qualityToggle.addEventListener("click",()=>{
  clip=clip==="hd"?"noaa":"hd";
  configureSources();
 });
 visual.appendChild(qualityToggle);
 status=document.createElement("div");
 status.id="wtTornadoVideoStatus";
 status.className="wtTornadoVideoStatus";
 status.setAttribute("role","status");
 status.hidden=true;
 visual.appendChild(status);
 creditLink=document.createElement("a");
 creditLink.className="wtTornadoVideoCredit";
 creditLink.href=CLIPS[clip].page;creditLink.target="_blank";creditLink.rel="noopener noreferrer";
 visual.appendChild(creditLink);
 video.addEventListener("playing",()=>{
  setVideoState("Pause tornado video");
  // Browser-decoded resolution is more truthful than assuming HD on every device.
  const h=video.videoHeight||0;
  if(h>0&&h<720)setStatus("Playing at "+h+"p on this browser; HD requires a supported WebM codec.");
  else setStatus("");
 });
 video.addEventListener("pause",()=>setVideoState("Play tornado video"));
 video.addEventListener("error",()=>{
  // Recover visibly from unsupported formats or network errors.
  video.style.display="none";toggle.disabled=true;
  setVideoState("Video unavailable");
  setStatus("Video unavailable on this device. Showing a tornado photograph instead.");
 });
 configureSources();
 if(prefersReduced?.matches)setStatus("Press Play to view the selected tornado clip.");
}
function glow(x,y,rx,ry,tint,alpha){
 if(alpha<.002||rx<2||ry<2)return;
 ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);
 const g=ctx.createRadialGradient(0,0,0,0,0,rx);
 g.addColorStop(0,"rgba("+tint+","+alpha.toFixed(3)+")");
 g.addColorStop(.55,"rgba("+tint+","+(alpha*.30).toFixed(3)+")");
 g.addColorStop(1,"rgba("+tint+",0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function rain(){
 const count=12+Math.round(strength()*52);
 ctx.save();ctx.lineCap="round";
 for(let i=0;i<count;i++){
  const x0=noise(i*7+3)*width;
  const y0=noise(i*11+9)*height*.73;
  const v=8+level*3+noise(i*31)*12;
  const x=(x0-time*v*.4%width+width)%width;
  const y=(y0+time*v*1.25)%(height*.78);
  const len=height*(.011+noise(i*17)*.041);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.07,y+len);
  ctx.lineWidth=.5+noise(i*19)*.5;
  ctx.strokeStyle="rgba(219,229,224,"+(.014+strength()*.034*noise(i*13)).toFixed(3)+")";
  ctx.stroke();
 }
 ctx.restore();
}
function wind(){
 const s=strength();
 ctx.save();ctx.lineCap="round";
 for(let i=0;i<8+Math.round(s*22);i++){
  const x=(width*noise(i*31+2)+time*(8+s*29)+width*2)%width;
  const y=height*(.76+noise(i*17)*.15);
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+width*(.004+s*.011),y-1);
  ctx.strokeStyle="rgba(202,203,181,"+(.012+s*.025).toFixed(3)+")";
  ctx.lineWidth=.5;ctx.stroke();
 }
 ctx.restore();
}
function lightning(){
 if(prefersReduced?.matches)return;
 const age=time-flashAt;if(age<0||age>.58)return;
 const pulse=age<.075?Math.sin(age/.075*Math.PI*.5):
  Math.max(0,(1-(age-.075)/.505)*.45);
 ctx.save();ctx.globalCompositeOperation="screen";
 glow(width*flashX,height*.19,width*.25,height*.23,"222,234,243",
      pulse*(.10+strength()*.16));
 glow(width*(flashX-.07),height*.31,width*.12,height*.13,
      "216,230,238",pulse*(.05+strength()*.08));
 ctx.restore();
}
function draw(now){
 raf=0;if(!running())return;
 if(!prefersReduced?.matches&&lastFrame&&now-lastFrame<40){
  raf=requestAnimationFrame(draw);return;
 }
 const delta=lastFrame?Math.min(.07,(now-lastFrame)/1000):.033;
 lastFrame=now;if(!prefersReduced?.matches)time+=delta;
 if(!prefersReduced?.matches&&time>=nextLightning){
  flashAt=time;flashX=.24+Math.random()*.55;
  nextLightning=time+Math.max(6,14-strength()*5)+Math.random()*8;
 }
 if(width<=0||height<=0)return;
 ctx.clearRect(0,0,width,height);
 rain();wind();lightning();
 if(!prefersReduced?.matches)raf=requestAnimationFrame(draw);
}
function requestDraw(){
 if(!running())return;
 if(raf)cancelAnimationFrame(raf);
 raf=requestAnimationFrame(draw);
}
function resize(){
 if(!canvas?.isConnected||!ctx)return;
 const rect=visual.getBoundingClientRect();
 width=rect.width;height=rect.height;
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
 visual.style.setProperty("--wtAtmosphere",(.05+.17*strength()).toFixed(3));
 const label=level<=3?"Light rain and wind":level<=7?"Wind and rain":"Strong wind, rain and lightning";
 const output=document.getElementById("wpTornadoStrengthOut");
 if(output)output.textContent=level+" / 10";
 const badge=visual.querySelector("#wtTornadoSceneBadge");
 if(badge)badge.textContent=label;
 const readout=document.getElementById("wtTornadoReadout");
 if(readout)readout.textContent=label+" • "+level+"/10";
 const caption=visual.querySelector(".wpTornadoCaption small");
 if(caption)caption.textContent=clip==="hd"?
  "1080p Colorado tornado time-lapse (accelerated footage). Slider changes simulated storm effects.":
  "720p NOAA tornado footage from Nebraska. Slider changes simulated storm effects.";
 requestDraw();
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;lastFrame=0;
 if(video&&!video.paused)video.pause();
}
function start(){
 const controls=document.getElementById("wpTornadoControl");
 const slider=document.getElementById("wpTornadoStrength");
 if(!controls||!slider)return;
 stop();
 canvas=visual.querySelector("#wtTornadoMotion");
 createVideo();
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
 nextLightning=time+4+Math.random()*5;
 resize();update();
}
opener.addEventListener("click",start);
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="tornadoes"])')
 .forEach(button=>button.addEventListener("click",stop));
document.getElementById("wpScienceBack")?.addEventListener("click",stop);
document.querySelectorAll("[data-weather-open]").forEach(button=>button.addEventListener("click",stop));
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)stop();
 else{requestDraw();if(video&&video.paused&&!prefersReduced?.matches)playVideo();}
});
window.addEventListener("resize",resize);
prefersReduced?.addEventListener?.("change",()=>{
 stop();requestDraw();
});
})();