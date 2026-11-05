import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import MedicineImage from "../components/MedicineImage.jsx";
import "./pharmacy-workspace.css";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

function PharmacyInventoryPage({ session }) {
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest("/api/pharmacy/inventory", session.token)
      .then((data) => { if (active) setMedicines(data.medicines || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.token, reload]);

  function beginEdit(item) {
    setEditing(item._id);
    setForm({ name: item.name, description: item.description || "", price: item.price, stock: item.stock });
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/pharmacy/medicines/${editing}`, session.token, { method: "PATCH", body: form });
      setEditing(null);
      setNotice("Medicine details updated.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove ${item.name} from this pharmacy's inventory?`)) return;
    try {
      await apiRequest(`/api/pharmacy/medicines/${item._id}`, session.token, { method: "DELETE" });
      setNotice("Medicine removed from inventory.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const filtered = medicines.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">CATALOG MANAGEMENT</p><h1>Inventory</h1><p>Search listings, update details, and keep stock accurate.</p></div><Link className="primary-action" to="/pharmacy/medicines/new">Add medicine</Link></div>
      <label className="pharmacy-filter">Search inventory<input onChange={(event) => setQuery(event.target.value)} placeholder="Medicine name" value={query} /></label>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}{notice && <p className="dashboard-message success-message" role="status">{notice}</p>}
      <div className="pharmacy-panel inventory-table-wrap">
        {loading ? <p className="pharmacy-empty">Loading inventory…</p> : error ? <p className="pharmacy-empty">Inventory is unavailable until the API connection is restored.</p> : filtered.length ? <div className="pharmacy-inventory-list">
          {filtered.map((item) => editing === item._id ? (
            <form className="pharmacy-edit-row" key={item._id} onSubmit={saveEdit}>
              <label>Name<input onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
              <label>Description<input onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></label>
              <label>Price (INR)<input min="0" onChange={(event) => setForm({ ...form, price: event.target.value })} required step="0.01" type="number" value={form.price} /></label>
              <label>Stock<input min="0" onChange={(event) => setForm({ ...form, stock: event.target.value })} required step="1" type="number" value={form.stock} /></label>
              <div><button className="primary-action" disabled={saving} type="submit">Save</button><button className="plain-action" onClick={() => setEditing(null)} type="button">Cancel</button></div>
            </form>
          ) : (
            <article className="pharmacy-inventory-row" key={item._id}>
              <MedicineImage className="pharmacy-medicine-thumb" medicine={item} />
              <div className="pharmacy-inventory-name"><strong>{item.name}</strong><span>{item.shop?.name || "Pharmacy location"}</span></div>
              <span className="pharmacy-row-price">{formatPrice(item.price)}</span>
              <span className={item.stock <= 5 ? "stock-quantity low" : "stock-quantity"}>{item.stock} in stock</span>
              <button className="plain-action" onClick={() => beginEdit(item)} type="button">Edit</button>
              <Link className="plain-action" to={`/pharmacy/medicines/${item._id}/edit`}>Image</Link>
              <button className="plain-action danger-text" onClick={() => remove(item)} type="button">Remove</button>
            </article>
          ))}
        </div> : <p className="pharmacy-empty">No matching inventory items.</p>}
      </div>
    </section>
  );
}

export default PharmacyInventoryPage;