import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, MapPin, PackagePlus, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import "./pharmacy-workspace.css";

function PharmacyOverviewPage({ session }) {
  const [inventory, setInventory] = useState({ shops: [], medicines: [] });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([apiRequest("/api/pharmacy/inventory", session.token), apiRequest("/api/pharmacy/orders", session.token)])
      .then(([inventoryData, orderData]) => {
        if (active) {
          setInventory(inventoryData);
          setOrders(orderData.orders || []);
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.token]);

  const pending = orders.filter((order) => order.status === "pending").length;
  const completed = orders.filter((order) => order.status === "completed").length;
  const units = inventory.medicines.reduce((total, medicine) => total + medicine.stock, 0);

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">PHARMACY OVERVIEW</p><h1>Welcome, {session.user.name?.split(" ")[0] || "pharmacy"}</h1><p>Current activity across your registered locations.</p></div><Link className="primary-action" to="/pharmacy/medicines/new"><PackagePlus size={16} /> Add medicine</Link></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      <div className="pharmacy-metrics">
        <article><span className="pharmacy-metric-icon"><Pill size={17} /></span><span>Medicine listings</span><strong>{loading || error ? "—" : inventory.medicines.length}</strong></article>
        <article><span className="pharmacy-metric-icon"><PackagePlus size={17} /></span><span>Available units</span><strong>{loading || error ? "—" : units}</strong></article>
        <article><span className="pharmacy-metric-icon"><ClipboardList size={17} /></span><span>Completed orders</span><strong>{loading || error ? "—" : completed}</strong></article>
        <article><span className="pharmacy-metric-icon"><ClipboardList size={17} /></span><span>Pending orders</span><strong>{loading || error ? "—" : pending}</strong></article>
      </div>
      <section className="pharmacy-panel">
        <div className="pharmacy-panel-heading"><div><p className="section-kicker">RECENT ACTIVITY</p><h2>Incoming orders</h2></div><Link to="/pharmacy/orders">Manage orders <ArrowRight size={14} /></Link></div>
        {loading ? <p className="pharmacy-empty">Loading pharmacy activity…</p> : error ? <p className="pharmacy-empty">Pharmacy activity is unavailable until the API connection is restored.</p> : orders.length ? orders.slice(0, 5).map((order) => <article className="pharmacy-overview-order" key={order._id}><div><strong>{order.user?.name || "Customer"}</strong><span>{order.items.map((item) => `${item.medicine?.name || "Medicine"} × ${item.quantity}`).join(", ")}</span></div><span className={`order-status status-${order.status}`}>{order.status}</span></article>) : <p className="pharmacy-empty">Customer orders will appear here when placed.</p>}
      </section>
      <div className="pharmacy-shortcuts"><Link to="/pharmacy/inventory"><Pill size={18} /><span><strong>Review inventory</strong><small>Update available stock and listings</small></span><ArrowRight size={15} /></Link><Link to="/pharmacy/profile"><MapPin size={18} /><span><strong>Pharmacy profile</strong><small>{inventory.shops.length} locations</small></span><ArrowRight size={15} /></Link></div>
    </section>
  );
}

export default PharmacyOverviewPage;