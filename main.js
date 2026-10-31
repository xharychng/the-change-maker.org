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

  /* ---------- Committees: same reveal as the team grid ---------- */
  if (motion && ST && document.querySelector(".committees")) {
    G.from(".committee", { clipPath: "inset(100% 0% 0% 0% round 26px)", duration: 1.4, ease: "expo.inOut", stagger: 0.1,
      scrollTrigger: { trigger: ".committees", start: "top 80%" } });
    G.from(".committee .abbr, .committee h3, .committee p", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.05, delay: 0.5,
      scrollTrigger: { trigger: ".committees", start: "top 80%" } });
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

  /* ---------- Registration status: opens → (regular → late) → closed ---------- */
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "Asia/Taipei" });
  function updateRoles() {
    const now = Date.now();
    document.querySelectorAll("[data-deadline]").forEach((role) => {
      const status = role.querySelector(".status"), btn = role.querySelector(".apply"),
            cd = role.querySelector(".countdown"), label = role.querySelector(".phase-label");
      const opens = role.dataset.opens ? new Date(role.dataset.opens) : null;
      const regular = role.dataset.regular ? new Date(role.dataset.regular) : null;
      const end = new Date(role.dataset.deadline);
      if (btn && !btn.dataset.label) btn.dataset.label = btn.textContent;
      const setBtn = (enabled, text) => {
        if (!btn) return;
        btn.disabled = !enabled;
        if (enabled) btn.removeAttribute("aria-disabled"); else btn.setAttribute("aria-disabled", "true");
        btn.textContent = text || btn.dataset.label;
      };
      const setCountdown = (iso) => { if (cd && cd.dataset.countdown !== iso) { cd.dataset.countdown = iso; render(cd); } };
      const setLabel = (html) => { if (label) label.innerHTML = html; };
      status.classList.remove("closed");
      cd && (cd.hidden = false);

      if (opens && now < opens) {
        status.textContent = "Opens " + fmt(opens);
        setLabel("Registration opens in");
        setCountdown(role.dataset.opens);
        setBtn(false, "Opens " + fmt(opens));
      } else if (now >= end) {
        status.textContent = "Applications closed"; status.classList.add("closed");
        setLabel(""); if (cd) cd.hidden = true;
        setBtn(false, "Applications closed");
      } else if (regular && now < regular) {
        status.textContent = (regular - now < 7 * 864e5) ? "Regular registration closing soon" : "Regular registration open";
        setLabel("Regular registration closes in");
        setCountdown(role.dataset.regular);
        setBtn(true);
      } else if (regular) {
        status.textContent = "Late registration open";
        setLabel("Late registration closes in");
        setCountdown(role.dataset.deadline);
        setBtn(true, "Register late as a delegate");
      } else {
        status.textContent = (end - now < 7 * 864e5) ? "Closing soon" : "Applications open";
        setBtn(true);
      }
    });
  }
  updateRoles();
  setInterval(updateRoles, 30000);

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

  /* ---------- Pop-ups (committee details + application forms) ---------- */
  const modal = document.querySelector(".modal");
  if (modal) {
    const panel = modal.querySelector(".modal-panel"), scroller = modal.querySelector(".modal-scroll"), body = modal.querySelector(".modal-body"), backdrop = modal.querySelector(".modal-backdrop");
    let lastOrigin = null, closing = false;

    const openModal = (fragment, origin) => {
      lastOrigin = origin;
      body.innerHTML = "";
      body.appendChild(fragment);
      const title = body.querySelector(".m-name"); if (title) title.id = "modal-title";
      body.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
      modal.hidden = false; root.classList.add("modal-open"); if (lenis) lenis.stop();
      scroller.scrollTop = 0; panel.focus();
      if (motion) {
        const r = origin.getBoundingClientRect(), pr = panel.getBoundingClientRect();
        G.timeline()
          .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0)
          .fromTo(panel, { x: r.left + r.width / 2 - (pr.left + pr.width / 2), y: r.top + r.height / 2 - (pr.top + pr.height / 2), scale: Math.max(0.3, Math.min(1, r.width / pr.width)), opacity: 0 },
            { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" }, 0)
          .from(body.querySelectorAll(":scope > *, .field, .consent"), { y: 24, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.03 }, 0.25);
      }
    };
    const closeModal = () => {
      if (modal.hidden || closing) return;
      const done = () => { modal.hidden = true; closing = false; root.classList.remove("modal-open"); if (lenis) lenis.start(); if (lastOrigin) lastOrigin.focus({ preventScroll: true }); };
      if (!motion) return done();
      closing = true;
      G.timeline({ onComplete: done })
        .to(panel, { y: 40, scale: 0.94, opacity: 0, duration: 0.4, ease: "power3.in" }, 0)
        .to(backdrop, { opacity: 0, duration: 0.45, ease: "power2.in" }, 0.05);
    };
    modal.querySelectorAll(":scope > [data-close], .modal-close").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") { // keep keyboard focus inside the pop-up
        const f = [...panel.querySelectorAll("a[href], button:not([disabled]), input:not([type=hidden]):not([tabindex='-1']), select, textarea")].filter((el) => el.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    /* Committee cards */
    document.querySelectorAll(".committee").forEach((card) => {
      const show = () => {
        const frag = card.querySelector("template.committee-details").content.cloneNode(true);
        frag.querySelectorAll("[data-guide]").forEach((g) => g.addEventListener("click", (e) => {
          if (g.getAttribute("href") === "#") { e.preventDefault(); g.textContent = "Background guide coming soon"; }
        }));
        openModal(frag, card);
      };
      card.addEventListener("click", show);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
    });

    /* Application forms */
    const store = {
      get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
      del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    };
    document.querySelectorAll("[data-form]").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const role = btn.dataset.form, key = "cm-draft-" + role;
      const frag = document.getElementById("form-" + role).content.cloneNode(true);
      const form = frag.querySelector("form"), done = frag.querySelector(".form-done"), err = frag.querySelector(".form-error");

      // Restore and keep a draft on this device
      const draft = store.get(key);
      if (draft) Object.entries(draft).forEach(([n, v]) => { const el = form.elements[n]; if (el && el.type !== "hidden" && el.type !== "checkbox") el.value = v; });
      form.addEventListener("input", () => {
        const d = {}; [...form.elements].forEach((el) => { if (el.name && el.type !== "hidden" && el.type !== "checkbox" && el.name !== "website") d[el.name] = el.value; });
        store.set(key, d);
      });
      form.addEventListener("input", (e) => { e.target.classList.remove("invalid"); if (e.target.type === "checkbox") e.target.parentElement.classList.remove("invalid"); });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.hidden = true;
        const bad = [...form.querySelectorAll("input, select, textarea")].filter((el) => !el.checkValidity());
        form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
        if (bad.length) {
          bad.forEach((el) => (el.type === "checkbox" ? el.parentElement : el).classList.add("invalid"));
          const first = bad[0];
          err.textContent = first.type === "checkbox" ? "Tick the confirmation box to submit."
            : first.type === "email" && first.value ? "Enter a valid email address, like name@example.com."
            : "Fill in the highlighted fields to submit.";
          err.hidden = false; first.focus();
          return;
        }
        const url = window.CM_FORM_ENDPOINT;
        if (!url) { err.textContent = "Applications aren't connected yet. Please check back soon."; err.hidden = false; return; }
        const submit = form.querySelector("[type=submit]");
        submit.disabled = true; submit.textContent = "Submitting…";
        try {
          const res = await fetch(url, { method: "POST", body: new URLSearchParams(new FormData(form)) });
          const data = await res.json().catch(() => ({ ok: res.ok }));
          if (!data.ok) throw new Error(data.error || "Submission failed");
          store.del(key);
          done.querySelector("[data-name]").textContent = form.elements["Full name"].value.split(" ")[0];
          done.querySelector("[data-email]").textContent = form.elements["Email"].value;
          form.hidden = true; done.hidden = false; scroller.scrollTop = 0;
          if (motion) {
            const path = done.querySelector(".check path"), circ = done.querySelector(".check circle");
            [path, circ].forEach((s) => { const l = s.getTotalLength(); s.style.strokeDasharray = l; s.style.strokeDashoffset = l; });
            G.timeline().to(circ, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" })
              .to(path, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, "-=0.2")
              .from(done.querySelectorAll("h2, p, .m-actions"), { y: 16, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out" }, "-=0.3");
          }
          done.querySelector("[data-close]").focus();
        } catch (ex) {
          err.textContent = "Your application couldn't be sent. Check your connection and try again; your answers are still here.";
          err.hidden = false;
          submit.disabled = false; submit.textContent = "Submit application";
        }
      });
      openModal(frag, btn);
    }));
  }

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
