import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import { StarRating } from "../components/ListingCard";
import ListingCard from "../components/ListingCard";
import PasswordInput from "../components/PasswordInput";

export default function ProfilePage() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [referral, setReferral] = useState(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [eform, setEform] = useState({ firstName: "", lastName: "", city: "", phone: "", bio: "", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  useEffect(() => {
    api.get(`/api/users/${id}`)
      .then((d) => { setProfile(d.user); setStats(d.stats || null); setListings(d.listings || []); })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!user || !id || String(user.id) !== String(id)) return;
    api.get("/api/users/me/referrals").then(setReferral).catch(() => {});
  }, [user, id]);

  const verifyPhone = async () => {
    setPhoneMsg("");
    try {
      await api.post("/api/users/me/verify-phone", { code: phoneCode });
      setProfile((p) => ({ ...p, phoneVerified: true }));
      setUser((u) => ({ ...u, phoneVerified: true }));
      setPhoneOpen(false);
      setPhoneCode("");
    } catch (e) {
      setPhoneMsg(e.message);
    }
  };


  if (error) return <div className="container section"><div className="empty"><h3>{error}</h3></div></div>;
  if (!profile) return <div className="container section"><div className="empty">Hleður…</div></div>;

  const isOwn = user && profile && user.id === profile.id;

  const openEdit = () => {
    const src = user && user.id === profile.id ? { ...profile, ...user } : profile;
    setEform({
      firstName: src.firstName || "",
      lastName: src.lastName || "",
      city: src.city || "",
      phone: src.phone || "",
      bio: src.bio || "",
      avatar: src.avatar || "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!eform.firstName.trim()) { setEditError("Fornafn er skylda."); return; }
    setSaving(true);
    setEditError("");
    try {
      const d = await api.put("/api/auth/me", {
        firstName: eform.firstName.trim(),
        lastName: eform.lastName.trim(),
        city: eform.city.trim(),
        phone: eform.phone.trim(),
        bio: eform.bio.trim(),
        avatar: eform.avatar.trim() || undefined,
      });
      setUser(d.user);
      setProfile((p) => ({
        ...p,
        firstName: d.user.firstName,
        lastName: d.user.lastName,
        fullName: [d.user.firstName, d.user.lastName].filter(Boolean).join(" ") || d.user.email,
        city: d.user.city,
        bio: d.user.bio,
        avatar: d.user.avatar,
      }));
      setEditOpen(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const openPw = () => {
    setPwForm({ current: "", next: "", confirm: "" });
    setPwError("");
    setPwDone(false);
    setPwOpen(true);
  };

  const savePw = async () => {
    const hasPw = user?.hasPassword !== false;
    if (hasPw && !pwForm.current) { setPwError("Sláðu inn núverandi lykilorð."); return; }
    if (pwForm.next.length < 8) { setPwError("Nýtt lykilorð verður að vera a.m.k. 8 stafir."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Nýju lykilorðin passa ekki saman."); return; }
    setPwSaving(true);
    setPwError("");
    try {
      const d = await api.put("/api/auth/me/password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setUser({ ...user, hasPassword: d.hasPassword });
      setPwDone(true);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(
        err.status === 403
          ? "Núverandi lykilorð er rangt."
          : err.message
      );
    } finally {
      setPwSaving(false);
    }
  };

  const startMessage = (listing) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedListing(listing);
    setMsgOpen(true);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedListing) return;
    setMsgSending(true);
    try {
      await api.post("/api/conversations", {
        listingId: selectedListing.id,
        recipientId: profile.id,
        message: msgText.trim(),
      });
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => navigate("/messages"), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 940 }}>
      <div className="detail-section" style={{ marginTop: 0, display: "flex", gap: 16, alignItems: "center" }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div className="img-placeholder avatar-fallback" style={{ width: 84, height: 84, borderRadius: "50%", fontSize: 30 }}>
            {(profile.firstName || "U")[0]}
          </div>
        )}
        <div className="grow">
          <h1 className="mt0 mb0" style={{ fontSize: 24 }}>{profile.fullName}</h1>
          <div className="muted">{profile.city}{profile.role === "admin" ? " · Stjórnandi" : ""}</div>
          <div className="row" style={{ gap: 14, marginTop: 6, fontSize: 14 }}>
            <span><StarRating rating={profile.rating} /> {Number(profile.rating).toFixed(1)} ({profile.reviewCount})</span>
            {profile.identityVerified && <span>Auðkenni staðfest</span>}
            {profile.businessVerified && <span>Fyrirtæki staðfest</span>}
            {profile.phoneVerified && <span>Sími staðfestur</span>}
            {profile.responseRate > 0 && <span>{profile.responseRate}% svarhlutfall</span>}
            <span className="muted">Meðlimur síðan {timeAgo(profile.memberSince)}</span>
          </div>
          {stats && (
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {stats.ownerBookings.total} bókanir sem leigusali
              {stats.ownerBookings.completed ? ` · ${stats.ownerBookings.completed} lokið` : ""}
              {" · "}{stats.renterBookings.total} sem leigjandi
            </div>
          )}
          {user && user.id !== profile.id && listings.length > 0 && (
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => startMessage(listings[0])}>
              {t("listing.sendMessage")}
            </button>
          )}
          {isOwn && (
            <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={openEdit}>
                Breyta prófíl
              </button>
              <button className="btn btn-outline" onClick={openPw}>
                Breyta lykilorði
              </button>
              {!profile.phoneVerified && (
                <button className="btn btn-outline" onClick={() => { setPhoneOpen(true); setPhoneMsg(""); }}>
                  Staðfesta síma
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {profile.bio && (
        <div className="detail-section">
          <h3>Um</h3>
          <p className="mb0">{profile.bio}</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head"><h2>Skráningar</h2></div>
          <div className="grid">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </div>
      )}


      {isOwn && referral && (
        <div className="detail-section">
          <h3>Tilkynningarkóði</h3>
          <p className="mb0" style={{ fontSize: 14 }}>
            Deildu tenglinum og fáðu yfirlit yfir skráningar: <strong>{referral.code}</strong> · {referral.referrals} skráning(ar)
          </p>
          <div className="row" style={{ marginTop: 8 }}>
            <input readOnly value={referral.link} style={{ maxWidth: 420 }} onFocus={(e) => e.target.select()} />
            <button
              className="btn btn-outline btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referral.link);
                  alert("Tengill afritaður");
                } catch {}
              }}
            >
              Afrita
            </button>
          </div>
        </div>
      )}

      {phoneOpen && (
        <div className="modal-overlay" onClick={() => setPhoneOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Staðfesta símanúmer</h3>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
              Þessi útgáfa notar prufukóðann <strong>1234</strong>.
            </p>
            {phoneMsg && <div className="form-error">{phoneMsg}</div>}
            <div className="field">
              <label>Staðfestingarkóði</label>
              <input value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} inputMode="numeric" />
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setPhoneOpen(false)}>Hætta við</button>
              <button className="btn btn-primary" disabled={!phoneCode.trim()} onClick={verifyPhone}>Staðfesta</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Breyta prófíl</h3>
            {editError && <div className="form-error">{editError}</div>}
            <div className="row">
              <div className="field grow">
                <label>Fornafn *</label>
                <input value={eform.firstName} onChange={(e) => setEform({ ...eform, firstName: e.target.value })} />
              </div>
              <div className="field grow">
                <label>Eftirnafn</label>
                <input value={eform.lastName} onChange={(e) => setEform({ ...eform, lastName: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="field grow">
                <label>Borg/bær</label>
                <input value={eform.city} onChange={(e) => setEform({ ...eform, city: e.target.value })} placeholder="t.d. Reykjavík" />
              </div>
              <div className="field grow">
                <label>Símanúmer</label>
                <input type="tel" value={eform.phone} onChange={(e) => setEform({ ...eform, phone: e.target.value })} placeholder="t.d. +354 612 3456" />
              </div>
            </div>
            <div className="field">
              <label>Um mig</label>
              <textarea rows={3} value={eform.bio} onChange={(e) => setEform({ ...eform, bio: e.target.value })} placeholder="Segðu stuttlega frá þér…" style={{ width: "100%", resize: "vertical" }} />
            </div>
            <div className="field">
              <label>Mynd (slóð)</label>
              <input value={eform.avatar} onChange={(e) => setEform({ ...eform, avatar: e.target.value })} placeholder="https://…" />
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setEditOpen(false)}>Hætta við</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveEdit}>
                {saving ? "Vista…" : "Vista"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pwOpen && (
        <div className="modal-overlay" onClick={() => setPwOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Breyta lykilorði</h3>
            {user?.hasPassword === false && (
              <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
                Núverandi lykilorð vantar — þú skráðir þig inn með Google. Stilltu hér lykilorð til að geta skráð þig inn með netfangi og lykilorði.
              </p>
            )}
            {pwError && <div className="form-error">{pwError}</div>}
            {pwDone ? (
              <div className="form-success" style={{ marginBottom: 12 }}>Lykilorðið hefur verið breytt.</div>
            ) : (
              <>
                {user?.hasPassword !== false && (
                  <div className="field">
                    <label>Núverandi lykilorð</label>
                    <PasswordInput autoComplete="current-password" value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
                  </div>
                )}
                <div className="field">
                  <label>Nýtt lykilorð (að lágm. 8 stafi)</label>
                  <PasswordInput autoComplete="new-password" value={pwForm.next}
                    onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
                </div>
                <div className="field">
                  <label>Endurtaka nýtt lykilorð</label>
                  <PasswordInput autoComplete="new-password" value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
                </div>
              </>
            )}
            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setPwOpen(false)}>
                {pwDone ? "Loka" : "Hætta við"}
              </button>
              {!pwDone && (
                <button className="btn btn-primary" disabled={pwSaving} onClick={savePw}>
                  {pwSaving ? "Vista…" : "Vista nýtt lykilorð"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {msgOpen && (
        <div className="modal-overlay" onClick={() => { setMsgOpen(false); setMsgSent(false); setSelectedListing(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t("listing.messageOwner")}</h3>
            {selectedListing && <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Re: {selectedListing.title}</p>}
            {msgSent ? (
              <div className="empty" style={{ padding: "20px 0" }}>
                <p>{t("listing.messageSent")}</p>
              </div>
            ) : (
              <>
                <div className="field">
                  <textarea
                    rows={4}
                    placeholder={t("listing.messagePlaceholder")}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
                <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => { setMsgOpen(false); setSelectedListing(null); }}>{t("listing.cancel")}</button>
                  <button className="btn btn-primary" disabled={msgSending || !msgText.trim()} onClick={sendMessage}>
                    {msgSending ? t("listing.sending") : t("listing.sendMessage")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}