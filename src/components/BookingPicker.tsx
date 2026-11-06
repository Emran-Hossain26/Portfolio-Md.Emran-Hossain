"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitBookingAction, type PublicActionResult } from "@/lib/actions/public";
import type { BookingSlot } from "@/lib/cms";

const initial: PublicActionResult = { ok: false };

/**
 * Stage 6 #9 — consultation booking: pick an open slot, leave contact
 * details. Capacity is enforced server-side (conditional increment), the
 * picker just hides full/past slots.
 */
export function BookingPicker({ slots }: { slots: BookingSlot[] }) {
  const t = useTranslations("booking");
  const [state, action, pending] = useActionState(submitBookingAction, initial);
  const [slotId, setSlotId] = useState("");

  const open = slots.filter((s) => s.booked < s.capacity);
  if (!open.length) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: 0 }}>{t("title")}</h3>
        <p className="mute" style={{ margin: "8px 0 0", fontSize: 14 }}>{t("none")}</p>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: 0 }}>{t("title")}</h3>
        <p style={{ margin: "8px 0 0", fontWeight: 600 }}>{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{t("title")}</h3>
      <p className="mute" style={{ margin: 0, fontSize: 14 }}>{t("intro")}</p>
      <div>
        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 14 }}>{t("pick")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {open.map((s) => {
            const id = s.id;
            const label = `${s.slot_date}${s.slot_time ? " · " + s.slot_time : ""}`;
            const selected = slotId === id;
            return (
              <button
                key={id}
                type="button"
                className={"btn" + (selected ? " p" : "")}
                aria-pressed={selected}
                onClick={() => setSlotId(selected ? "" : id)}
              >
                {label}
                {s.capacity > 1 ? (
                  <small style={{ marginLeft: 6, opacity: 0.75 }}>
                    {s.capacity - s.booked} left
                  </small>
                ) : null}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="slot_id" value={slotId} />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label>
          {t("name")}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {t("email")}
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <label>
        {t("topic")}
        <input name="topic" required minLength={5} maxLength={1000} />
      </label>
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      {state.error ? (
        <p role="alert" style={{ color: "var(--bad, #b42318)", margin: 0, fontSize: 14 }}>
          {t(`error_${state.error}`)}
        </p>
      ) : null}
      <div>
        <button className="btn p" type="submit" disabled={pending || !slotId}>
          {pending ? t("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}
