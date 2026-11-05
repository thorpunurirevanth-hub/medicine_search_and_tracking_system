import { useEffect, useState } from "react";
import { Check, Search } from "lucide-react";
import { apiRequest } from "../lib/api.js";
import { useCart } from "../customer/CartProvider.jsx";
import MedicineImage from "../components/MedicineImage.jsx";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

function MedicineSearchPage() {
  const [query, setQuery] = useState("");
  const [shop, setShop] = useState("");
  const [shops, setShops] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shopsError, setShopsError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    apiRequest("/api/pharmacy/shops")
      .then((data) => {
        setShops(data.shops || []);
        setShopsError("");
      })
      .catch((requestError) => setShopsError(requestError.message));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (shop) params.set("shop", shop);
      try {
        const data = await apiRequest(`/api/pharmacy/medicines?${params}`, null, { signal: controller.signal });
        setMedicines(data.medicines || []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, shop]);

  function handleAdd(medicine) {
    if (addToCart(medicine)) {
      setError("");
      setNotice(`${medicine.name} added to your cart.`);
    } else {
      setNotice("");
      setError("Your cart can contain available medicines from one pharmacy at a time, and quantities cannot exceed stock.");
    }
  }

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">MEDICINE CATALOG</p><h1>Search medicines</h1><p>Availability and pricing are loaded from registered pharmacies.</p></div></div>
      <div className="medicine-search-controls">
        <label className="search-control"><Search aria-hidden="true" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Search by medicine name" value={query} /></label>
        <label className="pharmacy-select">Pharmacy<select onChange={(event) => setShop(event.target.value)} value={shop}><option value="">All pharmacies</option>{shops.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
      </div>
      {notice && <p className="dashboard-message success-message" role="status"><Check size={15} /> {notice}</p>}
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {shopsError && <p className="dashboard-message error-message" role="alert">Could not load pharmacy filters: {shopsError}</p>}
      {loading ? <div className="workspace-empty">Loading medicines…</div> : error ? <div className="workspace-empty">Medicine search is unavailable until the API connection is restored.</div> : medicines.length ? (
        <div className="customer-medicine-grid">
          {medicines.map((medicine) => (
            <article className="customer-medicine-card" key={medicine._id}>
              <div className="customer-medicine-image"><MedicineImage className="medicine-photo" medicine={medicine} /></div>
              <div className="customer-medicine-copy"><h2>{medicine.name}</h2><p>{medicine.description || "Medicine listing from a registered pharmacy."}</p><div className="medicine-stock-note">{medicine.stock > 0 ? `${medicine.stock} available` : "Out of stock"}</div></div>
              <div className="customer-medicine-meta"><span>{medicine.shop?.name || "Pharmacy"}</span><span>{medicine.shop?.address || "Address not provided"}</span><strong>{formatPrice(medicine.price)}</strong></div>
              <button className="primary-action" disabled={medicine.stock < 1} onClick={() => handleAdd(medicine)} type="button">Add to cart</button>
            </article>
          ))}
        </div>
      ) : <div className="workspace-empty">{query ? "No matching medicines found." : "No medicine listings are available yet."}</div>}
    </section>
  );
}

export default MedicineSearchPage;