import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

const statuses = ["pending", "confirmed", "ready", "completed"];
const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiRequest("/api/users/orders");
        if (active) { setOrders(data.orders || []); setError(""); }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">ORDER ACTIVITY</p><h1>My orders</h1><p>Order statuses refresh automatically while this page is open.</p></div></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {loading ? <div className="workspace-empty">Loading your orders…</div> : orders.length ? (
        <div className="customer-orders-list">
          {orders.map((order) => {
            const currentStep = statuses.indexOf(order.status);
            return (
              <article className="customer-order-card" key={order._id}>
                <div className="customer-order-card-heading"><div><h2>{order.shop?.name || "Pharmacy"}</h2><span>Order #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleString("en-IN")}</span></div><strong>{formatPrice(order.total)}</strong></div>
                <p className="customer-order-items">{order.items.map((item) => `${item.medicine?.name || "Medicine"} × ${item.quantity}`).join(" · ")}</p>
                {order.status === "cancelled" ? <span className="order-status status-cancelled">Cancelled</span> : <ol className="order-timeline" aria-label={`Order status: ${order.status}`}>
                  {statuses.map((status, index) => <li className={index <= currentStep ? "complete" : ""} key={status}><span />{status}</li>)}
                </ol>}
                {order.shop?.address && <p className="order-pharmacy-address">{order.shop.address}</p>}
              </article>
            );
          })}
        </div>
      ) : <div className="workspace-empty">{error ? "Your orders could not be loaded. Please try again when the API is available." : "Your placed orders will appear here."}</div>}
    </section>
  );
}

export default MyOrdersPage;