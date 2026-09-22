import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function HowItWorksPage() {
  const { t } = useLang();
  return (
    <>
      {/* Hero - dark */}
      <section className="how-hero">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="how-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Leiðarvísir
          </div>
          <h1>Hvernig virkar Rentó?</h1>
          <p className="how-hero-sub">Leigðu það sem þú þarft eða fáðu tekjur af hlutunum sem þú átt.</p>
          <p className="how-hero-desc">Rentó er leigumarkaðstorg þar sem einstaklingar og fyrirtæki geta leigt hluti sín á milli.</p>
        </div>
      </section>

      {/* Two cards */}
      <section className="section" style={{ background: "#f6f8f7" }}>
        <div className="container">
          <div className="how-two-col">
            {/* Left: Vantar þig hlut? */}
            <div className="card how-card">
              <div className="how-card-head">
                <span className="how-icon-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg></span>
                <h2>Vantar þig hlut?</h2>
              </div>
              <ol className="how-steps">
                <li><span className="how-num">1</span><div><strong>Finndu</strong><p>Leitaðu að því sem þig vantar og skoðaðu verð, staðsetningu og laus tímabil.</p></div></li>
                <li><span className="how-num">2</span><div><strong>Bókaðu</strong><p>Veldu dagsetningar og sendu inn bókun.</p></div></li>
                <li><span className="how-num">3</span><div><strong>Sæktu</strong><p>Þú og leigusali komið ykkur saman um afhendingu.</p></div></li>
                <li><span className="how-num">4</span><div><strong>Skilaðu</strong><p>Skilaðu hlutnum samkvæmt samkomulagi og gefðu umsögn.</p></div></li>
              </ol>
              <Link to="/search" className="btn btn-primary how-card-btn">Finna eitthvað til leigu</Link>
            </div>

            {/* Right: Viltu leigja út? */}
            <div className="card how-card">
              <div className="how-card-head">
                <span className="how-icon-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M12 18V6"/></svg></span>
                <h2>Viltu leigja út?</h2>
              </div>
              <ol className="how-steps">
                <li><span className="how-num">1</span><div><strong>Skráðu hlut</strong><p>Settu inn myndir, lýsingu, verð og hvenær hluturinn er laus.</p></div></li>
                <li><span className="how-num">2</span><div><strong>Fáðu bókun</strong><p>Leigjandi sendir inn bókun og þú samþykkir hana.</p></div></li>
                <li><span className="how-num">3</span><div><strong>Afhentu</strong><p>Afhentu hlutinn samkvæmt samkomulagi.</p></div></li>
                <li><span className="how-num">4</span><div><strong>Fáðu greitt</strong><p>Greiðslan berst þér eftir að leigu lýkur.</p></div></li>
              </ol>
              <Link to="/dashboard/listings/new" className="btn btn-primary how-card-btn">Setja hlut í leigu</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Greiðslur á mannamáli */}
      <section className="section" style={{ background: "#f6f8f7", paddingTop: 0 }}>
        <div className="container">
          <h2 className="how-section-title">Greiðslur á mannamáli</h2>
          <div className="how-three-col">
            <div className="card how-info-card">
              <h4>Borga ég Rentó eða eigandanum?</h4>
              <p>Allar greiðslur fara í gegnum Rentó. Þú borgar við bókun og eigandinn fær greiðsluna eftir staðfestingu.</p>
            </div>
            <div className="card how-info-card">
              <h4>Hvenær fær eigandinn peninginn?</h4>
              <p>Greiðsla berst til leigusala eftir að hlutur er afhentur og leiga hefst. Öruggt og rekjanlegt.</p>
            </div>
            <div className="card how-info-card">
              <h4>Hvað kostar Rentó?</h4>
              <p>Rento leggur 10% þjónustugjald á hverja leigu. Gjaldið er dregið af greiðslu til eiganda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Öruggari leiga */}
      <section className="section" style={{ background: "#f6f8f7", paddingTop: 0 }}>
        <div className="container">
          <h2 className="how-section-title">Öruggari leiga með Rentó</h2>
          <div className="how-four-col">
            <div className="how-trust-card">Notendur stofna reikning</div>
            <div className="how-trust-card">Bókanir og greiðslur fara í gegnum Rentó</div>
            <div className="how-trust-card">Umsagnir hjálpa þér að velja</div>
            <div className="how-trust-card">Skilmálar gilda um hverja leigu</div>
          </div>
        </div>
      </section>

      {/* Hvað ef eitthvað kemur upp? */}
      <section className="section" style={{ background: "#f6f8f7", paddingTop: 0 }}>
        <div className="container">
          <div className="card how-help-card">
            <div>
              <h3>Hvað ef eitthvað kemur upp?</h3>
              <p>Hluturinn er bilaður eða kemur skemmdur til baka? Hér er farið yfir hvað gerist og hvert þú leitar.</p>
            </div>
            <Link to="/faq" className="btn btn-outline how-help-btn">Sjá hjálparsíðu</Link>
          </div>
        </div>
      </section>

      {/* CTA dark */}
      <section className="section" style={{ background: "#f6f8f7", paddingTop: 0 }}>
        <div className="container">
          <div className="how-cta-dark">
            <h2>Tilbúin(n) að byrja?</h2>
            <div className="how-cta-actions">
              <Link to="/search" className="btn how-cta-teal">Finna eitthvað til leigu</Link>
              <Link to="/dashboard/listings/new" className="btn how-cta-outline">Setja hlut í leigu</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
