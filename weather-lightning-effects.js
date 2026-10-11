/* Fun With Physics — Weather Science lightning
 * Randomized discharge channels, branching leaders, short return strokes,
 * localized cloud illumination and optional cloud-to-cloud lightning.
 * Educational visual simulation, not a weather or strike predictor.
 */
(function () {
  "use strict";
  const view = document.getElementById("wpScienceView");
  const visual = document.getElementById("wpScienceVisual");
  const page = document.getElementById("weatherLabPage");
  const topic = document.querySelector('[data-weather-topic="lightning"]');
  if (!view || !visual || !page || !topic) return;

  const NS = "http://www.w3.org/2000/svg";
  const motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let layer = null, triggerButton = null, autoTimer = 0, pulseTimers = [], lastStrike = -Infinity;
  const rand = (min, max) => min + Math.random() * (max - min);
  const integer = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
  const reduced = () => !!(motion && motion.matches);
  const visible = () => !document.hidden && !view.hidden && !page.hidden &&
    visual.dataset.scene === "lightning" && !!layer;

  function clearTimers() {
    clearTimeout(autoTimer);
    autoTimer = 0;
    pulseTimers.forEach(clearTimeout);
    pulseTimers = [];
  }
  function svgPath(d, cls) {
    const e = document.createElementNS(NS, "path");
    e.setAttribute("d", d);
    e.setAttribute("class", cls);
    e.setAttribute("fill", "none");
    e.setAttribute("stroke-linecap", "round");
    e.setAttribute("stroke-linejoin", "round");
    return e;
  }
  function toPath(points) {
    return points.map(([x, y], i) =>
      (i ? "L " : "M ") + x.toFixed(1) + " " + y.toFixed(1)).join(" ");
  }

  function buildBolt(type) {
    const ground = type === "ground";
    const startX = ground ? rand(230, 770) : rand(80, 260);
    const startY = ground ? rand(-30, 15) : rand(110, 260);
    let x = startX, y = startY, drift = rand(-9, 9);
    const points = [[x, y]], forks = [];
    const direction = Math.random() < .5 ? -1 : 1;
    const destinationX = rand(720, 920);
    for (let i = 0; i < 58; i++) {
      if (ground) {
        const step = rand(17, 31);
        drift = drift * .23 + rand(-37, 37);
        x = clamp(x + drift, 45, 955);
        y = Math.min(708, y + step);
      } else {
        drift = drift * .20 + rand(-28, 28);
        x = Math.min(destinationX, x + rand(16, 31));
        y = clamp(y + drift, 65, 415);
      }
      points.push([x, y]);

      // Forks emerge from the discharge channel, taper and die out.
      if (i > 1 && Math.random() < (ground ? .25 : .21) && forks.length < 11) {
        const side = Math.random() < .5 ? -1 : 1;
        let bx = x, by = y, momentum = side * rand(14, 26);
        const segments = integer(3, 8), fork = [[bx, by]];
        for (let k = 0; k < segments; k++) {
          momentum = momentum * .40 + side * rand(9, 26);
          bx = clamp(bx + (ground ? momentum : rand(9, 25)), 12, 988);
          by = clamp(by + (ground ? rand(11, 24) : side * rand(9, 25)), 10, 696);
          fork.push([bx, by]);
        }
        forks.push({ path: toPath(fork), fine: false });
        if (forks.length < 12 && Math.random() < .38 && fork.length > 4) {
          const twig = fork[integer(2, fork.length - 2)];
          const twigPoints = [[twig[0], twig[1]]];
          let tx = twig[0], ty = twig[1];
          for (let t = 0; t < integer(2, 4); t++) {
            tx = clamp(tx + side * rand(10, 21), 8, 992);
            ty = clamp(ty + (ground ? rand(10, 19) : direction * rand(7, 15)), 8, 695);
            twigPoints.push([tx, ty]);
          }
          forks.push({ path: toPath(twigPoints), fine: true });
        }
      }
      if (ground && y >= 708) break;
      if (!ground && x >= destinationX) break;
    }
    return {
      main: toPath(points), forks,
      originX: startX, originY: Math.max(0, startY),
      impactX: x, ground
    };
  }

  function drawBolt(type) {
    if (!layer) return;
    const b = buildBolt(type);
    const svg = layer.querySelector("svg");
    svg.replaceChildren();
    // Layer the blur behind the thinner, bright discharge channel.
    svg.appendChild(svgPath(b.main, "wlfxBoltGlow"));
    b.forks.forEach(f => svg.appendChild(svgPath(f.path, f.fine ? "wlfxTwigGlow" : "wlfxBranchGlow")));
    svg.appendChild(svgPath(b.main, "wlfxBoltBody"));
    b.forks.forEach(f => svg.appendChild(svgPath(f.path, f.fine ? "wlfxTwigCore" : "wlfxBranchCore")));
    svg.appendChild(svgPath(b.main, "wlfxBoltCore"));

    const px = (b.originX / 10).toFixed(1);
    const py = (clamp(b.originY, 60, 340) / 7).toFixed(1);
    const flash = layer.querySelector(".wlfxSkyFlash");
    flash.style.background =
      "radial-gradient(ellipse 41% 50% at " + px + "% " + py +
      "%,rgba(247,251,255,.90),rgba(160,197,243,.42) 43%,transparent 100%)," +
      "radial-gradient(ellipse 88% 74% at " + px +
      "% 22%,rgba(181,207,244,.38),rgba(125,155,203,.12) 58%,transparent 95%)," +
      "linear-gradient(180deg,rgba(183,202,232,.20),rgba(111,149,197,.04))";
    const impact = layer.querySelector(".wlfxImpact");
    impact.style.left = (b.impactX / 10).toFixed(1) + "%";
    layer.classList.toggle("wlfxGround", b.ground);
    layer.classList.toggle("wlfxDistant", Math.random() < .18);
  }

  function flashOnce() {
    if (!visible()) return;
    layer.classList.remove("wlfxActive");
    // Restart all three synchronized animations for a return-stroke pulse.
    void layer.offsetWidth;
    layer.classList.add("wlfxActive");
  }
  function schedule() {
    clearTimeout(autoTimer);
    if (reduced() || !visible()) return;
    autoTimer = setTimeout(() => fire(false), rand(2200, 4900));
  }
  function fire(manual) {
    if (!visible()) return;
    const now = performance.now();
    if (!manual && now - lastStrike < 420) return;
    lastStrike = now;
    clearTimers();
    const type = Math.random() < .69 ? "ground" : "cloud";
    drawBolt(type);
    // Repeat return strokes follow exactly the same ionized channel.
    // Most lightning has one or two visible pulses; a few have three.
    const pulses = reduced() ? 1 : (Math.random() < .22 ? 3 : Math.random() < .55 ? 2 : 1);
    const delays = [0, integer(90, 145), integer(225, 310)];
    for (let i = 0; i < pulses; i++) {
      pulseTimers.push(setTimeout(flashOnce, delays[i]));
    }
    const caption = layer.querySelector(".wlfxCaption");
    if (caption) caption.textContent =
      (manual ? "Triggered • " : "Simulated • ") +
      (type === "ground" ? "cloud-to-ground discharge" : "cloud-to-cloud discharge");
    schedule();
  }
  function cleanup() {
    clearTimers();
    lastStrike = -Infinity;
    if (triggerButton) { triggerButton.remove(); triggerButton = null; }
    if (layer) { layer.remove(); layer = null; }
  }
  function open() {
    cleanup();
    if (document.hidden || view.hidden || page.hidden || visual.dataset.scene !== "lightning") return;
    layer = document.createElement("div");
    layer.className = "wlfxLayer";
    layer.setAttribute("aria-hidden", "true");
    const flash = document.createElement("div");
    flash.className = "wlfxSkyFlash";
    const impact = document.createElement("div");
    impact.className = "wlfxImpact";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 700");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "wlfxSvg");
    const caption = document.createElement("span");
    caption.className = "wlfxCaption";
    caption.textContent = reduced() ?
      "Reduced motion • use Flash Lightning" :
      "Simulated lightning • new strikes every few seconds";
    layer.append(flash, impact, svg, caption);
    visual.appendChild(layer);

    triggerButton = document.createElement("button");
    triggerButton.type = "button";
    triggerButton.className = "wlfxTrigger";
    triggerButton.textContent = "⚡ Flash Lightning";
    triggerButton.setAttribute("aria-label", "Trigger a simulated lightning strike");
    triggerButton.addEventListener("click", () => fire(true));
    visual.appendChild(triggerButton);
    if (!reduced()) autoTimer = setTimeout(() => fire(false), 700);
  }
  topic.addEventListener("click", open);
  document.querySelectorAll('[data-weather-topic]:not([data-weather-topic="lightning"])')
    .forEach(b => b.addEventListener("click", cleanup));
  document.querySelectorAll("[data-weather-open]")
    .forEach(b => b.addEventListener("click", cleanup));
  document.getElementById("wpScienceBack")?.addEventListener("click", cleanup);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimers();
      if (layer) layer.classList.remove("wlfxActive");
    } else if (visible()) schedule();
  });
  motion?.addEventListener?.("change", () => {
    clearTimers();
    if (visible() && !reduced()) schedule();
  });
})();