import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { apiRequest } from "../lib/api.js";
import MedicineImage from "../components/MedicineImage.jsx";
import "./admin-workspace.css";

const resourceConfig = {
  customers: { title: "Customers", endpoint: "/api/admin/customers", key: "customers", search: true },
  pharmacies: { title: "Pharmacies", endpoint: "/api/admin/pharmacies", key: "pharmacies", search: true },
  medicines: { title: "Medicines", endpoint: "/api/admin/medicines", key: "medicines", search: true },
  orders: { title: "Orders", endpoint: "/api/admin/orders", key: "orders", status: true },
  feedback: { title: "Feedback", endpoint: "/api/admin/feedback", key: "feedback" },
};

function AdminManagementPage({ resource, session }) {
  const config = resourceConfig[resource];
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    apiRequest(`${config.endpoint}?${params}`, session.token)
      .then((data) => {
        if (active) {
          setRecords(data[config.key] || []);
          setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
          setError("");
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [config, page, search, status, session.token]);

  async function toggleActive(record, collection) {
    const endpoint = collection === "customers"
      ? `/api/admin/customers/${record._id}/status`
      : `/api/admin/pharmacies/${record._id}/status`;
    try {
      await apiRequest(endpoint, session.token, { method: "PATCH", body: { active: record.active === false } });
      setRecords((current) => current.map((item) => item._id === record._id ? { ...item, active: record.active === false } : item));
    } catch (requestError) { setError(requestError.message); }
  }

  if (!config) return null;

  return (
    <section className="admin-page">
      <div className="admin-page-heading"><div><p className="section-kicker">PLATFORM MANAGEMENT</p><h1>{config.title}</h1><p>{pagination.total} records from the live database.</p>{resource === "medicines" && <p>Catalog is read-only here; admin medicine changes are not exposed by the current API.</p>}</div></div>
      <div className="admin-list-controls">
        {config.search && <label className="admin-search"><Search size={16} /><input onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${config.title.toLowerCase()}`} value={search} /></label>}
        {config.status && <label className="admin-status-filter">Status<select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="all">All statuses</option>{["pending", "confirmed", "ready", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
      </div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading records…</div> : error ? <div className="admin-empty">{config.title} could not be loaded from the API.</div> : records.length ? (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{resource === "customers" ? <><th>Customer</th><th>Email</th><th>Locality</th><th>Joined</th><th>Account</th><th /></> : resource === "pharmacies" ? <><th>Pharmacy</th><th>Owner</th><th>Address</th><th>Locality</th><th>Status</th><th /></> : resource === "medicines" ? <><th>Medicine</th><th>Description</th><th>Pharmacy</th><th>Price</th><th>Stock</th></> : resource === "orders" ? <><th>Order</th><th>Customer</th><th>Pharmacy</th><th>Total</th><th>Status</th><th>Placed</th></> : <><th>Customer</th><th>Pharmacy</th><th>Rating</th><th>Comment</th><th>Date</th></>}</tr></thead>
            <tbody>{records.map((record) => resource === "customers" ? <tr key={record._id}><td>{record.name}</td><td>{record.email}</td><td>{record.locality || "—"}</td><td>{new Date(record.createdAt).toLocaleDateString("en-IN")}</td><td><span className={record.active === false ? "admin-state inactive" : "admin-state"}>{record.active === false ? "Inactive" : "Active"}</span></td><td><button className="admin-row-action" onClick={() => toggleActive(record, "customers")} type="button">{record.active === false ? "Reactivate" : "Deactivate"}</button></td></tr>
              : resource === "pharmacies" ? <tr key={record._id}><td>{record.name}</td><td>{record.owner?.name || record.owner?.email || "—"}</td><td>{record.address}</td><td>{record.locality || "—"}</td><td><span className={record.active === false ? "admin-state inactive" : "admin-state"}>{record.active === false ? "Inactive" : "Active"}</span></td><td><button className="admin-row-action" onClick={() => toggleActive(record, "pharmacies")} type="button">{record.active === false ? "Reactivate" : "Deactivate"}</button></td></tr>
              : resource === "medicines" ? <tr key={record._id}><td><div className="admin-medicine-cell"><MedicineImage className="admin-medicine-thumb" medicine={record} /><span>{record.name}</span></div></td><td>{record.description || "—"}</td><td>{record.shop?.name || "—"}</td><td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.price)}</td><td>{record.stock}</td></tr>
              : resource === "orders" ? <tr key={record._id}><td>{record._id.slice(-8).toUpperCase()}</td><td>{record.user?.name || record.user?.email || "—"}</td><td>{record.shop?.name || "—"}</td><td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.total)}</td><td><span className={`order-status status-${record.status}`}>{record.status}</span></td><td>{new Date(record.createdAt).toLocaleDateString("en-IN")}</td></tr>
              : <tr key={record._id}><td>{record.user?.name || "—"}</td><td>{record.shop?.name || "—"}</td><td>{"★".repeat(record.rating)}{"☆".repeat(5 - record.rating)}</td><td className="admin-comment">{record.comment || "—"}</td><td>{new Date(record.createdAt).toLocaleDateString("en-IN")}</td></tr>)}</tbody>
          </table></div>
        ) : <div className="admin-empty">No {config.title.toLowerCase()} records found.</div>}
      </div>
      <div className="admin-pagination"><span>Page {pagination.page || page} of {Math.max(1, pagination.pages || 1)}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><button disabled={loading || page >= (pagination.pages || 1)} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div></div>
    </section>
  );
}

export default AdminManagementPage;