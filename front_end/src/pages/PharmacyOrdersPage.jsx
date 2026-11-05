import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import "./pharmacy-workspace.css";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);
const nextStatus = { pending: "confirmed", confirmed: "ready", ready: "completed" };
const actionLabel = { pending: "Confirm order", confirmed: "Mark prepared", ready: "Complete order" };

function PharmacyOrdersPage({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    try {
      const data = await apiRequest("/api/pharmacy/orders", session.token);
      setOrders(data.orders || []);
      setError("");
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [session.token]);

  async function advance(order) {
    setSavingId(order._id);
    setError("");
    try {
      await apiRequest(`/api/pharmacy/orders/${order._id}/status`, session.token, { method: "PATCH", body: { status: nextStatus[order.status] } });
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSavingId(""); }
  }

  const visible = filter === "all" ? orders : orders.filter((order) => order.status === filter);

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">FULFILMENT</p><h1>Manage orders</h1><p>Review incoming orders and update their preparation status.</p></div><Link className="plain-action" to="/pharmacy/prescriptions">Prescription documents</Link></div>
      <div className="pharmacy-filter-row"><label className="pharmacy-filter">Status<select onChange={(event) => setFilter(event.target.value)} value={filter}><option value="all">All orders</option>{["pending", "confirmed", "ready", "completed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label><span className="pharmacy-refresh-note">Refreshes every 15 seconds</span></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      <div className="pharmacy-panel">{loading ? <p className="pharmacy-empty">Loading incoming orders…</p> : error ? <p className="pharmacy-empty">Orders are unavailable until the API connection is restored.</p> : visible.length ? visible.map((order) => <article className="pharmacy-order-card" key={order._id}>
        <div className="pharmacy-order-card-head"><div><strong>{order.user?.name || "Customer"}</strong><span>{order.user?.email || "Contact details unavailable"} · {order.shop?.name || "Pharmacy"} · {new Date(order.createdAt).toLocaleString("en-IN")}</span></div><span className={`order-status status-${order.status}`}>{order.status}</span></div>
        <div className="pharmacy-order-items">{order.items.map((item) => <span key={item._id || item.medicine?._id}>{item.medicine?.name || "Medicine"} × {item.quantity} <small>{formatPrice(item.unitPrice)}</small></span>)}</div>
        <div className="pharmacy-order-card-bottom"><strong>Total {formatPrice(order.total)}</strong>{order.prescription && <Link to="/pharmacy/prescriptions">Prescription attached</Link>}{nextStatus[order.status] && <button className="primary-action" disabled={savingId === order._id} onClick={() => advance(order)} type="button">{savingId === order._id ? "Updating…" : actionLabel[order.status]}</button>}</div>
      </article>) : <p className="pharmacy-empty">No orders match this status.</p>}</div>
    </section>
  );
}

export default PharmacyOrdersPage;