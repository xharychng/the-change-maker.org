/* ===== The Change Makers — shared scripts ===== */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  /* --- Smooth scrolling (Lenis) --- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGSAP && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* --- Nav: background on scroll + mobile menu --- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      menuBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* --- Hero: letters rise in one by one (React Bits "split text" style) --- */
  const title = document.querySelector("[data-split]");
  if (title && hasGSAP && !reduce) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute("aria-label", title.textContent.trim());
    title.innerHTML = words
      .map((w) => '<span aria-hidden="true" style="display:inline-block;white-space:nowrap">' +
        [...w].map((c) => '<span class="char">' + c + "</span>").join("") + "</span>")
      .join(" ");
    gsap.from(title.querySelectorAll(".char"), {
      yPercent: 110, opacity: 0, rotate: 6, duration: 1, ease: "expo.out", stagger: 0.035, delay: 0.15,
    });
    gsap.from(".hero .lead, .hero .actions, .hero .countdown", {
      y: 24, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.7,
    });
  }

  /* --- Globe: slow turn, plus a little drift on scroll --- */
  const globe = document.querySelector(".globe svg");
  if (globe && hasGSAP && !reduce) {
    gsap.to(globe.querySelector(".spin"), { rotate: 360, transformOrigin: "50% 50%", duration: 140, repeat: -1, ease: "none" });
    gsap.from(globe, { opacity: 0, scale: 0.9, duration: 2.2, ease: "power2.out" });
    if (window.ScrollTrigger) {
      gsap.to(".globe", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
  }

  /* --- Countdowns: <div class="countdown" data-countdown="2027-03-20T08:00:00+08:00"> --- */
  const pad = (n) => String(n).padStart(2, "0");
  function renderCountdown(el) {
    const end = new Date(el.dataset.countdown).getTime();
    const left = Math.max(0, end - Date.now());
    const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24,
          m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    el.innerHTML =
      "<div><b>" + d + "</b><small>days</small></div>" +
      "<div><b>" + pad(h) + "</b><small>hours</small></div>" +
      "<div><b>" + pad(m) + "</b><small>minutes</small></div>" +
      "<div><b>" + pad(s) + "</b><small>seconds</small></div>";
    return left;
  }
  const countdowns = [...document.querySelectorAll("[data-countdown]")];
  if (countdowns.length) {
    const tick = () => countdowns.forEach(renderCountdown);
    tick();
    setInterval(tick, 1000);
  }

  /* --- Registration: open / closing soon / closed, from data-deadline --- */
  document.querySelectorAll("[data-deadline]").forEach((role) => {
    const end = new Date(role.dataset.deadline).getTime();
    const left = end - Date.now();
    const status = role.querySelector(".status");
    const btn = role.querySelector(".apply");
    const cd = role.querySelector(".countdown");
    if (left <= 0) {
      status.textContent = "Applications closed";
      status.classList.add("closed");
      if (btn) { btn.setAttribute("aria-disabled", "true"); btn.textContent = "Applications closed"; btn.removeAttribute("href"); }
      if (cd) cd.remove();
    } else if (left < 7 * 864e5) {
      status.textContent = "Closing soon";
    } else {
      status.textContent = "Applications open";
    }
  });

  /* Form buttons whose Google Form link hasn't been added yet */
  document.querySelectorAll(".apply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (btn.getAttribute("href") === "#") {
        e.preventDefault();
        const note = btn.parentElement.querySelector(".form-note");
        if (note) note.textContent = "The application form opens soon. Check back shortly.";
      }
    });
  });

  /* --- One quiet reveal for section headings --- */
  if (hasGSAP && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
  }

  /* --- Footer year --- */
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
