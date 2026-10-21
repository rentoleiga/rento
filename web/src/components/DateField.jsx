import React, { useEffect, useRef, useState } from "react";
import { fmtDate, parseDateInput } from "../lib/dates";

export default function DateField({ value, onChange, min, ...props }) {
  const [text, setText] = useState(fmtDate(value));
  const pickerRef = useRef(null);

  useEffect(() => {
    setText(fmtDate(value));
  }, [value]);

  const commit = (raw) => {
    const iso = parseDateInput(raw);
    if (iso) {
      onChange({ target: { value: iso } });
      setText(fmtDate(iso));
    } else {
      setText(fmtDate(value));
    }
  };

  return (
    <span className="date-field">
      <input
        {...props}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const iso = parseDateInput(next);
          if (iso) onChange({ target: { value: iso } });
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        className="date-pick-btn"
        aria-label="Opna dagatal"
        onClick={() => {
          const el = pickerRef.current;
          if (!el) return;
          if (typeof el.showPicker === "function") el.showPicker();
          else el.focus();
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        className="date-native"
        value={value || ""}
        min={min}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          setText(fmtDate(e.target.value));
          onChange(e);
        }}
      />
    </span>
  );
}
