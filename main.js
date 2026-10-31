/* ===== The Change Makers — shared scripts (v2) ===== */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const G = window.gsap;
  const motion = !!G && !reduce;
  if (!motion) root.classList.add("no-motion");
  if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
  const ST = !!(G && window.ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (motion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.95 });
    if (ST) {
      lenis.on("scroll", ScrollTrigger.update);
      // ScrollTrigger briefly resets scroll to measure pins; tell Lenis afterwards so it never snaps back to the top
      ScrollTrigger.addEventListener("refreshInit", () => lenis.stop());
      ScrollTrigger.addEventListener("refresh", () => { lenis.resize(); lenis.start(); });
    }
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }

  /* ---------- Curtain: intro + page-to-page transitions ---------- */
  const curtain = document.querySelector(".curtain");
  const mark = curtain && curtain.querySelector(".curtain-mark");
  const intro = G ? G.timeline({ paused: true }) : null;

  function hideCurtainNow() { if (curtain) curtain.style.transform = "translateY(-101%)"; }

  if (curtain && motion) {
    intro
      .fromTo(mark, { yPercent: 40, opacity: 0, scale: 0.85 }, { yPercent: 0, opacity: 1, scale: 1, duration: 0.55, ease: "expo.out" })
      .to(mark, { yPercent: -40, opacity: 0, duration: 0.45, ease: "expo.in" }, "+=0.15")
      .to(curtain, { yPercent: -101, duration: 1, ease: "expo.inOut" }, "-=0.2");
  } else {
    hideCurtainNow();
  }

  // Leave the page: curtain slides up from the bottom, then navigate
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || !curtain || !motion) return;
    const href = a.getAttribute("href");
    if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target && lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: -90 }); }
      return;
    }
    if (!/\.html($|#)|^\/$|^\.\/?$/.test(href) || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault();
    G.timeline({ onComplete: () => (window.location.href = href) })
      .set(curtain, { yPercent: 101 })
      .to(curtain, { yPercent: 0, duration: 0.8, ease: "expo.inOut" })
      .fromTo(mark, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "expo.out" }, "-=0.25");
  });
  // Coming back with the browser's back button
  window.addEventListener("pageshow", (e) => { if (e.persisted && curtain) { G ? G.set(curtain, { yPercent: -101 }) : hideCurtainNow(); } });

  /* ---------- Nav ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.textContent = open ? "Close" : "Menu";
  });

  /* ---------- Split helpers ---------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map((w) =>
      '<span aria-hidden="true" style="display:inline-block;white-space:nowrap;perspective:900px">' +
      [...w].map((c) => '<span class="char">' + c + "</span>").join("") + "</span>").join(" ");
    return el.querySelectorAll(".char");
  }
  function splitWords(el) {
    const label = el.textContent.trim().replace(/\s+/g, " ");
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const m = document.createElement("span"); m.className = "word-mask"; m.setAttribute("aria-hidden", "true");
          const w = document.createElement("span"); w.className = "word"; w.textContent = part;
          m.appendChild(w); frag.appendChild(m);
        });
      } else {
        const m = document.createElement("span"); m.className = "word-mask"; m.setAttribute("aria-hidden", "true");
        const w = document.createElement("span"); w.className = "word"; w.appendChild(node.cloneNode(true));
        m.appendChild(w); frag.appendChild(m);
      }
    });
    el.innerHTML = ""; el.appendChild(frag); el.setAttribute("aria-label", label);
    return el.querySelectorAll(".word");
  }

  /* ---------- Hero ---------- */
  const heroTitle = document.querySelector("[data-split]");
  const heroIn = G ? G.timeline({ paused: true }) : null;
  if (heroTitle && motion) {
    const chars = splitChars(heroTitle);
    heroIn.from(chars, { yPercent: 120, rotateX: -95, opacity: 0, filter: "blur(14px)", duration: 1.3, ease: "expo.out", stagger: 0.045 })
      .from(".hero .lead, .hero .actions, .hero .countdown, .scroll-cue", { y: 40, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }, "-=0.9");
  }

  // Globe draws itself, then turns slowly
  const globe = document.querySelector(".globe svg");
  if (globe && motion) {
    const shapes = globe.querySelectorAll("ellipse, circle, line");
    shapes.forEach((s) => { const l = s.getTotalLength(); s.style.strokeDasharray = l; s.style.strokeDashoffset = l; });
    heroIn.to(shapes, { strokeDashoffset: 0, duration: 2.4, ease: "power3.inOut", stagger: 0.06 }, 0.1);
    window.__globeSpin = G.to(globe, { rotation: 360, transformOrigin: "50% 50%", duration: 160, repeat: -1, ease: "none", force3D: true });
    heroIn.eventCallback("onComplete", () => shapes.forEach((s) => { s.style.strokeDasharray = ""; s.style.strokeDashoffset = ""; }));
  }

  // Aurora color fields drift on their own
  const ambient = [];
  if (motion) document.querySelectorAll(".aurora span").forEach((s, i) => {
    ambient[ambient.length] = G.to(s, { x: () => G.utils.random(-120, 120), y: () => G.utils.random(-90, 90), scale: () => G.utils.random(0.85, 1.25),
      duration: 9 + i * 2, ease: "sine.inOut", repeat: -1, yoyo: true, repeatRefresh: true });
  });

  // Mouse parallax on the hero
  const hero = document.querySelector(".hero");
  if (hero && motion && fine) {
    const gx = globe ? G.quickTo(globe, "x", { duration: 1.4, ease: "power3" }) : null;
    const gy = globe ? G.quickTo(globe, "y", { duration: 1.4, ease: "power3" }) : null;
    const auroraEl = hero.querySelector(".aurora");
    const ax = auroraEl ? G.quickTo(auroraEl, "x", { duration: 2, ease: "power3" }) : null;
    const ay = auroraEl ? G.quickTo(auroraEl, "y", { duration: 2, ease: "power3" }) : null;
    hero.addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      if (gx) { gx(nx * 60); gy(ny * 60); }
      if (ax) { ax(nx * -80); ay(ny * -60); }
    });
  }

  // Hero title spreads and fades as you scroll away
  if (heroTitle && motion && ST) {
    G.to(heroTitle, { yPercent: -35, opacity: 0, scale: 1.04, ease: "none", force3D: true,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (document.querySelector(".globe")) G.to(".globe", { yPercent: -25, rotate: 18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // Pause the hero's looping effects while the hero is off-screen
  if (motion && ST && hero) {
    ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top",
      onToggle: (self) => {
        const list = ambient.concat(window.__globeSpin ? [window.__globeSpin] : []);
        list.forEach((t) => (self.isActive ? t.resume() : t.pause()));
      } });
  }

  // Run intro, then hero entrance
  if (motion) {
    const start = () => { intro.play(); heroIn.delay(intro.duration() - 0.75).play(); };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start);
  }

  /* ---------- Section titles: words rise from a mask ---------- */
  if (motion && ST) {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const words = splitWords(el);
      G.from(words, { yPercent: 115, rotate: 4, duration: 1.2, ease: "expo.out", stagger: 0.07,
        scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    G.utils.toArray(".lead").forEach((el) => {
      if (el.closest(".hero")) return;
      G.from(el, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
  }

  /* ---------- Marquee reacts to scroll speed and direction ---------- */
  const track = document.querySelector(".marquee-track");
  if (track && motion) {
    const loop = G.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1, force3D: true });
    loop.totalTime(loop.duration() * 50);
    let dir = 1, target = 1, current = 1;
    if (lenis) lenis.on("scroll", (e) => { if (e.direction) dir = e.direction; target = dir * (1 + Math.min(Math.abs(e.velocity) / 6, 5)); });
    G.ticker.add(() => {
      target += (dir - target) * 0.04;           // ease back to normal speed
      current += (target - current) * 0.12;      // follow smoothly
      loop.timeScale(current);
    });
    if (ST) ScrollTrigger.create({ trigger: ".marquee", start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? loop.resume() : loop.pause()) });
  }

  /* ---------- What we do rows ---------- */
  if (motion && ST && document.querySelector(".rows")) {
    G.from(".row", { x: -80, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.12,
      scrollTrigger: { trigger: ".rows", start: "top 82%" } });
  }

  /* ---------- Team portraits wipe open ---------- */
  if (motion && ST && document.querySelector(".team")) {
    G.from(".member .portrait", { clipPath: "inset(100% 0% 0% 0% round 200px 200px 18px 18px)", duration: 1.4, ease: "expo.inOut", stagger: 0.1,
      scrollTrigger: { trigger: ".team", start: "top 80%" } });
    G.from(".member h3, .member p", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.05, delay: 0.5,
      scrollTrigger: { trigger: ".team", start: "top 80%" } });
  }

  /* ---------- Committees: horizontal scroll on desktop ---------- */
  const hs = document.querySelector(".h-scroll");
  if (hs && motion && ST) {
    const mm = G.matchMedia();
    mm.add("(min-width: 900px)", () => {
      hs.classList.add("is-horizontal");
      const row = hs.querySelector(".committees");
      const dist = () => Math.max(0, row.scrollWidth - hs.querySelector(".wrap").clientWidth + 60);
      const t = G.to(row, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: hs, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
      G.from(row.children, { y: 80, opacity: 0, rotate: 3, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: hs, start: "top 70%" } });
      return () => { hs.classList.remove("is-horizontal"); t.kill(); };
    });
    mm.add("(max-width: 899px)", () => {
      G.from(".committee", { y: 60, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".committees", start: "top 85%" } });
    });
  }

  /* ---------- Schedule line fills as you scroll ---------- */
  if (motion && ST) document.querySelectorAll(".day").forEach((day) => {
    G.to(day.querySelector(".tl-fill"), { scaleY: 1, ease: "none", scrollTrigger: { trigger: day, start: "top 75%", end: "bottom 60%", scrub: true } });
    G.from(day.querySelectorAll("li"), { x: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: day, start: "top 78%" } });
  });

  /* ---------- Registration cards rise with depth ---------- */
  if (motion && ST) G.utils.toArray(".role, .feature").forEach((card) => {
    G.from(card, { y: 120, rotateX: 10, opacity: 0, transformPerspective: 1200, transformOrigin: "50% 100%", duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: card, start: "top 88%" } });
  });

  /* ---------- FAQ opens smoothly ---------- */
  document.querySelectorAll(".faq details").forEach((d) => {
    const summary = d.querySelector("summary");
    const body = d.querySelector(".answer");
    if (!body || !motion) return;
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.open) {
        G.to(body, { height: 0, opacity: 0, duration: 0.5, ease: "expo.inOut", onComplete: () => { d.open = false; body.style.height = ""; ScrollTrigger && ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        G.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.6, ease: "expo.out", onComplete: () => ScrollTrigger && ScrollTrigger.refresh() });
      }
    });
  });

  /* ---------- Spotlight + tilt cards ---------- */
  document.querySelectorAll(".spot").forEach((card) => {
    const max = card.classList.contains("committee") ? 7 : 3;
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (motion && fine) G.to(card, { rotateY: (x / r.width - 0.5) * max * 2, rotateX: -(y / r.height - 0.5) * max * 2, transformPerspective: 1000, duration: 0.6, ease: "power3.out" });
    });
    card.addEventListener("mouseleave", () => { if (motion) G.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1,0.5)" }); });
  });

  /* ---------- Magnetic buttons ---------- */
  if (motion && fine) document.querySelectorAll(".btn, .mark").forEach((el) => {
    const xTo = G.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = G.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener("mouseleave", () => { G.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.4)" }); });
  });

  /* ---------- Custom cursor ---------- */
  const ring = document.querySelector(".cursor"), dot = document.querySelector(".cursor-dot");
  if (ring && dot && motion && fine) {
    root.classList.add("has-cursor");
    const rx = G.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = G.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const dx = G.quickTo(dot, "x", { duration: 0.08 }), dy = G.quickTo(dot, "y", { duration: 0.08 });
    window.addEventListener("mousemove", (e) => { ring.classList.add("on"); dot.classList.add("on"); rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
    document.addEventListener("mouseover", (e) => ring.classList.toggle("hover", !!e.target.closest("a, button, summary, .row, .committee")));
  }

  /* ---------- Scroll progress bar ---------- */
  if (motion && ST && document.querySelector(".progress")) {
    G.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  }

  /* ---------- Footer wordmark rises ---------- */
  if (motion && ST && document.querySelector(".wordmark")) {
    G.from(".wordmark", { yPercent: 60, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: "footer", start: "top 90%" } });
  }

  /* ---------- Countdowns ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const countdowns = [...document.querySelectorAll("[data-countdown]")];
  function render(el) {
    const left = Math.max(0, new Date(el.dataset.countdown).getTime() - Date.now());
    const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    el.innerHTML = "<div><b>" + d + "</b><small>days</small></div><div><b>" + pad(h) + "</b><small>hours</small></div>" +
      "<div><b>" + pad(m) + "</b><small>minutes</small></div><div><b>" + pad(s) + "</b><small>seconds</small></div>";
  }
  if (countdowns.length) { const tick = () => countdowns.forEach(render); tick(); setInterval(tick, 1000); }

  /* ---------- Registration status from data-deadline ---------- */
  document.querySelectorAll("[data-deadline]").forEach((role) => {
    const left = new Date(role.dataset.deadline).getTime() - Date.now();
    const status = role.querySelector(".status"), btn = role.querySelector(".apply"), cd = role.querySelector(".countdown");
    if (left <= 0) {
      status.textContent = "Applications closed"; status.classList.add("closed");
      if (btn) { btn.setAttribute("aria-disabled", "true"); btn.textContent = "Applications closed"; btn.removeAttribute("href"); }
      if (cd) cd.remove();
    } else status.textContent = left < 7 * 864e5 ? "Closing soon" : "Applications open";
  });
  document.querySelectorAll(".apply").forEach((btn) => btn.addEventListener("click", (e) => {
    if (btn.getAttribute("href") === "#") {
      e.preventDefault();
      const note = btn.parentElement.querySelector(".form-note");
      if (note) note.textContent = "The application form opens soon. Check back shortly.";
    }
  }));

  /* ---------- Footer wordmark fills the width exactly ---------- */
  const wm = document.querySelector(".wordmark");
  function fitWordmark() {
    if (!wm) return;
    wm.style.fontSize = "";
    const size = parseFloat(getComputedStyle(wm).fontSize);
    const pcs = getComputedStyle(wm.parentElement);
    const avail = wm.parentElement.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
    wm.style.fontSize = (size * avail / wm.scrollWidth) * 0.99 + "px";
  }
  fitWordmark();
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(fitWordmark, 150); });

  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
  // Recalculate scroll positions once, after fonts and the footer size are final
  if (ST) {
    let done = false;
    const finalRefresh = () => { if (done) return; done = true; fitWordmark(); ScrollTrigger.refresh(); };
    Promise.all([document.fonts ? document.fonts.ready : null, new Promise((r) => document.readyState === "complete" ? r() : window.addEventListener("load", r))])
      .then(finalRefresh);
  }
})();
