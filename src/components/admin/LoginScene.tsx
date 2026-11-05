"use client";

import { useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(admin)/actions";

type Props = { error?: string | null };

/**
 * Watercolor "Fox & Butterfly" login (user-supplied design, adapted from
 * Fox & Butterfly Login.html). A hand-drawn fox dozes beside the glass
 * card while a butterfly flutters after the pointer with spring physics:
 * it lands on the username field and follows the caret while typing, then
 * settles beside the fox when the password field sends him to sleep.
 * Body-class scoping keeps the CSS isolated to this screen. The card
 * submits to the real loginAction.
 */
export function LoginScene({ error }: Props) {
  useEffect(() => {
    document.body.classList.add("login-scene");
    const $ = <T extends Element>(id: string) =>
      document.getElementById(id) as T | null;
    const u = $<HTMLInputElement>("u");
    const p = $<HTMLInputElement>("p");
    const bf = $<HTMLElement>("bf");
    const fox = $<HTMLElement>("fox");
    const foxSvg = $<SVGSVGElement>("foxsvg");
    const head = $<SVGGElement>("head");
    const eL = $<SVGGElement>("eL");
    const eR = $<SVGGElement>("eR");
    const grass = $<SVGSVGElement>("grass");
    if (!u || !p || !bf || !fox || !foxSvg || !head || !eL || !eR) {
      return () => document.body.classList.remove("login-scene");
    }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // ---- meadow grass + pollen (generated, deterministic per mount) ----
    if (grass) {
      const NS = "http://www.w3.org/2000/svg";
      const mk = (n: string, a: Record<string, string | number>) => {
        const e = document.createElementNS(NS, n);
        for (const k in a) e.setAttribute(k, String(a[k]));
        return e;
      };
      const greens = ["#7fa497", "#9bb9a8", "#6f938a", "#a9c3a4"];
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * 1000, h = 40 + Math.random() * 120;
        const b = (Math.random() - 0.5) * 50;
        const w = mk("path", {
          d: `M${x} 205Q${x + b / 2} ${205 - h / 2} ${x + b} ${205 - h}`,
          stroke: greens[i % 4],
          "stroke-width": 2 + Math.random() * 2.5,
          opacity: 0.45 + Math.random() * 0.35,
        });
        w.style.animationDuration = 3 + Math.random() * 3 + "s";
        w.style.animationDelay = -Math.random() * 4 + "s";
        grass.appendChild(w);
      }
      for (let i = 0; i < 9; i++) {
        const fx = Math.random() * 1000, fh = 60 + Math.random() * 60;
        const stem = mk("path", {
          d: `M${fx} 205Q${fx} ${205 - fh / 2} ${fx} ${205 - fh}`,
          stroke: "#8fae9c", "stroke-width": 1.6, fill: "none", opacity: 0.6,
        });
        stem.style.animation = "none";
        grass.appendChild(stem);
        grass.appendChild(mk("ellipse", {
          cx: fx, cy: 205 - fh, rx: 7, ry: 5,
          fill: i % 2 ? "#fff8ee" : "#f6cfae", opacity: 0.9,
        }));
      }
    }
    const pollen: HTMLElement[] = [];
    if (!reduced) {
      for (let i = 0; i < 16; i++) {
        const s = document.createElement("i");
        s.className = "pol";
        const sz = 3 + Math.random() * 4;
        s.style.cssText =
          "left:" + Math.random() * 100 + "%;width:" + sz + "px;height:" + sz + "px;" +
          "animation-duration:" + (14 + Math.random() * 14) + "s;" +
          "animation-delay:" + -Math.random() * 20 + "s";
        document.body.appendChild(s);
        pollen.push(s);
      }
    }

    // ---- behaviour state --------------------------------------------------
    let mode: "follow" | "user" | "pass" = "follow";
    const mouse = { x: innerWidth * 0.35, y: innerHeight * 0.3 };
    const pos = { x: -100, y: 140 };
    const vel = { x: 0, y: 0 };
    let perched = false, rot = 0, sleepT = 0, hy = 0, hr = 0;
    const pl = { x: 0, y: 0 };
    let t = 0, hop = 0;
    let last = performance.now();
    let raf = 0;
    const meas = document.createElement("canvas").getContext("2d");

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY };
    addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => removeEventListener("pointermove", onMove));

    const set = (m: "follow" | "user" | "pass") => {
      mode = m;
      foxSvg.classList.toggle("sleep", m === "pass");
    };
    const check = () =>
      setTimeout(() => {
        const a = document.activeElement;
        set(a === u ? "user" : a === p ? "pass" : "follow");
      }, 40);
    const onUFocus = () => set("user");
    const onPFocus = () => set("pass");
    const onUBlur = check, onPBlur = check;
    const onInput = () => { hop = 1 };
    u.addEventListener("focus", onUFocus);
    p.addEventListener("focus", onPFocus);
    u.addEventListener("blur", onUBlur);
    p.addEventListener("blur", onPBlur);
    u.addEventListener("input", onInput);
    cleanups.push(() => {
      u.removeEventListener("focus", onUFocus);
      p.removeEventListener("focus", onPFocus);
      u.removeEventListener("blur", onUBlur);
      p.removeEventListener("blur", onPBlur);
      u.removeEventListener("input", onInput);
    });

    const blinkTimer = setInterval(() => {
      if (mode !== "pass") {
        foxSvg.classList.add("blink");
        setTimeout(() => foxSvg.classList.remove("blink"), 150);
      }
    }, 3400);
    cleanups.push(() => clearInterval(blinkTimer));

    function caret(): { x: number; y: number } {
      const r = u!.getBoundingClientRect();
      const cs = getComputedStyle(u!);
      const upto = (() => {
        try {
          const s = u!.selectionStart;
          return s == null ? u!.value.length : s;
        } catch {
          return u!.value.length; // some input types disallow selection APIs
        }
      })();
      if (meas) meas.font = cs.font;
      const w = meas ? meas.measureText(u!.value.slice(0, upto)).width : 0;
      const x = u!.value
        ? r.left + parseFloat(cs.paddingLeft) + w - u!.scrollLeft
        : r.left + 46;
      return { x: clamp(x, r.left + 30, r.right - 30), y: r.top - 12 };
    }

    function target(): { x: number; y: number } {
      if (mode === "user") return caret();
      if (mode === "pass") {
        const r = fox!.getBoundingClientRect();
        return { x: Math.max(50, r.left + r.width * 0.16), y: r.bottom - 34 };
      }
      return { x: mouse.x + 30, y: mouse.y - 30 };
    }

    function frame(now: number): void {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const tg = target();
      const dx = tg.x - pos.x, dy = tg.y - pos.y;
      const d = Math.hypot(dx, dy), sp = Math.hypot(vel.x, vel.y);
      if (mode === "follow") perched = false;
      else if (perched) { if (d > 30) perched = false; }
      else if (d < 8 && sp < 50) perched = true;
      const k = perched ? 80 : 13, c = perched ? 16 : 4.2;
      const jitter = reduced ? 0.25 : 1;
      const nx = (perched ? 0 : Math.sin(t * 2.1) * 11 + Math.sin(t * 5.3) * 4) * jitter;
      const ny = (perched ? 0 : Math.cos(t * 2.7) * 13 + Math.sin(t * 4.1) * 4) * jitter;
      vel.x += ((tg.x + nx - pos.x) * k - vel.x * c) * dt;
      vel.y += ((tg.y + ny - pos.y) * k - vel.y * c) * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      hop += (0 - hop) * dt * 8;
      const lean = perched ? 0 : clamp(vel.x * 0.09, -34, 34) + Math.sin(t * 5) * 6;
      rot += (lean - rot) * Math.min(1, dt * 7);
      const lift = perched ? -Math.min(d * 0.4, 7) - hop * 3 : 0;
      bf!.style.transform =
        "translate(" + (pos.x - 42).toFixed(1) + "px," + (pos.y - 42 + lift).toFixed(1) + "px)" +
        " rotate(" + rot.toFixed(1) + "deg)";
      bf!.classList.toggle("rest", perched);
      bf!.style.setProperty("--flap", clamp(0.36 - sp * 0.0005, 0.16, 0.36).toFixed(3) + "s");

      // Fox watches the butterfly (eyes track, head tilts; asleep on password).
      const hb = head!.getBoundingClientRect();
      const hx = hb.left + hb.width / 2, hcy = hb.top + hb.height / 2;
      const bx = pos.x - hx, by = pos.y - hcy;
      const bd = Math.hypot(bx, by) || 1;
      const m = Math.min(1, bd / 140) * 6;
      const lk = sleepT > 0.5 ? 0 : 1;
      pl.x += ((bx / bd) * m * lk - pl.x) * Math.min(1, dt * 10);
      pl.y += ((by / bd) * m * lk - pl.y) * Math.min(1, dt * 10);
      [eL!, eR!].forEach((e) => {
        const pu = e.querySelector(".pu") as SVGGElement | null;
        if (pu) pu.style.transform =
          "translate(" + pl.x.toFixed(2) + "px," + pl.y.toFixed(2) + "px)";
      });
      sleepT += ((mode === "pass" ? 1 : 0) - sleepT) * Math.min(1, dt * 3);
      const thr = clamp(bx / 28, -10, 10) * (1 - sleepT) - 5 * sleepT;
      const thy = clamp(by / 38, -7, 4) * (1 - sleepT) + 20 * sleepT;
      hr += (thr - hr) * Math.min(1, dt * 5);
      hy += (thy - hy) * Math.min(1, dt * 5);
      head!.setAttribute(
        "transform",
        "translate(0 " + hy.toFixed(1) + ") rotate(" + hr.toFixed(1) + " 120 170)",
      );
    }

    if (reduced) {
      // Honour stillness preferences for decorative motion (CSS loops are
      // already gated by the media query, pollen skipped above) but keep
      // the functional flight: caret-following and perch feedback stay,
      // with damped jitter.
      pos.x = innerWidth * 0.4;
      pos.y = innerHeight * 0.32;
      bf.style.transform = "translate(" + (pos.x - 42) + "px," + (pos.y - 42) + "px)";
      bf.classList.add("rest");
    }
    raf = requestAnimationFrame(frame);
    cleanups.push(() => cancelAnimationFrame(raf));

    return () => {
      for (const fn of cleanups) fn();
      for (const s of pollen) s.remove();
      document.body.classList.remove("login-scene");
    };
  }, []);

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <svg id="grass" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true" />

      {/* watercolor edge-wobble filters shared by fox and butterfly */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="wc" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={4.5} />
          </filter>
          <filter id="wc2" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={9} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3} />
          </filter>
        </defs>
      </svg>

      <main className="stage">
        <form className="card" action={loginAction} autoComplete="on">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue.</p>
          {error ? <p className="err" role="alert">{error}</p> : null}
          <label htmlFor="u">Username or email</label>
          <input
            id="u"
            name="email"
            type="text"
            inputMode="email"
            placeholder="Username/Email"
            autoComplete="email"
            spellCheck={false}
            required
          />
          <label htmlFor="p">Password</label>
          <input
            id="p"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <button type="submit">Sign in</button>
        </form>
        <Link className="backlink" href="/">← Back to site</Link>
      </main>

      <div className="fox" id="fox" aria-hidden="true">
        <svg id="foxsvg" viewBox="0 0 240 240" aria-hidden="true">
          <defs>
            <radialGradient id="og" cx="0.4" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#f7a455" />
              <stop offset="0.6" stopColor="#e8742a" />
              <stop offset="1" stopColor="#bf5318" />
            </radialGradient>
            <radialGradient id="iris" cx="0.5" cy="0.4" r="0.7">
              <stop offset="0" stopColor="#9fd3e8" />
              <stop offset="1" stopColor="#3f7fa8" />
            </radialGradient>
            <path id="tailp" d="M158 208C232 216 254 152 228 114C222 150 196 172 156 168Z" />
            <clipPath id="tc"><use href="#tailp" /></clipPath>
          </defs>
          <ellipse cx="120" cy="236" rx="90" ry="8" fill="#7a9a92" opacity="0.3" />
          <g filter="url(#wc)">
            <g className="tail">
              <use href="#tailp" fill="url(#og)" />
              <ellipse cx="238" cy="124" rx="24" ry="32" fill="#fffaf2" clipPath="url(#tc)" />
            </g>
          </g>
          <g className="breath" filter="url(#wc)">
            <ellipse cx="120" cy="192" rx="54" ry="42" fill="url(#og)" />
            <ellipse cx="96" cy="190" rx="20" ry="26" fill="#bf5318" opacity="0.25" />
            <ellipse cx="120" cy="204" rx="28" ry="31" fill="#fffaf2" />
            <path d="M88 204Q86 226 91 232H110Q113 220 108 204Z" fill="#2f3a4a" />
            <path d="M132 204Q127 220 130 232H149Q154 226 152 204Z" fill="#2f3a4a" />
          </g>
          <g id="head">
            <g filter="url(#wc)">
              <path d="M66 104L56 42L108 80Z" fill="url(#og)" />
              <path d="M72 94L66 58L96 80Z" fill="#2f3a4a" />
              <path d="M174 104L184 42L132 80Z" fill="url(#og)" />
              <path d="M168 94L174 58L144 80Z" fill="#2f3a4a" />
              <ellipse cx="120" cy="128" rx="64" ry="48" fill="url(#og)" />
              <ellipse cx="90" cy="104" rx="22" ry="12" fill="#bf5318" opacity="0.22" />
              <ellipse cx="150" cy="106" rx="20" ry="10" fill="#fff" opacity="0.18" />
              <path d="M54 138Q90 124 120 154Q150 124 186 138Q164 184 120 184Q76 184 54 138Z" fill="#fffaf2" />
              <g id="eL">
                <circle cx="94" cy="128" r="15" fill="#fff" />
                <g className="pu">
                  <circle cx="94" cy="128" r="12.5" fill="url(#iris)" />
                  <circle cx="94" cy="129" r="6.5" fill="#0f2238" />
                  <circle cx="98" cy="124" r="3" fill="#fff" />
                </g>
              </g>
              <g id="eR">
                <circle cx="146" cy="128" r="15" fill="#fff" />
                <g className="pu">
                  <circle cx="146" cy="128" r="12.5" fill="url(#iris)" />
                  <circle cx="146" cy="129" r="6.5" fill="#0f2238" />
                  <circle cx="150" cy="124" r="3" fill="#fff" />
                </g>
              </g>
              <ellipse className="lid l" cx="94" cy="128" rx="17" ry="17" fill="#ee7d30" />
              <ellipse className="lid r" cx="146" cy="128" rx="17" ry="17" fill="#ee7d30" />
              <path
                className="closed"
                d="M82 130Q94 138 106 130M134 130Q146 138 158 130"
                fill="none"
                stroke="#5a2a14"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <ellipse cx="120" cy="154" rx="6.5" ry="4.5" fill="#1d2430" />
              <path
                d="M120 158Q114 166 107 162M120 158Q126 166 133 162"
                fill="none"
                stroke="#7a4a30"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
          <text className="zz z1" x="190" y="88">z</text>
          <text className="zz z2" x="206" y="64">Z</text>
        </svg>
      </div>

      <div className="bf" id="bf" aria-hidden="true">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="wg" cx="0.9" cy="0.9" r="1">
              <stop offset="0" stopColor="#ffc678" />
              <stop offset="0.7" stopColor="#f28a30" />
              <stop offset="1" stopColor="#d9631a" />
            </radialGradient>
            <g id="wl">
              <path d="M58 56C50 30 28 8 12 16C4 34 20 56 58 62Z" fill="url(#wg)" stroke="#d9731f" strokeWidth="1" />
              <path d="M58 62C36 62 16 70 22 90C38 98 54 82 58 68Z" fill="#f7b061" stroke="#d9731f" strokeWidth="1" />
              <g fill="#fffaf0" opacity="0.95">
                <circle cx="20" cy="24" r="2.6" />
                <circle cx="16" cy="34" r="2.2" />
                <circle cx="27" cy="19" r="2" />
                <circle cx="26" cy="86" r="2.2" />
                <circle cx="34" cy="90" r="1.8" />
              </g>
            </g>
          </defs>
          <g filter="url(#wc2)">
            <g className="wings" opacity="0.95">
              <use href="#wl" />
              <use href="#wl" transform="translate(120 0) scale(-1 1)" />
            </g>
          </g>
          <g stroke="#2a2f3a" strokeWidth="1.3" fill="none" strokeLinecap="round">
            <path d="M58 42Q52 28 42 22M62 42Q68 28 78 22" />
          </g>
          <ellipse cx="60" cy="64" rx="3.6" ry="19" fill="#2a2f3a" />
          <circle cx="60" cy="44" r="4.3" fill="#2a2f3a" />
        </svg>
      </div>
    </>
  );
}
