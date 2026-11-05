import { useEffect, useRef, useState } from "react";
import { Download, FileText, ShieldCheck, Upload } from "lucide-react";
import { api, apiRequest } from "../lib/api.js";

function PrescriptionUploadPage() {
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [orderData, prescriptionData] = await Promise.all([
        apiRequest("/api/users/orders"),
        apiRequest("/api/prescriptions/my"),
      ]);
      setOrders(orderData.orders || []);
      setPrescriptions(prescriptionData.prescriptions || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : "");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!file || !orderId) {
      setError("Choose an order and a prescription file.");
      return;
    }
    const body = new FormData();
    body.append("orderId", orderId);
    body.append("file", file);
    setUploading(true);
    setProgress(0);
    setError("");
    setNotice("");
    try {
      await apiRequest("/api/prescriptions/upload", null, {
        method: "POST",
        body,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setNotice("Prescription attached to your order.");
      setFile(null);
      setPreviewUrl("");
      if (inputRef.current) inputRef.current.value = "";
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  async function download(prescription) {
    setError("");
    try {
      const { data } = await api.get(`/prescriptions/${prescription._id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = prescription.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not download this prescription.");
    }
  }

  const eligibleOrders = orders.filter((order) => order.status !== "cancelled");

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">PRIVATE DOCUMENTS</p><h1>Prescriptions</h1><p>Attach a prescription to an order for its pharmacy to review securely.</p></div></div>
      <div className="prescription-privacy-note"><ShieldCheck size={18} /><span>Only you and the pharmacy handling the selected order can access prescription files.</span></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {notice && <p className="dashboard-message success-message" role="status">{notice}</p>}
      <form className="prescription-form customer-panel" onSubmit={submit}>
        <label>Order<select onChange={(event) => setOrderId(event.target.value)} required value={orderId}><option value="">Select an order</option>{eligibleOrders.map((order) => <option key={order._id} value={order._id}>{order.shop?.name || "Pharmacy"} · {new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.status}</option>)}</select></label>
        <label className="prescription-file-label">Prescription file<input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={chooseFile} ref={inputRef} required type="file" /> <small>PDF, JPG or PNG · up to 10 MB</small></label>
        {file && <div className="prescription-preview">
          {file.type.startsWith("image/") ? <img alt="Selected prescription preview" src={previewUrl} /> : <div><FileText size={28} /><span>{file.name}</span></div>}
        </div>}
        {uploading && <div aria-label={`Upload progress ${progress}%`} className="upload-progress"><span style={{ width: `${progress}%` }} /></div>}
        <button className="primary-action" disabled={uploading || !eligibleOrders.length} type="submit"><Upload size={15} />{uploading ? `Uploading ${progress}%` : "Upload prescription"}</button>
        {!loading && !eligibleOrders.length && <p className="prescription-empty-hint">Place an order before attaching a prescription.</p>}
      </form>
      <section className="prescription-list-section" aria-labelledby="saved-prescriptions-title">
        <div className="customer-panel-heading"><div><p className="section-kicker">ORDER DOCUMENTS</p><h2 id="saved-prescriptions-title">Uploaded prescriptions</h2></div></div>
        {loading ? <div className="workspace-empty">Loading documents…</div> : prescriptions.length ? prescriptions.map((prescription) => (
          <article className="prescription-row" key={prescription._id}>
            <FileText size={20} />
            <div><strong>{prescription.originalName}</strong><span>{prescription.order?.status || "Order"} · {new Date(prescription.createdAt).toLocaleDateString("en-IN")}</span></div>
            <button aria-label={`Download ${prescription.originalName}`} className="icon-action" onClick={() => download(prescription)} type="button"><Download size={16} /></button>
          </article>
        )) : <div className="workspace-empty">No prescriptions uploaded yet.</div>}
      </section>
    </section>
  );
}

export default PrescriptionUploadPage;