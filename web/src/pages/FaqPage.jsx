import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

const FAQ_ITEMS = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
  { q: "faq.q7", a: "faq.a7" },
  { q: "faq.q8", a: "faq.a8" },
];

export default function FaqPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("faq.title")}</h1>
        <p className="muted">{t("faq.sub")}</p>

        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="detail-section">
            <h3>{t(item.q)}</h3>
            <p>{t(item.a)}</p>
          </div>
        ))}

        <div className="detail-section" style={{ textAlign: "center" }}>
          <h3>{t("faq.moreQuestions")}</h3>
          <p>{t("faq.moreQuestionsSub")}</p>
          <a href="mailto:info@rento.is" className="btn btn-primary">{t("faq.contactUs")}</a>
        </div>
      </div>
    </section>
  );
}
