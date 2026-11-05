import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import { apiRequest } from "../lib/api.js";
import "../App.css";

function PharmacyDashboard({ session, onSessionChange, onRequestAuth }) {
  const [inventory, setInventory] = useState({ shops: [], medicines: [] });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medicine, setMedicine] = useState({ name: "", description: "", price: "", stock: "0", shop: "" });

  useEffect(() => {
    let active = true;
    async function loadInventory() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/api/pharmacy/inventory", session.token);
        if (active) {
          setInventory(data);
          setMedicine((current) => ({ ...current, shop: current.shop || data.shops[0]?._id || "" }));
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInventory();
    return () => { active = false; };
  }, [session.token, refreshKey]);

  useEffect(() => {
    let active = true;
    apiRequest("/api/pharmacy/orders", session.token)
      .then((data) => { if (active) setOrders(data.orders); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [session.token, refreshKey]);

  async function submitShop(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/api/pharmacy/shops", session.token, { method: "POST", body });
      setCreating(false);
      setNotice("Pharmacy location added.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMedicine(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/api/pharmacy/medicines", session.token, { method: "POST", body: medicine });
      setMedicine((current) => ({ ...current, name: "", description: "", price: "", stock: "0" }));
      setNotice("Medicine added to inventory.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStock(event, medicineId) {
    event.preventDefault();
    const stock = new FormData(event.currentTarget).get("stock");
    setError("");
    try {
      await apiRequest(`/api/pharmacy/medicines/${medicineId}`, session.token, {
        method: "PATCH",
        body: { stock },
      });
      setNotice("Inventory quantity updated.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeMedicine(medicineId) {
    if (!window.confirm("Remove this medicine from your inventory?")) return;
    setError("");
    try {
      await apiRequest(`/api/pharmacy/medicines/${medicineId}`, session.token, { method: "DELETE" });
      setNotice("Medicine removed from inventory.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function advanceOrder(order) {
    const nextStatus = { pending: "confirmed", confirmed: "ready", ready: "completed" }[order.status];
    if (!nextStatus) return;
    setError("");
    try {
      await apiRequest(`/api/pharmacy/orders/${order._id}/status`, session.token, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setNotice("Order status updated.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page-shell">
      <SiteHeader onRequestAuth={onRequestAuth} session={session} onSessionChange={onSessionChange} />
      <section className="dashboard" aria-labelledby="dashboard-title">
        <div className="dashboard-heading">
          <div>
            <p className="section-kicker">PHARMACY WORKSPACE</p>
            <h1 id="dashboard-title">Inventory</h1>
            <p>Manage your locations and keep medicine availability current.</p>
          </div>
          <button className="secondary-action" onClick={() => setCreating((value) => !value)} type="button">
            {creating ? "Close location form" : "Add location"}
          </button>
        </div>

        {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
        {notice && <p className="dashboard-message success-message" role="status">{notice}</p>}

        {creating && (
          <form className="dashboard-panel dashboard-form" onSubmit={submitShop}>
            <h2>Pharmacy location</h2>
            <div className="dashboard-form-grid">
              <label>Location name<input name="name" required /></label>
              <label>Address<input autoComplete="street-address" name="address" required /></label>
              <label>Phone<input autoComplete="tel" name="phone" /></label>
            </div>
            <button className="primary-action" disabled={submitting} type="submit">Save location</button>
          </form>
        )}

        <div className="dashboard-summary">
          <div><strong>{inventory.shops.length}</strong><span>Locations</span></div>
          <div><strong>{inventory.medicines.length}</strong><span>Medicine listings</span></div>
        </div>

        {inventory.shops.length > 0 && (
          <form className="dashboard-panel dashboard-form" onSubmit={submitMedicine}>
            <h2>Add medicine</h2>
            <div className="dashboard-form-grid">
              <label>Medicine name<input onChange={(event) => setMedicine({ ...medicine, name: event.target.value })} required value={medicine.name} /></label>
              <label>Pharmacy location
                <select onChange={(event) => setMedicine({ ...medicine, shop: event.target.value })} value={medicine.shop}>
                  {inventory.shops.map((shop) => <option key={shop._id} value={shop._id}>{shop.name}</option>)}
                </select>
              </label>
              <label>Price<input min="0" onChange={(event) => setMedicine({ ...medicine, price: event.target.value })} required step="0.01" type="number" value={medicine.price} /></label>
              <label>Quantity<input min="0" onChange={(event) => setMedicine({ ...medicine, stock: event.target.value })} required step="1" type="number" value={medicine.stock} /></label>
              <label className="form-wide">Description<input onChange={(event) => setMedicine({ ...medicine, description: event.target.value })} value={medicine.description} /></label>
            </div>
            <button className="primary-action" disabled={submitting} type="submit">Add to inventory</button>
          </form>
        )}

        <section className="dashboard-panel inventory-panel" aria-labelledby="inventory-title">
          <div className="panel-heading">
            <h2 id="inventory-title">Current listings</h2>
            <span>{loading ? "Loading…" : `${inventory.medicines.length} items`}</span>
          </div>
          {loading ? <p className="panel-empty">Loading pharmacy inventory…</p> : inventory.medicines.length ? (
            <div className="inventory-list">
              {inventory.medicines.map((item) => (
                <article className="inventory-row" key={item._id}>
                  <div className="inventory-item-name">
                    <strong>{item.name}</strong>
                    <span>{item.shop?.name} · ${Number(item.price).toFixed(2)}</span>
                  </div>
                  <form className="stock-form" onSubmit={(event) => updateStock(event, item._id)}>
                    <label htmlFor={`stock-${item._id}`}>Stock</label>
                    <input defaultValue={item.stock} id={`stock-${item._id}`} min="0" name="stock" required type="number" />
                    <button className="secondary-action" type="submit">Update</button>
                  </form>
                  <button aria-label={`Remove ${item.name}`} className="remove-action" onClick={() => removeMedicine(item._id)} type="button">Remove</button>
                </article>
              ))}
            </div>
          ) : <p className="panel-empty">No listings yet. Add a medicine to make your stock discoverable.</p>}
        </section>

        <section className="dashboard-panel inventory-panel" aria-labelledby="orders-title">
          <div className="panel-heading">
            <h2 id="orders-title">Customer orders</h2>
            <span>{orders.length} orders</span>
          </div>
          {orders.length ? (
            <div className="inventory-list">
              {orders.map((order) => (
                <article className="pharmacy-order-row" key={order._id}>
                  <div className="inventory-item-name">
                    <strong>{order.user?.name || "Customer"} · ${Number(order.total).toFixed(2)}</strong>
                    <span>{order.items.map((item) => `${item.medicine?.name || "Medicine"} × ${item.quantity}`).join(", ")}</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                  {order.status !== "completed" && (
                    <button className="secondary-action" onClick={() => advanceOrder(order)} type="button">
                      {{ pending: "Confirm", confirmed: "Mark ready", ready: "Complete" }[order.status]}
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : <p className="panel-empty">No customer orders yet.</p>}
        </section>
      </section>
    </main>
  );
}

export default PharmacyDashboard;