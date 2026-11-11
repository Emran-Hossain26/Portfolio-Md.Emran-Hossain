"use client";

import { useState } from "react";
import Image from "next/image";
import { pick, type Locale } from "@/data/types";
import type { Project } from "@/data/projects";

export type MediaLabels = {
  /** Position: word + digits composed here ("Module 1 of 4" / "মডিউল 1/4"). */
  slideOf: string;
  /** Joiner between the index and the total ("of" / "/"). */
  slideJoin: string;
  screenshot: string;
  promoVideo: string;
};

/** YouTube/Vimeo/watch URLs → click-to-load embed URLs; MP4/webm play native. */
function embedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&autoplay=1`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return url;
}


const isVideoFile = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

/**
 * The 16:9 `.media` box from the approved mockup (index.html), in all modes:
 *
 * - slides: every entry renders, image or not. A real screenshot fills the
 *   frame; an imageless slide shows the mockup's accent-tinted placeholder
 *   panel ("Screenshot: {caption}" + "Module n of N") in the SAME frame, with
 *   the same ‹ › arrows, dots, keyboard ←/→ and touch swipe. Caption is
 *   shown in the current language (BN falls back to EN).
 * - video: mockup "Promo video" panel (play icon + project name); with a
 *   URL it facade-loads the YouTube/Vimeo/MP4 player on click.
 * - none: nothing renders (media area hidden).
 */
export function ProjectMedia({
  project,
  locale,
  labels,
}: {
  project: Project;
  locale: Locale;
  labels: MediaLabels;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const title = pick(locale, project.title);
  const video = project.video;

  if (project.media === "none") return null;

  if (project.media === "video") {
    // Mockup panel: play icon + project name (± promo-video note).
    const panel = (
      <div>
        <span aria-hidden="true">&#9654;</span>
        <div>{title}</div>
        <small>{labels.promoVideo}</small>
      </div>
    );
    if (video && playing) {
      return (
        <div className="media">
          {isVideoFile(video) ? (
            <video src={video} controls autoPlay playsInline />
          ) : (
            <iframe
              src={embedUrl(video)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      );
    }
    return (
      <div
        className="media"
        {...(video
          ? {
              role: "button",
              tabIndex: 0,
              style: { cursor: "pointer" },
              "aria-label": `Play video: ${title}`,
              onClick: () => setPlaying(true),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPlaying(true);
                }
              },
            }
          : { role: "img", "aria-label": `${labels.promoVideo}: ${title}` })}
      >
        {panel}
      </div>
    );
  }

  const slides = project.slides ?? [];
  const n = slides.length;

  // Mockup-faithful placeholder panel (empty slider): same gradient box.
  // Task U4: the cover/thumbnail image fills the frame when set, replacing
  // the plain placeholder.
  if (!n) {
    const cover = project.cover_url?.trim();
    return (
      <div className="media" role="img" aria-label={title}>
        {cover ? (
          <img
            src={cover}
            alt={title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div>
            {labels.screenshot}
            <div style={{ color: "var(--ink)" }}>{title}</div>
          </div>
        )}
      </div>
    );
  }

  const idx = i % n;
  const slide = slides[idx];
  const src = slide.src?.trim() ?? "";
  const caption = pick(locale, {
    en: slide.caption_en,
    bn: slide.caption_bn || slide.caption_en,
  });
  const move = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <div
      className="media"
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        }
      }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        setTouchX(null);
        // Guard against touch browsers that fire a click right after a swipe.
        if (Math.abs(dx) > 40) move(dx > 0 ? 1 : -1);
      }}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={caption || title}
            fill
            sizes="(max-width: 760px) 100vw, 360px"
            style={{ objectFit: "cover" }}
          />
          {caption && <div className="caption">{caption}</div>}
        </>
      ) : (
        // Mockup placeholder: "Screenshot: {caption}" + "Module n of N"
        <div>
          {labels.screenshot} {caption}
          {n > 1 && (
            <small>
              {labels.slideOf} {idx + 1} {labels.slideJoin} {n}
            </small>
          )}
        </div>
      )}
      {n > 1 && (
        <>
          <button className="nv pv" aria-label="Previous slide" onClick={() => move(-1)}>
            ‹
          </button>
          <button className="nv nx" aria-label="Next slide" onClick={() => move(1)}>
            ›
          </button>
          <div className="dots">
            {slides.map((s, k) => (
              <button
                key={k}
                aria-label={`Slide ${k + 1}`}
                className={k === idx ? "on" : ""}
                onClick={() => setI(k)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
