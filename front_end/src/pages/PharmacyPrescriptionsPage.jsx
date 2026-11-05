import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { api } from "../lib/api.js";
import "./pharmacy-workspace.css";

function PharmacyPrescriptionsPage({ session }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/pharmacy/prescriptions").then(({ data }) => { if (active) setPrescriptions(data.prescriptions || []); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Could not load prescriptions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.token]);

  async function download(prescription) {
    try {
      const { data } = await api.get(`/prescriptions/${prescription._id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = prescription.originalName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not download prescription."); }
  }

  return (
    <section className="pharmacy-page">
      <div className="pharmacy-page-heading"><div><p className="section-kicker">PRIVATE ORDER DOCUMENTS</p><h1>Prescriptions</h1><p>Only prescriptions associated with your pharmacy orders are listed here.</p></div></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      <div className="pharmacy-panel">{loading ? <p className="pharmacy-empty">Loading documents…</p> : prescriptions.length ? prescriptions.map((item) => <article className="pharmacy-prescription-row" key={item._id}><FileText size={20} /><div><strong>{item.originalName}</strong><span>{item.user?.name || "Customer"} · {item.order?.status || "Order"} · {new Date(item.createdAt).toLocaleDateString("en-IN")}</span></div><button aria-label={`Download ${item.originalName}`} className="icon-action" onClick={() => download(item)} type="button"><Download size={16} /></button></article>) : <p className="pharmacy-empty">No prescriptions are associated with your pharmacy orders.</p>}</div>
    </section>
  );
}

export default PharmacyPrescriptionsPage;