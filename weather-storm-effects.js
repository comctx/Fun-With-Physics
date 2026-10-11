/* Weather Physics — vivid atmospheric effects (teaching simulation) */
(function(){
"use strict";
const lab=document.getElementById("wpStormLab"),scene=lab?.querySelector(".wpStormSceneWrap");
if(!lab||!scene||document.getElementById("wstFXCanvas"))return;
const canvas=document.createElement("canvas");canvas.id="wstFXCanvas";canvas.width=1000;canvas.height=590;
canvas.setAttribute("aria-hidden","true");scene.appendChild(canvas);
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const get=id=>Number(document.getElementById("wst"+id)?.value||0);
const output=document.getElementById("wstSceneStatus");
const explain=document.getElementById("wstExplain");
const strike=document.getElementById("wstStrike");
let flashAt=-1,lastAuto=0,clock=0,pendingStrike=false;
const rnd=n=>{const x=Math.sin(n*78.233+2.73)*43758.5453123;return x-Math.floor(x)};
function conditions(){
 const t=get("Temp"),hum=get("Hum"),cloud=get("Cloud"),charge=get("Charge"),wind=get("Wind");
 // Adapted from the user's Flutter weather rules. Temperature here is Fahrenheit.
 const snow=t<32&&hum>60&&cloud>=40;
 const storm=!snow&&((hum>80&&charge>75&&cloud>60)||(hum>70&&cloud>60&&charge>80));
 const tornado=!snow&&!storm&&wind>85&&hum>70&&cloud>=45;
 const rain=!snow&&hum>60&&cloud>=45;
 const cloudy=cloud>=40||hum>40;
 return {t,hum,cloud,charge,wind,snow,storm,tornado,rain,cloudy};
}
function update(){
 const c=conditions(),ready=c.charge>=65&&c.cloud>=45;
 strike.disabled=false;strike.title=ready?"Trigger a lightning strike":"Raise charge to 65% and clouds to 45% to strike";
 strike.setAttribute("aria-label","Strike lightning. Requires charge at least 65 percent and cloud density at least 45 percent");
 if(c.snow)output.textContent="❄️ Snowstorm";
 else if(c.storm)output.textContent="⛈️ Thunderstorm";
 else if(c.tornado)output.textContent="🌪️ Tornado conditions (simulation)";
 else if(c.rain)output.textContent="🌧️ Rain falling";
 else if(c.cloudy)output.textContent="☁️ Cloudy";
 else output.textContent="☀️ Sunny";
 scene.dataset.wcWeather=c.snow?"snow":c.storm?"storm":c.tornado?"tornado":c.rain?"rain":c.cloudy?"cloud":"clear";
}
function trigger(){
 const c=conditions(),ready=c.charge>=65&&c.cloud>=45;
 if(ready){pendingStrike=true;flashAt=performance.now();explain.textContent="⚡ Lightning strike! Watch the branching bolt illuminate the storm. Raise humidity and clouds to make rain."}
 else{explain.textContent="⚡ For lightning: raise atmospheric charge to 65% and cloud density to 45%. Current: charge "+c.charge+"%, clouds "+c.cloud+"%."}
 update();
}
strike.addEventListener("click",trigger);
["Temp","Hum","Cloud","Wind","Charge"].forEach(k=>document.getElementById("wst"+k)?.addEventListener("input",update));
["wstPreset","wstReset","wpStormHomeOpen"].forEach(k=>document.getElementById(k)?.addEventListener("click",()=>requestAnimationFrame(()=>{pendingStrike=false;update()})));
function strokes(path,width,color,glow){
 ctx.save();ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);
 for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);
 ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=color;ctx.lineWidth=width;
 ctx.shadowColor=glow;ctx.shadowBlur=width*3;ctx.stroke();ctx.restore();
}
function bolt(phase){
 const x=500,coords=[[x,-20],[x-17,57],[x+30,89],[x+4,153],[x+39,198],[x-30,252],[x-12,298],[x-77,352],[x-50,424],[x-120,535]];
 ctx.fillStyle="rgba(224,239,255,"+(0.14*phase)+")";ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=Math.min(1,phase);strokes(coords,26,"#6a9dff","#abcfff");strokes(coords,9,"#eaf5ff","#fff");
 strokes([[x+4,153],[x-69,177],[x-92,235],[x-148,255]],4,"#def3ff","#a7d3ff");
 strokes([[x-30,252],[x+53,268],[x+84,325]],4,"#def3ff","#a7d3ff");
 strokes([[x-50,424],[x+11,438],[x+49,484]],3,"#ffffff","#92cfff");ctx.restore();
}
function draw(now){
 requestAnimationFrame(draw);
 if(lab.hidden)return;
 const c=conditions();clock+=.65;ctx.clearRect(0,0,W,H);
 const cloudy=c.cloud/100,storminess=Math.max(0,(c.cloud-35)/65);
 // Keep the photo underneath; increase dramatic shade as cloud cover builds.
 if(storminess>.05){
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"rgba(5,15,31,"+(0.22+storminess*.48)+")");grad.addColorStop(.66,"rgba(10,18,28,"+(storminess*.3)+")");grad.addColorStop(1,"rgba(7,16,23,"+(storminess*.13)+")");
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Soft billowing storm deck over the upper part of the photograph.
  for(let i=0;i<9;i++){
    const px=(i*163+clock*(.3+c.wind*.018))%(W+410)-210;
    const py=65+(i%3)*51;
    const g=ctx.createRadialGradient(px,py,10,px,py,115+(i%3)*26);
    g.addColorStop(0,"rgba(22,32,43,"+(storminess*.47)+")");
    g.addColorStop(1,"rgba(15,23,35,0)");
    ctx.fillStyle=g;ctx.fillRect(px-200,py-200,400,400);
  }
 }
 if(c.rain){
  const intensity=Math.min(1,(c.hum-60)/35+(c.cloud-45)/100);
  const count=Math.round(180+intensity*430);
  ctx.lineWidth=1.7;ctx.lineCap="round";
  for(let i=0;i<count;i++){
   const x=(rnd(i*17)*W+clock*(12+c.wind*.32))%(W+80)-40;
   const y=(rnd(i*41+5)*H+clock*(12+intensity*14)+i*11)%(H+50)-25;
   const slant=5+c.wind*.32,len=20+intensity*21;
   ctx.strokeStyle="rgba(214,237,255,"+(0.27+rnd(i*3)*.48)+")";
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+slant,y+len);ctx.stroke();
  }
  // Low rain haze; keep the landscape legible.
  const g=ctx.createLinearGradient(0,H*.25,0,H);
  g.addColorStop(0,"rgba(139,169,187,0)");
  g.addColorStop(1,"rgba(154,192,208,"+(.10+intensity*.17)+")");
  ctx.fillStyle=g;ctx.fillRect(0,H*.25,W,H*.75);
 }
 if(c.snow){
  ctx.fillStyle="#f2fcff";
  for(let i=0;i<260;i++){
   const x=(rnd(i*7)*W+clock*(1+c.wind*.11))%W,y=(rnd(i*19)*H+clock*(2+rnd(i)*2))%H;
   ctx.globalAlpha=.34+rnd(i*31)*.63;
   ctx.beginPath();ctx.arc(x,y,1+rnd(i*2)*2.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
 }
 if(c.tornado){
  // An animated visual illustration of funnel circulation over tornado photography.
  const x=W*.49,y=H*.55;
  const intensity=Math.max(0.4,(c.wind-70)/30);
  const veil=ctx.createRadialGradient(x,y,14,x,y,210);
  veil.addColorStop(0,"rgba(26,31,36,"+(Math.min(.47,intensity*.36))+")");
  veil.addColorStop(1,"rgba(26,31,36,0)");
  ctx.fillStyle=veil;ctx.fillRect(x-215,y-245,430,450);
  for(let i=0;i<50;i++){
   const ring=i/49,yy=H*.13+ring*H*.54;
   const radius=(1-ring)*140+ring*36;
   const phase=clock*(.03+intensity*.09)+i*.43;
   ctx.strokeStyle="rgba(224,232,231,"+(.1+.12*Math.sin(phase)*Math.sin(phase))+")";
   ctx.lineWidth=1.3+intensity*.5;
   ctx.beginPath();ctx.ellipse(x+Math.sin(phase)*12,yy,radius,8+ring*8,-.16,phase,phase+2.3);ctx.stroke();
  }
  for(let i=0;i<200;i++){
   const phase=i*2.39+clock*(.02+intensity*.07);
   const radius=12+rnd(i*7)*160,xx=x+Math.cos(phase)*radius,yy=H*.78+Math.sin(phase)*radius*.17;
   ctx.fillStyle="rgba(184,165,137,"+(.08+rnd(i)*.40)+")";
   ctx.fillRect(xx,yy,2+rnd(i*11)*3,1.6);
  }
 }
 if(c.wind>12){
  for(let i=0;i<80;i++){
   const x=(rnd(i*91)*W+clock*(4+c.wind*.25))%W,y=rnd(i*82)*H;
   ctx.strokeStyle="rgba(223,247,255,0.19)";ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7+c.wind*.42,y-2);ctx.stroke();
  }
 }
 // Storms produce occasional lightning once strongly charged.
 if(c.storm&&c.charge>=85&&now-lastAuto>9500){flashAt=now;lastAuto=now}
 if(flashAt>0){
  const elapsed=now-flashAt;
  if(elapsed<950){
   const phase=elapsed<150?1:elapsed<265?.1:elapsed<405?.95:Math.max(0,(950-elapsed)/900);
   if(phase>.01)bolt(phase);
  }else {flashAt=-1;pendingStrike=false}
 }
}
update();
requestAnimationFrame(draw);
})();
