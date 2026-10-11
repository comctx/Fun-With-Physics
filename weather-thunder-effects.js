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
   master.gain.value=.54;
   master.connect(ctx.destination);
  }
  // Runs directly from a click, which is required to unlock browser audio.
  await ctx.resume();
  soundOn=ctx.state==="running";
  reflect();
  if(soundOn){
   notify("Loading real thunder recording…");
   const loaded=await loadRealThunder();
   if(!soundOn||!active())return;
   notify(loaded?"Real thunder enabled — previewing sound":"Thunder enabled — using offline sound");
   playThunder(.6,"ground");
  }else notify("Tap Thunder On to enable audio");
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

/* Public-domain field recording: "Tonitrus" by Mysid, Wikimedia Commons.
   https://commons.wikimedia.org/wiki/File:Tonitrus.ogg
   Loaded once when sound is enabled. If the recording is unavailable,
   the self-contained synthesized thunder remains the fallback. */
const THUNDER_RECORDING="https://upload.wikimedia.org/wikipedia/commons/c/c8/Tonitrus.ogg";
let recordedBuffer=null,recordingLoad=null,recordedSections=[];
async function loadRealThunder(){
 if(recordedBuffer)return true;
 if(!ctx||!window.fetch)return false;
 if(recordingLoad)return recordingLoad;
 recordingLoad=(async()=>{
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),6500);
  try{
   const response=await fetch(THUNDER_RECORDING,{signal:abort.signal,mode:"cors"});
   if(!response.ok)throw new Error("Thunder recording could not load");
   const raw=await response.arrayBuffer();
   const decoded=await ctx.decodeAudioData(raw);
   if(decoded.duration<3)throw new Error("Thunder recording too short");
   recordedBuffer=decoded;
   // Find loud portions of the real recording so each triggered sound
   // starts near a thunderclap, rather than an arbitrary quiet passage.
   const data=decoded.getChannelData(0),rate=decoded.sampleRate;
   const frameLength=Math.max(1,Math.floor(rate*.2));
   const energies=[];
   for(let start=0;start<data.length;start+=frameLength){
    let sum=0,count=0;
    for(let j=start;j<Math.min(start+frameLength,data.length);j+=8){
     const v=data[j];sum+=v*v;count++;
    }
    energies.push(Math.sqrt(sum/Math.max(1,count)));
   }
   const candidates=energies.map((energy,i)=>({energy,time:i*.2}))
    .filter(x=>x.time<decoded.duration-3.5)
    .sort((a,b)=>b.energy-a.energy);
   recordedSections=[];
   for(const candidate of candidates){
    const start=Math.max(0,candidate.time-.4);
    if(recordedSections.every(existing=>Math.abs(existing-start)>2.8)){
     recordedSections.push(start);
     if(recordedSections.length>=6)break;
    }
   }
   if(!recordedSections.length)recordedSections=[0];
   return true;
  }catch(_err){
   recordedBuffer=null;
   return false;
  }finally{clearTimeout(timeout)}
 })();
 const loaded=await recordingLoad;
 if(!loaded)recordingLoad=null;
 return loaded;
}
function playRealThunder(distanceKm,type){
 if(!recordedBuffer||!ctx)return false;
 const start=ctx.currentTime+.015;
 const distant=Math.min(1,Math.max(0,(distanceKm-.4)/1.7));
 const offset=recordedSections[Math.floor(random(0,recordedSections.length))]||0;
 const length=Math.min(random(5.0,7.8),recordedBuffer.duration-offset-.04);
 if(length<1)return false;
 const source=ctx.createBufferSource();
 source.buffer=recordedBuffer;
 source.playbackRate.value=random(.91,1.06)*(distant>.55?.95:1);
 const filter=ctx.createBiquadFilter();
 filter.type="lowpass";
 filter.frequency.value=1200+(1-distant)*2900;
 const volume=ctx.createGain();
 const intensity=(type==="sheet"?.59:1)*(1-distant*.65)*random(.75,.94);
 volume.gain.setValueAtTime(.0001,start);
 volume.gain.linearRampToValueAtTime(intensity,start+.10);
 volume.gain.setValueAtTime(intensity*.88,start+Math.min(1.8,length*.45));
 volume.gain.exponentialRampToValueAtTime(.0001,start+length-.015);
 source.connect(filter);
 filter.connect(volume);
 if(ctx.createStereoPanner){
  const pan=ctx.createStereoPanner();
  pan.pan.value=random(-.27,.27);
  volume.connect(pan);pan.connect(master);
 }else volume.connect(master);
 source.start(start,offset,length);
 source.stop(start+length+.03);
 track(source);
 // For near strikes, a sharp crack arrives with the recorded deep rumble.
 if(distanceKm<.72&&type!=="sheet"){
  const crack=makeNoise(.37);
  createLayer(crack,start,random(950,1900),.22*(1-distant),
   [[0,.001],[.01,1],[.05,.62],[.13,.28],[.34,.0001]],"highpass");
 }
 return true;
}

function playThunder(distanceKm,type){
 if(!soundOn||!active()||!ctx||ctx.state!=="running")return;
 if(recordedBuffer&&playRealThunder(distanceKm,type))return;
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