"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

/**
 * Task: admin button feedback — renders inside a server-action <form> and
 * reflects that form's in-flight state: immediate visual feedback on click
 * (<100ms, React DOM pending flag), a pending label, and disabled state to
 * block accidental duplicate submissions. The label restores automatically
 * when the action completes (the server action redirects/refreshes).
 */
export function ActionButton({
  children,
  pendingLabel,
  className = "btn s",
  style,
  title,
  confirm,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      style={style}
      title={title}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
