import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";
import "../App.css";

function CustomerOrders({ session, refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest("/api/users/orders", session.token)
      .then((data) => { if (active) setOrders(data.orders); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.token, refreshKey]);

  return (
    <section className="customer-orders" aria-labelledby="customer-orders-title">
      <div className="catalog-heading">
        <div><p className="section-kicker">ORDER ACTIVITY</p><h2 id="customer-orders-title">Your orders</h2></div>
        <span className="result-count">{loading ? "Loading…" : `${orders.length} orders`}</span>
      </div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {loading ? <p className="panel-empty">Loading your order history…</p> : orders.length ? (
        <div className="customer-order-list">
          {orders.map((order) => (
            <article className="customer-order-row" key={order._id}>
              <div>
                <strong>{order.shop?.name || "Pharmacy"}</strong>
                <span>{order.items.map((item) => `${item.medicine?.name || "Medicine"} × ${item.quantity}`).join(", ")}</span>
                <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time>
              </div>
              <div className="customer-order-total">
                <strong>${Number(order.total).toFixed(2)}</strong>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="panel-empty">Orders you place will appear here with their latest status.</p>}
    </section>
  );
}

export default CustomerOrders;