import { useEffect, useState } from "react";
import { ArrowRight, MapPin, PackageCheck, Pill, Search, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import MedicineImage from "../components/MedicineImage.jsx";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

function CustomerDashboardPage() {
  const [data, setData] = useState({ shops: [], medicines: [], availableCount: 0, orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(sessionStorage.getItem("meditrack.session") || "{}")?.user;

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest("/api/pharmacy/shops"),
      apiRequest("/api/pharmacy/medicines?sort=recent"),
      apiRequest("/api/users/orders"),
    ]).then(([shops, medicines, orders]) => {
      if (active) setData({
        shops: shops.shops || [],
        medicines: medicines.medicines || [],
        availableCount: medicines.availableCount ?? medicines.medicines?.filter((medicine) => medicine.stock > 0).length ?? 0,
        orders: orders.orders || [],
      });
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="customer-page">
      <div className="customer-page-heading welcome-heading">
        <div>
          <p className="section-kicker">CUSTOMER DASHBOARD</p>
          <h1>Good to see you, {user?.name?.split(" ")[0] || "there"}</h1>
          <p>Find local medicine and keep track of your care.</p>
        </div>
        <Link className="primary-action link-action" to="/customer/medicines"><Search size={16} /> Search medicines</Link>
      </div>

      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}

      <div className="customer-metrics">
        <article className="customer-metric"><span className="metric-icon"><Pill size={18} /></span><span>Available medicines</span><strong>{loading || error ? "—" : data.availableCount}</strong></article>
        <article className="customer-metric"><span className="metric-icon"><MapPin size={18} /></span><span>Registered pharmacies</span><strong>{loading || error ? "—" : data.shops.length}</strong></article>
        <article className="customer-metric"><span className="metric-icon"><PackageCheck size={18} /></span><span>Your orders</span><strong>{loading || error ? "—" : data.orders.length}</strong></article>
      </div>

      <div className="customer-dashboard-grid">
        <section className="customer-panel" aria-labelledby="recent-medicines-title">
          <div className="customer-panel-heading"><div><p className="section-kicker">FROM LOCAL PHARMACIES</p><h2 id="recent-medicines-title">Medicine availability</h2></div><Link to="/customer/medicines">Browse all <ArrowRight size={14} /></Link></div>
          {loading ? <p className="workspace-empty">Loading listings…</p> : error ? <p className="workspace-empty">Medicine listings are unavailable until the API connection is restored.</p> : data.medicines.filter((medicine) => medicine.stock > 0).length ? (
            <div className="dashboard-medicine-list">
              {data.medicines.filter((medicine) => medicine.stock > 0).slice(0, 4).map((medicine) => (
                <article className="dashboard-medicine-row" key={medicine._id}>
                  <MedicineImage className="medicine-placeholder" medicine={medicine} />
                  <div><strong>{medicine.name}</strong><span>{medicine.description || "No description provided."}</span><span>{medicine.shop?.name || "Pharmacy"} · {medicine.stock} in stock</span></div>
                  <strong>{formatPrice(medicine.price)}</strong>
                </article>
              ))}
            </div>
          ) : <p className="workspace-empty">No medicines are currently in stock.</p>}
        </section>

        <section className="customer-panel" aria-labelledby="recent-orders-title">
          <div className="customer-panel-heading"><div><p className="section-kicker">ORDER ACTIVITY</p><h2 id="recent-orders-title">Recent orders</h2></div><Link to="/customer/orders">View all <ArrowRight size={14} /></Link></div>
          {loading ? <p className="workspace-empty">Loading orders…</p> : error ? <p className="workspace-empty">Order activity is unavailable until the API connection is restored.</p> : data.orders.length ? (
            <div className="dashboard-order-list">
              {data.orders.slice(0, 4).map((order) => (
                <article className="dashboard-order-row" key={order._id}>
                  <div><strong>{order.shop?.name || "Pharmacy"}</strong><span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span></div>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </article>
              ))}
            </div>
          ) : <p className="workspace-empty">Orders you place will appear here.</p>}
        </section>
      </div>

      <section className="customer-quick-links" aria-label="Quick actions">
        <Link to="/customer/pharmacies"><MapPin size={18} /><span><strong>Find a pharmacy</strong><small>Browse registered locations</small></span><ArrowRight size={15} /></Link>
        <Link to="/customer/cart"><ShoppingBag size={18} /><span><strong>Review your cart</strong><small>Check items before checkout</small></span><ArrowRight size={15} /></Link>
      </section>
    </section>
  );
}

export default CustomerDashboardPage;