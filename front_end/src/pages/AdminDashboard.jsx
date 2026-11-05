import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";
import { ArrowRight, ClipboardList, MessageSquareText, Pill, Store, Users } from "lucide-react";
import { Link } from "react-router-dom";
import "./admin-workspace.css";

const metrics = [
  ["customers", "Registered customers"],
  ["shops", "Pharmacies"],
  ["medicines", "Medicine listings"],
  ["orders", "Orders"],
  ["feedback", "Feedback entries"],
];

function AdminDashboard({ session }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/api/admin/summary", session.token)
      .then((data) => { if (active) setSummary(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.token]);

  return (
    <section className="admin-page">
      <div className="admin-page-heading"><div><p className="section-kicker">PLATFORM ADMINISTRATION</p><h1>Overview</h1><p>Live totals from the MediTrack database.</p></div><span className="admin-live-indicator">Connected summary</span></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      <div className="admin-metrics" aria-live="polite">
        {metrics.map(([key, label], index) => {
          const Icon = [Users, Store, Pill, ClipboardList, MessageSquareText][index];
          return <article className="admin-metric" key={key}><span className="admin-metric-icon"><Icon size={18} /></span><span>{label}</span><strong>{loading || error || !summary ? "—" : summary[key] ?? "—"}</strong></article>;
        })}
      </div>
      <div className="admin-shortcuts">
        {[["customers", "Manage customers", Users], ["pharmacies", "Manage pharmacies", Store], ["medicines", "Browse medicines", Pill], ["orders", "Monitor orders", ClipboardList], ["feedback", "Review feedback", MessageSquareText]].map(([path, label, Icon]) => <Link key={path} to={`/admin/${path}`}><Icon size={18} /><span><strong>{label}</strong><small>View live records</small></span><ArrowRight size={15} /></Link>)}
      </div>
    </section>
  );
}

export default AdminDashboard;