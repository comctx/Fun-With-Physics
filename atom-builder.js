/* Atom Builder controls and element identity */
(function(){
"use strict";
const btn=document.getElementById("atomModeBtn"),nav=document.getElementById("uiPhoneNav"),space=document.getElementById("workspace");
if(!btn||!space)return;
const symbols="H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr".split(" ");
const names="Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminum Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium Scandium Titanium Vanadium Chromium Manganese Iron Cobalt Nickel Copper Zinc Gallium Germanium Arsenic Selenium Bromine Krypton".split(" ");
const page=document.createElement("section");page.id="atomLabPage";page.hidden=true;page.setAttribute("aria-label","Atoms and Nuclear Physics Lab");space.appendChild(page);
page.innerHTML='<div class="abTop"><div><span class="abEyebrow">FUN WITH PHYSICS • ATOMIC SCIENCE</span><h2>⚛️ Atom Builder</h2><p>Build matter one particle at a time. Protons determine the element, neutrons determine its isotope, and electrons determine its charge.</p></div><div class="abMiniBrand">ATOM LAB • INTERACTIVE</div></div><div class="abLayout"><div><div class="abStage"><div class="abStageHead"><strong>Inside the Atom</strong><span>3D-inspired nucleus and electron probability cloud</span></div><div class="abStageBadge">LIVE MODEL</div><canvas id="abCanvas" aria-label="Animated model of an atom"></canvas><div class="abStageNote"><span>Electron positions illustrate probability—not planetary orbits.</span><span>🔴 Protons &nbsp; 🔵 Neutrons &nbsp; 🟣 Electron cloud</span></div></div><div class="abStats"><div class="abStat"><span>Atomic number</span><strong id="abZ">6</strong><small>Protons</small></div><div class="abStat"><span>Mass number</span><strong id="abA">12</strong><small>Protons + neutrons</small></div><div class="abStat"><span>Net charge</span><strong id="abQ">0</strong><small>Protons − electrons</small></div></div><div class="abInfo"><h3>🔬 What changed?</h3><p id="abIdentityExplain"></p><p id="abElectronExplain"></p></div></div><div><div class="abElement"><div class="abElementSymbol"><small id="abTileZ">6</small><span id="abTileSym">C</span><em id="abTileMass">12</em></div><div><h3 id="abName">Carbon</h3><p id="abIsotope">Carbon-12</p><p id="abSpecies">Neutral atom</p><span class="abCharge" id="abCharge">Charge 0</span></div></div><div class="abControls"><h3>Build Your Atom</h3><div id="abInputRows"></div><h3>Start with an element</h3><div class="abPresets" id="abPresets"></div></div><div class="abChallenges"><h3>🏆 Atom Challenges</h3><div class="abChallengeRow"><button data-challenge="carbon">Build Carbon-12</button><button data-challenge="oxygen">Build Oxygen-16</button><button data-challenge="sodium">Make a Sodium Ion</button></div><p id="abChallengeStatus">Select a challenge and build the correct atom yourself.</p></div></div></div><div class="abLessons"><h3>Explore the Science</h3><div class="abLessonTiles"><article><strong>🔬 Inside the Atom</strong><p>Protons and neutrons consist of quarks. Electrons are described by quantum probability distributions, not miniature planetary orbits.</p></article><article><strong>☢️ Nuclear Physics</strong><p>Radioactive decay, fission, fusion, and how stars make elements are planned as separate interactive experiments.</p></article></div><p class="abDisclaimer">Educational visualization only. Particle colors, separation, nucleus size, and electron cloud are not to scale. Not every simulated isotope is stable or exists.</p></div>';
const model={p:6,n:6,e:6},limits={p:36,n:80,e:36},descs={p:["🔴 Protons","The proton count defines the chemical element."],n:["🔵 Neutrons","Neutrons determine the isotope and mass number."],e:["🟣 Electrons","Electron count affects the electrical charge."]};
for(const k of ["p","n","e"]){
 const row=document.createElement("div");row.className="abControl";
 row.innerHTML='<div class="abControlTop"><label for="abRange'+k+'">'+descs[k][0]+'</label><div class="abStepper"><button type="button" data-step="-1">−</button><output id="abCount'+k+'">'+model[k]+'</output><button type="button" data-step="1">+</button></div></div><input id="abRange'+k+'" type="range" min="'+(k==="p"?1:0)+'" max="'+limits[k]+'" value="'+model[k]+'"><small>'+descs[k][1]+'</small>';
 page.querySelector("#abInputRows").appendChild(row);
 row.querySelector("input").addEventListener("input",ev=>{model[k]=+ev.target.value;update()});
 row.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{model[k]=Math.min(limits[k],Math.max(k==="p"?1:0,model[k]+Number(b.dataset.step)));update()}));
}
const presets=[["H",1,0,1],["He",2,2,2],["C",6,6,6],["O",8,8,8],["Ne",10,10,10],["Na",11,12,11],["Fe",26,30,26],["Kr",36,48,36]];
presets.forEach(([label,p,n,e])=>{const b=document.createElement("button");b.textContent=label;b.addEventListener("click",()=>{Object.assign(model,{p,n,e});update()});page.querySelector("#abPresets").appendChild(b)});
let challenge=null;const targets={carbon:[6,6,6],oxygen:[8,8,8],sodium:[11,12,10]};
page.querySelectorAll("[data-challenge]").forEach(b=>b.addEventListener("click",()=>{challenge=b.dataset.challenge;update()}));
function update(){
 const {p,n,e}=model,charge=p-e,element=names[p-1],symbol=symbols[p-1];
 const put=(id,s)=>page.querySelector("#"+id).textContent=s;
 put("abZ",p);put("abA",p+n);put("abQ",charge>0?"+"+charge:String(charge));
 put("abTileZ",p);put("abTileSym",symbol);put("abTileMass",p+n);
 put("abName",element);put("abIsotope",element+"-"+(p+n));
 put("abSpecies",charge===0?"Neutral atom":charge>0?"Positive ion (cation)":"Negative ion (anion)");
 put("abCharge","Charge "+(charge>0?"+":"")+charge);
 put("abIdentityExplain",p+" protons identify this element as "+element+". With "+n+" neutrons, it is "+element+"-"+(p+n)+".");
 put("abElectronExplain",e+" electrons give a net charge of "+(charge>0?"+":"")+charge+" elementary-charge units. The purple cloud is an illustrative distribution, not a literal orbit.");
 for(const k of ["p","n","e"]){page.querySelector("#abRange"+k).value=model[k];put("abCount"+k,model[k])}
 if(challenge){const goal=targets[challenge];put("abChallengeStatus",goal.every((v,i)=>v===[p,n,e][i])?"🏆 Challenge complete! You built the requested atom or ion.":"Target: "+goal[0]+" protons, "+goal[1]+" neutrons, "+goal[2]+" electrons. Keep adjusting!")}
}
function show(open){
 page.hidden=!open;btn.classList.toggle("active",open);
 if(open){
  document.getElementById("weatherLabPage").hidden=true;
  document.querySelectorAll(".modebar button").forEach(b=>{if(b!==btn)b.classList.remove("active")});
  document.getElementById("app").classList.remove("desktopToolsOpen");
  document.getElementById("desktopToolsToggle").style.display="none";
  document.getElementById("desktopLabRun").style.display="none";
  nav.value="atom";page.scrollTop=0;
 }else document.getElementById("desktopToolsToggle").style.removeProperty("display");
}
btn.addEventListener("click",()=>show(true));
nav.addEventListener("change",()=>{if(nav.value==="atom")show(true);else if(!page.hidden)show(false)});
document.querySelectorAll(".modebar button:not(#atomModeBtn)").forEach(b=>b.addEventListener("click",()=>{if(!page.hidden)show(false)}));
window.__funPhysicsAtom={page,model,show};
update();
})();
