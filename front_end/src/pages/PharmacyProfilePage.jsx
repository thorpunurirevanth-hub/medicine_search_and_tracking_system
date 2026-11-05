import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";
import "./pharmacy-workspace.css";

function PharmacyProfilePage({ session }) {
  const [shops, setShops] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", address: "", phone: "", locality: "", latitude: "", longitude: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiRequest("/api/pharmacy/inventory", session.token).then((data) => {
      setShops(data.shops || []);
      if (data.shops?.length) {
        setSelectedId(data.shops[0]._id);
        setFormFromShop(data.shops[0]);
      }
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [session.token]);

  function setFormFromShop(shop) {
    setForm({ name: shop.name || "", address: shop.address || "", phone: shop.phone || "", locality: shop.locality || "", latitude: shop.location?.latitude ?? "", longitude: shop.location?.longitude ?? "" });
  }

  function chooseShop(id) {
    const shop = shops.find((item) => item._id === id);
    setSelectedId(id);
    if (shop) setFormFromShop(shop);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(`/api/pharmacy/shops/${selectedId}`, session.token, { method: "PATCH", body: form });
      setShops((current) => current.map((shop) => shop._id === selectedId ? data.shop : shop));
      setFormFromShop(data.shop);
      setNotice("Pharmacy profile saved.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">LOCATION SETTINGS</p><h1>Pharmacy profile</h1><p>Update your public location details and optional coordinates.</p></div></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}{notice && <p className="dashboard-message success-message" role="status">{notice}</p>}
      {loading ? <p className="pharmacy-empty">Loading location details…</p> : shops.length ? <form className="pharmacy-form-panel" onSubmit={submit}>
        <label>Location<select onChange={(event) => chooseShop(event.target.value)} value={selectedId}>{shops.map((shop) => <option key={shop._id} value={shop._id}>{shop.name}</option>)}</select></label>
        <div className="pharmacy-form-grid"><label>Pharmacy name<input onChange={update("name")} required value={form.name} /></label><label>Phone<input onChange={update("phone")} type="tel" value={form.phone} /></label><label>Locality<input onChange={update("locality")} value={form.locality} /></label><label className="pharmacy-form-wide">Address<input onChange={update("address")} required value={form.address} /></label><label>Latitude<input max="90" min="-90" onChange={update("latitude")} step="any" type="number" value={form.latitude} /></label><label>Longitude<input max="180" min="-180" onChange={update("longitude")} step="any" type="number" value={form.longitude} /></label></div>
        <p className="pharmacy-field-hint">Coordinates are optional. Nearby search will include your location only when valid coordinates are saved.</p>
        <button className="primary-action" disabled={saving} type="submit">{saving ? "Saving…" : "Save pharmacy profile"}</button>
      </form> : <p className="pharmacy-empty">No pharmacy location found.</p>}
    </section>
  );
}

export default PharmacyProfilePage;