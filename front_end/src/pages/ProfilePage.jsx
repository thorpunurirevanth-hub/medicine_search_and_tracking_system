import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", address: "", locality: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiRequest("/api/users/me").then((data) => setProfile({ ...profile, ...data.user })).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest("/api/users/me", null, { method: "PATCH", body: { name: profile.name, phone: profile.phone, address: profile.address, locality: profile.locality } });
      setProfile((current) => ({ ...current, ...data.user }));
      setNotice("Profile saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="customer-page"><div className="workspace-empty">Loading your profile…</div></section>;

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">ACCOUNT</p><h1>Your profile</h1><p>Keep your contact and saved locality details up to date.</p></div></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {notice && <p className="dashboard-message success-message" role="status">{notice}</p>}
      <form className="profile-form customer-panel" onSubmit={submit}>
        <label>Full name<input onChange={(event) => setProfile({ ...profile, name: event.target.value })} required value={profile.name || ""} /></label>
        <label>Email address<input disabled type="email" value={profile.email || ""} /></label>
        <label>Phone<input autoComplete="tel" onChange={(event) => setProfile({ ...profile, phone: event.target.value })} type="tel" value={profile.phone || ""} /></label>
        <label>Saved locality<input onChange={(event) => setProfile({ ...profile, locality: event.target.value })} value={profile.locality || ""} /></label>
        <label className="profile-wide">Address<input autoComplete="street-address" onChange={(event) => setProfile({ ...profile, address: event.target.value })} value={profile.address || ""} /></label>
        <button className="primary-action" disabled={saving} type="submit">{saving ? "Saving…" : "Save profile"}</button>
      </form>
    </section>
  );
}

export default ProfilePage;