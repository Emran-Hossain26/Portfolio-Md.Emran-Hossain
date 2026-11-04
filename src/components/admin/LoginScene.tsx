"use client";

import { useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(admin)/actions";

type Props = { error?: string | null };

/**
 * "Fox" login screen (user-supplied design, hummingbird removed on request).
 * The card submits to the real loginAction. The fox's eyes/head follow the
 * pointer (caret while typing the email), and it dozes off on the password
 * field. Body class scoping keeps the CSS isolated to this screen.
 */
export function LoginScene({ error }: Props) {
  useEffect(() => {
    document.body.classList.add("login-scene");
    const $ = <T extends Element>(id: string) =>
      document.getElementById(id) as T | null;

    const u = $<HTMLInputElement>("u");
    const p = $<HTMLInputElement>("p");
    const foxSvg = $<SVGSVGElement>("foxsvg");
    const head = $<SVGGElement>("head");
    const eL = $<SVGGElement>("eL");
    const eR = $<SVGGElement>("eR");
    if (!u || !p || !foxSvg || !head || !eL || !eR) {
      return () => document.body.classList.remove("login-scene");
    }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let mode: "follow" | "user" | "pass" = "follow";
    const mouse = { x: innerWidth * 0.5, y: innerHeight * 0.4 };
    let sleepT = 0, hy = 0, hr = 0;
    const pl = { x: 0, y: 0 };
    let last = performance.now();
    const meas = document.createElement("canvas").getContext("2d");

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY };
    addEventListener("pointermove", onMove, { passive: true });

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

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Fox looks at: the caret (email field), closed eyes on password,
      // otherwise the pointer.
      const tg = mode === "user" ? caret() : { x: mouse.x, y: mouse.y };
      const hb = head.getBoundingClientRect();
      const hcx = hb.left + hb.width / 2, hcy = hb.top + hb.height / 2;
      const bx = tg.x - hcx, by = tg.y - hcy;
      const bd = Math.hypot(bx, by) || 1;
      const m = Math.min(1, bd / 140) * 7;
      const look = 1 - sleepT; // eyes slide shut while dozing on the password
      pl.x += ((bx / bd) * m * look - pl.x) * Math.min(1, dt * 12);
      pl.y += ((by / bd) * m * look - pl.y) * Math.min(1, dt * 12);
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
    </>
  );
}
