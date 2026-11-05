import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import "./pharmacy-workspace.css";

function PharmacyAddMedicinePage({ session }) {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "0", shop: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMedicineId, setSavedMedicineId] = useState(medicineId || "");

  useEffect(() => {
    let active = true;
    apiRequest("/api/pharmacy/inventory", session.token).then((data) => {
      if (!active) return;
      setShops(data.shops || []);
      if (medicineId) {
        const existing = data.medicines.find((item) => item._id === medicineId);
        if (existing) setForm({ name: existing.name, description: existing.description || "", price: existing.price, stock: String(existing.stock), shop: existing.shop?._id || existing.shop });
      } else if (data.shops?.length) {
        setForm((current) => ({ ...current, shop: data.shops[0]._id }));
      }
    }).catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [medicineId, session.token]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseImage(event) {
    const selected = event.target.files?.[0] || null;
    if (selected && !["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImage(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const targetId = medicineId || savedMedicineId;
      const saved = await apiRequest(targetId ? `/api/pharmacy/medicines/${targetId}` : "/api/pharmacy/medicines", session.token, {
        method: targetId ? "PATCH" : "POST",
        body: form,
      });
      const savedId = saved.medicine?._id || targetId;
      if (savedId && !savedMedicineId) setSavedMedicineId(savedId);
      if (image && savedId) {
        const body = new FormData();
        body.append("image", image);
        await apiRequest(`/api/pharmacy/medicines/${savedId}/image`, session.token, { method: "POST", body });
      }
      navigate("/pharmacy/inventory", { replace: true });
    } catch (requestError) {
      setError(savedMedicineId || medicineId
        ? requestError.message
        : `Medicine details were saved, but the image could not be uploaded: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
  }

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">INVENTORY</p><h1>{medicineId ? "Edit medicine" : "Add medicine"}</h1><p>Medicine details are visible to customers searching pharmacy listings.</p></div><Link className="plain-action" to="/pharmacy/inventory">Back to inventory</Link></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {!shops.length && <div className="pharmacy-empty">Create a pharmacy location in your profile before adding inventory.</div>}
      {shops.length > 0 && <form className="pharmacy-form-panel" onSubmit={submit}>
        <div className="pharmacy-form-grid">
          <label>Medicine name<input maxLength={120} onChange={update("name")} required value={form.name} /></label>
          <label>Pharmacy location<select onChange={update("shop")} required value={form.shop}>{shops.map((shop) => <option key={shop._id} value={shop._id}>{shop.name}</option>)}</select></label>
          <label>Description<textarea maxLength={1000} onChange={update("description")} rows={4} value={form.description} /></label>
          <label>Price (INR)<input min="0" onChange={update("price")} required step="0.01" type="number" value={form.price} /></label>
          <label>Available stock<input min="0" onChange={update("stock")} required step="1" type="number" value={form.stock} /></label>
          <label>Medicine image<input accept="image/jpeg,image/png,image/webp" onChange={chooseImage} type="file" /><small>JPG, PNG or WebP; maximum 5 MB.</small></label>
        </div>
        {preview && <img alt="Medicine preview" className="medicine-upload-preview" src={preview} />}
        <button className="primary-action" disabled={saving} type="submit">{saving ? "Saving…" : medicineId ? "Save changes" : "Add medicine"}</button>
      </form>}
    </section>
  );
}

export default PharmacyAddMedicinePage;