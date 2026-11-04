import React from "react";

const LINK_RE = /(https?:\/\/[^\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function LinkifiedText({ text }) {
  return String(text)
    .split(LINK_RE)
    .map((part, index) => {
      if (/^https?:\/\//.test(part)) {
        const trailing = part.match(/[.,;:)]+$/)?.[0] || "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <React.Fragment key={index}>
            <a href={href} target="_blank" rel="noopener noreferrer">{href}</a>
            {trailing}
          </React.Fragment>
        );
      }
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(part)) {
        return <a key={index} href={`mailto:${part}`}>{part}</a>;
      }
      return part;
    });
}

export default function LegalDocument({ title, subtitle, intro, sections }) {
  return (
    <section className="section legal-page">
      <div className="container" style={{ maxWidth: 760 }}>
        <article lang="is">
          <h1>{title}</h1>
          <p className="muted legal-updated">{subtitle}</p>
          {intro && <p className="legal-intro"><LinkifiedText text={intro} /></p>}
          {sections.map((section) => (
            <div className="detail-section legal-section" key={section.title}>
              <h3>{section.title}</h3>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}><LinkifiedText text={paragraph} /></p>
              ))}
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
