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
          <h1>Hvernig virkar Rentó?</h1>
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
          <p className="how-pay-intro">Leigan er á milli þín og leigusala. Rentó selur aðeins auglýsingaþjónustu.</p>

          <div className="how-pay-flow">
            <div className="card how-pay-box">
              <span className="how-pay-label">LEIGA</span>
              <h3>Leigjandi ↔ Eigandi</h3>
              <p>Þið semjið beint um verð og greiðslu. Rentó tekur ekki við leigugreiðslum og tekur enga þóknun.</p>
            </div>
            <span className="how-pay-plus" aria-hidden="true">+</span>
            <div className="card how-pay-box how-pay-box-accent">
              <span className="how-pay-label">AUGLÝSINGAÞJÓNUSTA</span>
              <h3>Eigandi → Rentó</h3>
              <p>Þú greiðir Rentó með korti fyrir einingar og auglýsingapakka til að birta og efla auglýsingar.</p>
            </div>
          </div>

          <div className="how-three-col how-pay-cards">
            <div className="card how-info-card how-pay-card">
              <span className="how-pay-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
              </span>
              <h4>Hver sér um greiðsluna fyrir leiguna?</h4>
              <p>Leigjandi og eigandi ganga frá leigugreiðslu sín á milli. Rentó tekur ekki við leigugreiðslum og tekur enga þóknun af leigunni.</p>
              <span className="how-pay-tag">Beint á milli notenda</span>
            </div>
            <div className="card how-info-card how-pay-card">
              <span className="how-pay-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
              </span>
              <h4>Hvað greiði ég Rentó fyrir?</h4>
              <p>Rentó selur auglýsingaþjónustu. Þú getur keypt staka einingu eða auglýsingapakka og notað einingarnar til að birta eða efla auglýsingar.</p>
              <span className="how-pay-tag">Stök eining eða pakki</span>
            </div>
            <div className="card how-info-card how-pay-card">
              <span className="how-pay-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </span>
              <h4>Hvernig er greitt fyrir þjónustu Rentó?</h4>
              <p>Greitt er með korti í gegnum Straum. Einingar eru ekki peningar og ekki hægt að færa þær milli notenda.</p>
              <span className="how-pay-tag">Kortagreiðsla</span>
            </div>
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
