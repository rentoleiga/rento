const SITE = "https://www.rento.is";
const DEFAULT_IMAGE = `${SITE}/rento-logo.png`;

function setMeta(attr, key, content) {
  if (content == null || content === "") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", String(content));
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

// Updates document title, description, canonical and social preview tags.
export function setSeo({ title, description, image, url, type = "website", jsonLd } = {}) {
  if (typeof document === "undefined") return;
  const desc = description
    ? String(description).replace(/\s+/g, " ").trim().slice(0, 300)
    : "";
  const href = url || window.location.href;
  const img = image || DEFAULT_IMAGE;

  if (title) document.title = title;
  setMeta("name", "description", desc);
  setMeta("property", "og:site_name", "Rentó");
  setMeta("property", "og:type", type);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", desc);
  setMeta("property", "og:url", href);
  setMeta("property", "og:image", img);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", desc);
  setMeta("name", "twitter:image", img);
  setCanonical(href);

  const existing = document.getElementById("seo-jsonld");
  if (existing) existing.remove();
  if (jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "seo-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

export { SITE, DEFAULT_IMAGE };
