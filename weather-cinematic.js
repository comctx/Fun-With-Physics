/* Cinematic Weather visuals. Keeps existing labs, handlers and chosen-city weather data intact. */
(function(){
"use strict";
var page=document.getElementById("weatherLabPage");
var home=document.getElementById("wpDashboard");
if(!page||!home||document.getElementById("wcGallery2026"))return;
var scenes=[
 {key:"lightning",label:"Lightning",url:"https://upload.wikimedia.org/wikipedia/commons/1/19/Orage-nuit.jpg"},
 {key:"tornadoes",label:"Tornadoes",url:"https://commons.wikimedia.org/wiki/Special:FilePath/2016-05-16_Tornado_north_of_Solomon%2C_Kansas.jpg?width=580"},
 {key:"hurricanes",label:"Hurricanes",url:"https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/84000/84145/HurricaneIselle_tmo_2014216.jpg?crop=faces%2Cfocalpoint&fit=clip&h=550&w=900"},
 {key:"rainbows",label:"Rainbows",url:"https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow5_-_NOAA.jpg?width=650"},
 {key:"snowflakes",label:"Snow Crystals",url:"https://commons.wikimedia.org/wiki/Special:FilePath/Snowflake_macro_%28Unsplash%29.jpg?width=650"}
];
var title=document.createElement("h3");title.className="wcGalleryTitle";title.textContent="Explore Real Weather Phenomena";
var gallery=document.createElement("div");gallery.id="wcGallery2026";gallery.className="wpCinematicGallery";
scenes.forEach(function(scene){
 var btn=document.createElement("button");btn.type="button";btn.setAttribute("aria-label","Open "+scene.label+" physics lesson");
 var img=document.createElement("span");img.className="wcImage";img.style.backgroundImage='url("'+scene.url+'")';img.setAttribute("aria-hidden","true");
 var text=document.createElement("strong");text.textContent=scene.label;
 btn.appendChild(img);btn.appendChild(text);
 btn.addEventListener("click",function(){
  var original=page.querySelector(".wpExtremeCard [data-weather-topic='"+scene.key+"']");
  if(original){original.click();var science=document.getElementById("wpScienceView");if(science&&!science.hidden)science.scrollIntoView({behavior:"smooth",block:"start"})}
 });
 gallery.appendChild(btn);
});
var feature=home.querySelector(".wpFeatureDeck");
if(feature){home.insertBefore(title,feature);home.insertBefore(gallery,feature)}
var credits=document.createElement("details");credits.className="wcCredits";credits.innerHTML='<summary>Weather photograph credits and licenses</summary><p>Lightning photograph: <a href="https://commons.wikimedia.org/wiki/File:2015-08-07_23-13-18_orage.jpg" target="_blank" rel="noopener">Thomas Bresson / Wikimedia Commons (CC BY 3.0)</a>. Thunderstorm: <a href="https://commons.wikimedia.org/wiki/File:Orage-nuit.jpg" target="_blank" rel="noopener">National Science Foundation (public domain)</a>. Tornado: <a href="https://commons.wikimedia.org/wiki/File:2016-05-16_Tornado_north_of_Solomon,_Kansas.jpg" target="_blank" rel="noopener">Ks0stm / Wikimedia Commons (CC BY 4.0)</a>. Hurricane: <a href="https://science.nasa.gov/earth/earth-observatory/hurricanes-iselle-and-julio-84145/" target="_blank" rel="noopener">NASA Earth Observatory</a>. Rainbow: <a href="https://commons.wikimedia.org/wiki/File:Rainbow5_-_NOAA.jpg" target="_blank" rel="noopener">NOAA (public domain)</a>. Snow crystal: <a href="https://commons.wikimedia.org/wiki/File:Snowflake_macro_(Unsplash).jpg" target="_blank" rel="noopener">Aaron Burden (CC0)</a>. All photographs are illustrative, not live webcam views; some are cropped and darkened for readability.</p>';
home.appendChild(credits);
var sky=document.getElementById("wpSkyScene");
var fields=["wpTemp","wpHum","wpPress","wpWind"];
var changed=false;
function setSky(){
 if(!sky)return;
 var t=+(document.getElementById("wpTemp")||{}).value||72;
 var h=+(document.getElementById("wpHum")||{}).value||55;
 var p=+(document.getElementById("wpPress")||{}).value||1013;
 var mode="clear";
 if(t<=32&&h>=50)mode="snow";
 else if(h>=76&&p<=1002)mode="storm";
 else if(h>=55)mode="cloud";
 sky.dataset.sky=mode;
 var credit=sky.querySelector(".wpPhotoCredit");
 if(credit)credit.textContent="Illustrative real-weather photograph • not a live city view";
}
if(sky){
 sky.dataset.sky="storm";
 fields.forEach(function(id){var f=document.getElementById(id);if(f)f.addEventListener("input",function(){changed=true;setSky()})});
}
var stormScene=page.querySelector(".wpStormSceneWrap");
function updateStormPhoto(){
 if(!stormScene)return;
 var get=function(id){return +(document.getElementById(id)||{}).value||0};
 var temperature=get("wstTemp"),hum=get("wstHum"),cloud=get("wstCloud"),charge=get("wstCharge");
 var state=temperature<=32&&hum>35?"snow":hum>70&&cloud>60&&charge>80?"storm":cloud>55?"cloud":"clear";
 stormScene.dataset.wcWeather=state;
}
["wstTemp","wstHum","wstCloud","wstCharge"].forEach(function(id){var input=document.getElementById(id);if(input)input.addEventListener("input",updateStormPhoto)});
["wstPreset","wstReset","wpStormHomeOpen"].forEach(function(id){var btn=document.getElementById(id);if(btn)btn.addEventListener("click",function(){requestAnimationFrame(updateStormPhoto)})});
updateStormPhoto();
})();
