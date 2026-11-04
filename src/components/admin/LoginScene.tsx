"use client";

import { useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(admin)/actions";

type Props = { error?: string | null };

/**
 * "Fox & Hummingbird" login scene (user-supplied design), ported verbatim
 * from the standalone HTML into React. The card submits to the real
 * loginAction (demo handler removed). Body class scoping keeps the scene's
 * CSS isolated to this screen.
 */
export function LoginScene({ error }: Props) {
  useEffect(() => {
    document.body.classList.add("login-scene");
    const $ = <T extends Element>(id: string) =>
      document.getElementById(id) as T | null;

    const u = $<HTMLInputElement>("u");
    const p = $<HTMLInputElement>("p");
    const bird = $<HTMLDivElement>("bird");
    const birdSvg = bird?.firstElementChild as SVGSVGElement | null;
    const fox = $<HTMLDivElement>("fox");
    const foxSvg = $<SVGSVGElement>("foxsvg");
    const head = $<SVGGElement>("head");
    const eL = $<SVGGElement>("eL");
    const eR = $<SVGGElement>("eR");
    const cv = $<HTMLCanvasElement>("trail");
    if (!u || !p || !bird || !birdSvg || !fox || !foxSvg || !head || !eL || !eR || !cv) {
      return () => document.body.classList.remove("login-scene");
    }
    const cx = cv.getContext("2d");
    if (!cx) return () => document.body.classList.remove("login-scene");

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Perch side beside the fox on the desk: -1 = screen-left, 1 = screen-right
    const PERCH_SIDE = -1;
    let mode: "follow" | "user" | "pass" = "follow";
    const mouse = { x: innerWidth * 0.3, y: innerHeight * 0.3 };
    const pos = { x: -120, y: 120 };
    const vel = { x: 0, y: 0 };
    let perched = false, face = 1, rot = 0, sleepT = 0;
    let hy = 0, hr = 0;
    const pl = { x: 0, y: 0 };
    let t = 0, hop = 0, last = performance.now();
    const trail: { x: number; y: number }[] = [];
    const meas = document.createElement("canvas").getContext("2d");

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const size = () => { cv.width = innerWidth; cv.height = innerHeight };
    size();

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("resize", size);

    const set = (m: "follow" | "user" | "pass") => {
      mode = m;
      foxSvg.classList.toggle("sleep", m === "pass");
    };
    const check = () =>
      setTimeout(() => {
        const a = document.activeElement;
        set(a === u ? "user" : a === p ? "pass" : "follow");
      }, 40);
    u.addEventListener("focus", () => set("user"));
    p.addEventListener("focus", () => set("pass"));
    u.addEventListener("blur", check);
    p.addEventListener("blur", check);
    u.addEventListener("input", () => { hop = 1 });

    const blinkTimer = setInterval(() => {
      if (mode !== "pass") {
        foxSvg.classList.add("blink");
        setTimeout(() => foxSvg.classList.remove("blink"), 140);
      }
    }, 3200);

    const caret = () => {
      const r = u.getBoundingClientRect();
      const cs = getComputedStyle(u);
      if (meas) meas.font = cs.font;
      const w = meas
        ? meas.measureText(u.value.slice(0, u.selectionStart ?? u.value.length)).width
        : 0;
      const x = r.left + parseFloat(cs.paddingLeft) + w - u.scrollLeft;
      if (!u.value) return { x: r.left + 46, y: r.top - 19 };
      return { x: clamp(x, r.left + 30, r.right - 30), y: r.top - 19 };
    };

    const target = () => {
      if (mode === "user") return caret();
      if (mode === "pass") {
        const r = fox.getBoundingClientRect();
        return {
          x: Math.max(
            60,
            r.left + r.width * 0.2 + PERCH_SIDE * 0 + (PERCH_SIDE < 0 ? -34 : r.width * 0.6),
          ),
          y: r.bottom - 24,
        };
      }
      return { x: mouse.x + 36, y: mouse.y - 34 };
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const tg = target();
      const dx = tg.x - pos.x, dy = tg.y - pos.y;
      const d = Math.hypot(dx, dy);
      const sp = Math.hypot(vel.x, vel.y);
      if (mode === "follow") perched = false;
      else if (perched) { if (d > 30) perched = false }
      else if (d < 8 && sp < 60) perched = true;
      const k = perched ? 110 : 26, c = perched ? 20 : 7.2;
      const nx = perched ? 0 : Math.sin(t * 2.7) * 5 + Math.sin(t * 6.3) * 2;
      const ny = perched ? 0 : Math.cos(t * 3.3) * 6 + Math.sin(t * 5.1) * 2;
      const ax = (tg.x + nx - pos.x) * k - vel.x * c;
      const ay = (tg.y + ny - pos.y) * k - vel.y * c;
      vel.x += ax * dt; vel.y += ay * dt;
      pos.x += vel.x * dt; pos.y += vel.y * dt;
      hop += (0 - hop) * dt * 8;
      // facing: turn toward travel direction; face the field once close
      const want =
        mode !== "follow" && d < 60
          ? 1
          : dx > 10 ? 1 : dx < -10 ? -1 : Math.sign(face) || 1;
      face += (want - face) * Math.min(1, dt * 10);
      const pitch = perched ? (mode === "user" ? 16 + hop * 8 : 3) : -20;
      const lean = clamp(vel.x * 0.022, -14, 14) * (perched ? 0 : 1);
      const shake = perched ? 0 : Math.sin(t * 38) * 1.4 * Math.min(1, sp / 80 + 0.3);
      rot += (face * pitch + lean + shake - rot) * Math.min(1, dt * 9);
      const lift = perched ? -Math.min(d * 0.5, 8) - hop * 3 : 0;
      bird.style.transform =
        "translate(" + (pos.x - 52).toFixed(1) + "px," + (pos.y - 34 + lift).toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
      birdSvg.style.transform = "scaleX(" + face.toFixed(2) + ")";
      bird.classList.toggle("perched", perched);
      bird.style.setProperty("--flap", clamp(0.095 - sp * 0.00006, 0.05, 0.095).toFixed(3) + "s");
      // wind trail
      if (sp > 90 && !perched) trail.push({ x: pos.x, y: pos.y });
      else if (trail.length) trail.shift();
      if (trail.length > 22) trail.shift();
      cx.clearRect(0, 0, cv.width, cv.height);
      cx.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        cx.strokeStyle = "rgba(255,255,255," + ((i / trail.length) * 0.28).toFixed(3) + ")";
        cx.lineWidth = (i / trail.length) * 7;
        cx.beginPath();
        cx.moveTo(trail[i - 1].x, trail[i - 1].y + 4);
        cx.lineTo(trail[i].x, trail[i].y + 4);
        cx.stroke();
      }
      // fox watches the bird
      const hb = head.getBoundingClientRect();
      const hcx = hb.left + hb.width / 2, hcy = hb.top + hb.height / 2;
      const bx = pos.x - hcx, by = pos.y - hcy;
      const bd = Math.hypot(bx, by) || 1;
      const m = Math.min(1, bd / 140) * 7;
      pl.x += ((bx / bd) * m - pl.x) * Math.min(1, dt * 12);
      pl.y += ((by / bd) * m - pl.y) * Math.min(1, dt * 12);
      [eL, eR].forEach((e) => {
        const pu = e.querySelector(".pu") as SVGGElement | null;
        if (pu) pu.style.transform = "translate(" + pl.x.toFixed(2) + "px," + pl.y.toFixed(2) + "px)";
      });
      sleepT += ((mode === "pass" ? 1 : 0) - sleepT) * Math.min(1, dt * 3);
      const thr = clamp(bx / 28, -10, 10) * (1 - sleepT) - 5 * sleepT;
      const thy = clamp(by / 35, -6, 5) * (1 - sleepT) + 20 * sleepT;
      hr += (thr - hr) * Math.min(1, dt * 6);
      hy += (thy - hy) * Math.min(1, dt * 6);
      head.setAttribute(
        "transform",
        "translate(0 " + hy.toFixed(1) + ") rotate(" + hr.toFixed(1) + " 120 170)",
      );
      if (!reduced) requestAnimationFrame(frame);
    };

    if (!reduced) requestAnimationFrame(frame);

    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("resize", size);
      clearInterval(blinkTimer);
      document.body.classList.remove("login-scene");
    };
  }, []);

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <div className="desk" aria-hidden="true" />
      <main className="stage">
        <form className="card" id="f" action={loginAction} autoComplete="on">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue.</p>
          {error ? <p className="err" role="alert">{error}</p> : null}
          <label htmlFor="u">Email</label>
          <input id="u" name="email" type="email" placeholder="Email" autoComplete="email" spellCheck={false} required />
          <label htmlFor="p">Password</label>
          <input id="p" name="password" type="password" placeholder="Password" autoComplete="current-password" required />
          <button type="submit" id="b">Sign in</button>
        </form>
        <Link className="backlink" href="/">← Back to site</Link>
      </main>

      <div className="fox" id="fox" aria-hidden="true">
        <svg id="foxsvg" viewBox="0 0 240 240">
          <defs>
            <radialGradient id="iris" cx=".5" cy=".4" r=".7">
              <stop offset="0" stopColor="#7fd6ff" />
              <stop offset="1" stopColor="#0a6fe0" />
            </radialGradient>
            <path id="tailp" d="M160 205C232 212 252 150 226 116C222 150 196 170 158 166Z" />
            <clipPath id="tc"><use href="#tailp" /></clipPath>
          </defs>
          <g className="tail">
            <use href="#tailp" fill="#e8742a" />
            <ellipse cx="236" cy="124" rx="22" ry="30" fill="#fff" clipPath="url(#tc)" />
          </g>
          <g className="breath">
            <ellipse cx="120" cy="192" rx="52" ry="40" fill="#e8742a" />
            <ellipse cx="120" cy="204" rx="28" ry="30" fill="#fff6ea" />
            <ellipse cx="98" cy="228" rx="14" ry="8" fill="#fff6ea" />
            <ellipse cx="142" cy="228" rx="14" ry="8" fill="#fff6ea" />
          </g>
          <g id="head">
            <path d="M66 104L58 44L106 80Z" fill="#e8742a" />
            <path d="M72 94L68 62L94 82Z" fill="#5a2a14" />
            <path d="M174 104L182 44L134 80Z" fill="#e8742a" />
            <path d="M168 94L172 62L146 82Z" fill="#5a2a14" />
            <ellipse cx="120" cy="128" rx="64" ry="48" fill="#ee7d30" />
            <path d="M56 136Q90 124 120 152Q150 124 184 136Q162 182 120 182Q78 182 56 136Z" fill="#fff6ea" />
            <g id="eL">
              <circle cx="92" cy="126" r="19" fill="#fff" />
              <g className="pu">
                <circle cx="92" cy="126" r="17" fill="url(#iris)" />
                <circle cx="92" cy="127" r="8.5" fill="#0b1b3a" />
                <circle cx="97" cy="120" r="4" fill="#fff" />
              </g>
            </g>
            <g id="eR">
              <circle cx="148" cy="126" r="19" fill="#fff" />
              <g className="pu">
                <circle cx="148" cy="126" r="17" fill="url(#iris)" />
                <circle cx="148" cy="127" r="8.5" fill="#0b1b3a" />
                <circle cx="153" cy="120" r="4" fill="#fff" />
              </g>
            </g>
            <ellipse className="lid l" cx="92" cy="126" rx="21" ry="21" fill="#ee7d30" />
            <ellipse className="lid r" cx="148" cy="126" rx="21" ry="21" fill="#ee7d30" />
            <path className="closed" d="M78 128Q92 138 106 128M134 128Q148 138 162 128" fill="none" stroke="#5a2a14" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="120" cy="152" rx="7" ry="5" fill="#2a1408" />
            <path d="M120 157Q113 166 105 161M120 157Q127 166 135 161" fill="none" stroke="#5a2a14" strokeWidth="2.2" strokeLinecap="round" />
          </g>
          <text className="zz z1" x="188" y="86">z</text>
          <text className="zz z2" x="204" y="64">Z</text>
        </svg>
      </div>

      <canvas id="trail" aria-hidden="true" />

      <div className="bird" id="bird" aria-hidden="true">
        <svg viewBox="0 0 120 80">
          <defs>
            <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1c7d6a" />
              <stop offset=".6" stopColor="#35c69a" />
              <stop offset="1" stopColor="#7a5cd0" />
            </linearGradient>
            <linearGradient id="wg" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#7ea8a0" stopOpacity=".9" />
              <stop offset="1" stopColor="#d9f3ee" stopOpacity=".7" />
            </linearGradient>
          </defs>
          <g className="legs" stroke="#3a2a22" strokeWidth="1.6" strokeLinecap="round">
            <path d="M60 50L58 61M67 50L68 61" />
          </g>
          <path d="M46 40L8 58L20 43L4 45L42 34Z" fill="#1d5b4c" />
          <g className="wing back">
            <path d="M58 36C48 18 30 6 6 4C24 17 38 28 58 40Z" fill="url(#wg)" stroke="#5f8a82" strokeWidth=".6" />
          </g>
          <ellipse cx="62" cy="42" rx="23" ry="12" fill="url(#bg1)" transform="rotate(-8 62 42)" />
          <ellipse cx="66" cy="48" rx="15" ry="6" fill="#ece6d4" transform="rotate(-8 66 48)" />
          <circle cx="84" cy="34" r="9.5" fill="#2fb98f" />
          <ellipse cx="84" cy="41" rx="6" ry="4" fill="#c13fb0" />
          <path d="M92 32L119 38L92 36Z" fill="#26211e" />
          <circle cx="87" cy="32" r="2.3" fill="#111" />
          <circle cx="87.7" cy="31.3" r=".8" fill="#fff" />
          <g className="wing front">
            <path d="M58 36C48 18 30 6 6 4C24 17 38 28 58 40Z" fill="url(#wg)" stroke="#4d7a72" strokeWidth=".7" />
            <path d="M56 34C46 22 32 12 16 8" stroke="#4d7a72" strokeWidth=".6" fill="none" />
          </g>
        </svg>
      </div>
    </>
  );
}
