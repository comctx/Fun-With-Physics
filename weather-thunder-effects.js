/* Fun With Physics — Lightning / Thunder sound
 * Creates synthetic thunder after each lightning flash using Web Audio.
 * Sound is opt-in, generated locally (no third-party audio or downloads).
 * Distance-based delay uses ~343 m/s speed of sound (illustrative).
 */
(function () {
"use strict";
const visual=document.getElementById("wpScienceVisual");
const view=document.getElementById("wpScienceView");
const page=document.getElementById("weatherLabPage");
const lightning=document.querySelector('[data-weather-topic="lightning"]');
if(!visual||!view||!page||!lightning)return;

const AudioContextClass=window.AudioContext||window.webkitAudioContext;
let ctx=null,master=null,soundOn=false,toggle=null,status=null;
const pending=new Set(),voices=new Set();
const random=(min,max)=>min+Math.random()*(max-min);
const active=()=>!document.hidden&&!view.hidden&&!page.hidden&&visual.dataset.scene==="lightning";
function notify(message){if(status)status.textContent=message}
function clearThunder(){
 for(const timer of pending)clearTimeout(timer);
 pending.clear();
 for(const source of voices){try{source.stop()}catch(_e){}}
 voices.clear();
}
function reflect(){
 if(!toggle)return;
 toggle.textContent=soundOn?"🔊 Thunder On":"🔇 Thunder Off";
 toggle.setAttribute("aria-pressed",String(soundOn));
 toggle.setAttribute("aria-label",soundOn?"Turn thunder sound off":"Turn thunder sound on");
}
async function enableSound(){
 if(!AudioContextClass){notify("Thunder audio is unavailable in this browser");return}
 try{
  if(!ctx){
   ctx=new AudioContextClass();
   master=ctx.createGain();
   master.gain.value=.43;
   master.connect(ctx.destination);
  }
  // Runs directly from a click, which is required to unlock browser audio.
  await ctx.resume();
  soundOn=ctx.state==="running";
  reflect();
  notify(soundOn?"Thunder enabled — listen after the next flash":"Tap Thunder On to enable audio");
 }catch(_e){
  soundOn=false;
  reflect();
  notify("This browser did not allow sound — try tapping Thunder again");
 }
}
function switchSound(){
 if(soundOn){
  soundOn=false;clearThunder();reflect();notify("Thunder muted");
 }else{enableSound()}
}
function makeNoise(seconds){
 const length=Math.round(ctx.sampleRate*seconds);
 const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
 const data=buffer.getChannelData(0);
 let brown=0;
 for(let i=0;i<length;i++){
  const white=Math.random()*2-1;
  brown=(brown+.022*white)/1.022;
  data[i]=white*.56+brown*2.1;
 }
 return buffer;
}
function track(source){
 voices.add(source);
 source.addEventListener("ended",()=>voices.delete(source),{once:true});
}
function createLayer(buffer,time,frequency,gainAmount,shape,mode="lowpass"){
 const source=ctx.createBufferSource();
 source.buffer=buffer;
 const filter=ctx.createBiquadFilter();
 filter.type=mode;filter.frequency.value=frequency;
 if(mode==="bandpass")filter.Q.value=.6;
 const gain=ctx.createGain();
 gain.gain.setValueAtTime(.0001,time);
 for(const [offset,mult] of shape){
  gain.gain.linearRampToValueAtTime(Math.max(.0001,gainAmount*mult),time+offset);
 }
 source.connect(filter);filter.connect(gain);gain.connect(master);
 source.start(time);
 source.stop(time+buffer.duration);
 track(source);
}
function playThunder(distanceKm,type){
 if(!soundOn||!active()||!ctx||ctx.state!=="running")return;
 // Close strikes start with a sharp crack, distant strikes have softer rolling lows.
 const closeness=Math.max(0,1-distanceKm/2.4);
 const duration=random(3.8,5.5);
 const start=ctx.currentTime+.02;
 const buffer=makeNoise(duration);
 const tail=duration-.03;
 const swells=[
  [0,.01],[.08,.72],[.23,1],[.46,.47],
  [.75,.70],[1.15,.38],[1.53,.58],
  [2.05,.28],[2.65,.42],[3.17,.16],[tail,.0001]
 ];
 createLayer(buffer,start,random(135,240),.42,swells);
 createLayer(buffer,start,random(420,740),.21,
  [[0,.01],[.09,closeness*.6+.22],[.27,.9],[.64,.38],
   [1.4,.29],[2.25,.16],[tail,.0001]],"bandpass");
 if(distanceKm<1.05&&type!=="sheet"){
  // The nearby snap is short and less bass-heavy than the following rumble.
  const crackLength=.55;
  const crack=makeNoise(crackLength);
  createLayer(crack,start,random(900,1650),.20*closeness,
   [[0,.01],[.018,1],[.055,.77],[.14,.27],[.32,.08],[.53,.0001]],"highpass");
 }
}
function onFlash(event){
 if(!soundOn||!active())return;
 const kind=event.detail?.type||"ground";
 // Cloud flashes tend to be more distant; distance is illustrative and not measured.
 const distanceKm=kind==="ground"?random(.22,1.04):random(.65,1.85);
 const delaySeconds=distanceKm/.343;
 notify("Thunder in about "+delaySeconds.toFixed(1)+" seconds");
 const timer=setTimeout(()=>{
  pending.delete(timer);
  if(!soundOn||!active())return;
  playThunder(distanceKm,kind);
  notify(distanceKm<.85?"Near thunder • sharp crack and rumble":"Distant thunder • rolling rumble");
 },delaySeconds*1000);
 pending.add(timer);
}
function closeView(){
 clearThunder();
 if(toggle){toggle.remove();toggle=null}
 if(status){status.remove();status=null}
}
function openView(){
 closeView();
 if(!active())return;
 toggle=document.createElement("button");
 toggle.type="button";toggle.className="wlfxThunderToggle";
 toggle.addEventListener("click",switchSound);
 visual.appendChild(toggle);
 status=document.createElement("span");
 status.className="wlfxThunderStatus";
 status.setAttribute("role","status");
 status.setAttribute("aria-live","polite");
 visual.appendChild(status);
 reflect();
 notify(soundOn?"Thunder enabled — listen after lightning":"Turn thunder on for sound");
}
visual.addEventListener("fwphysics-lightning",onFlash);
lightning.addEventListener("click",openView);
document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="lightning"])')
 .forEach(element=>element.addEventListener("click",closeView));
document.querySelectorAll("[data-weather-open]").forEach(element=>element.addEventListener("click",closeView));
document.getElementById("wpScienceBack")?.addEventListener("click",closeView);
document.addEventListener("visibilitychange",()=>{if(document.hidden)clearThunder()});
})();