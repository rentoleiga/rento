import React, { useEffect, useState } from "react";
import { api } from "../api";

let cache = null;
let pending = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = api.get("/api/settings/public")
      .then((d) => {
        cache = d.settings || {};
        return cache;
      })
      .catch(() => {
        cache = {};
        return cache;
      });
  }
  return pending;
}

export function useCms(key) {
  const [value, setValue] = useState(cache ? cache[key] || "" : "");
  useEffect(() => {
    let alive = true;
    load().then((s) => {
      if (alive) setValue(s[key] || "");
    });
    return () => { alive = false; };
  }, [key]);
  return value;
}

// Renders admin-managed text: "## " starts a heading, blank lines separate
// paragraphs, everything else is plain text.
export default function CmsContent({ text }) {
  if (!text) return null;
  const blocks = String(text).split(/\n{2,}/);
  return (
    <div className="cms-content">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("## ")) {
          return <h3 key={i}>{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={i}>{trimmed.slice(2)}</h2>;
        }
        return <p key={i} style={{ whiteSpace: "pre-line" }}>{trimmed}</p>;
      })}
    </div>
  );
}
