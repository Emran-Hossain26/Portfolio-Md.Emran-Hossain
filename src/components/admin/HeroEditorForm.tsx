"use client";

import { useState } from "react";
import { saveHeroTextsAction } from "@/app/(admin)/actions";

/**
 * Mockup slide "Hero editor": live-typing preview that updates as you type,
 * EN/BN headline + subtext, CTA label and the availability chip toggle.
 * Server action unchanged — the preview is pure client state.
 */
export function HeroEditorForm({
  initial,
}: {
  initial: {
    heading_en: string;
    heading_bn: string;
    intro_en: string;
    intro_bn: string;
    cta_en: string;
    cta_bn: string;
    avail: boolean;
  };
}) {
  const [en, setEn] = useState(initial.heading_en);
  const [bn, setBn] = useState(initial.heading_bn);
  const [introEn, setIntroEn] = useState(initial.intro_en);
  const [introBn, setIntroBn] = useState(initial.intro_bn);
  const [ctaEn, setCtaEn] = useState(initial.cta_en);
  const [ctaBn, setCtaBn] = useState(initial.cta_bn);
  const [avail, setAvail] = useState(initial.avail);

  return (
    <div className="g e2">
      <form action={saveHeroTextsAction} className="c">
        <label className="f" htmlFor="h-en">Headline (English)</label>
        <input id="h-en" type="text" name="heading_en" value={en} onChange={(e) => setEn(e.target.value)} />
        <label className="f" htmlFor="h-bn">Headline (বাংলা)</label>
        <input id="h-bn" type="text" name="heading_bn" value={bn} onChange={(e) => setBn(e.target.value)} />
        <label className="f" htmlFor="i-en">Subtext (English)</label>
        <textarea id="i-en" name="intro_en" rows={3} value={introEn} onChange={(e) => setIntroEn(e.target.value)} />
        <label className="f" htmlFor="i-bn">Subtext (বাংলা)</label>
        <textarea id="i-bn" name="intro_bn" rows={3} value={introBn} onChange={(e) => setIntroBn(e.target.value)} />
        <label className="f" htmlFor="c-en">Button label (English)</label>
        <input id="c-en" type="text" name="cta_en" value={ctaEn} onChange={(e) => setCtaEn(e.target.value)} placeholder="Hire me" />
        <label className="f" htmlFor="c-bn">Button label (বাংলা)</label>
        <input id="c-bn" type="text" name="cta_bn" value={ctaBn} onChange={(e) => setCtaBn(e.target.value)} placeholder="যোগাযোগ করুন" />
        <div className="row" style={{ marginTop: 10 }}>
          <div className="gr">
            Show “Available for new projects” chip
            <small>The green availability chip above the headline</small>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
            <input type="checkbox" name="avail" defaultChecked={avail} onChange={(e) => setAvail(e.target.checked)} />
            {avail ? "on" : "off"}
          </label>
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="submit" className="btn p">Save changes</button>
        </div>
      </form>

      <div className="c">
        <h3>Preview <span className="chip">live</span></h3>
        <div className="pv">
          {avail ? <span className="chip ok">● Available for new projects</span> : null}
          <h4 style={{ margin: avail ? "10px 0 0" : 0 }}>{en || bn || "Your headline appears here"}</h4>
          {bn ? <h4 style={{ margin: "4px 0 0", fontSize: 18 }}>{bn}</h4> : null}
          <p style={{ color: "var(--mut2)", marginTop: 8 }}>{introEn || introBn}</p>
          <button className="btn p" style={{ marginTop: 10 }} type="button">
            {ctaEn || ctaBn || "Hire me"}
          </button>
        </div>
        <div className="note">The preview updates as you type. Saving refreshes the public site in seconds.</div>
      </div>
    </div>
  );
}
