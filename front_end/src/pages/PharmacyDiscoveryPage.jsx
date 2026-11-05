import { useEffect, useState } from "react";
import { MapPin, Navigation, Phone, Pill } from "lucide-react";
import { api } from "../lib/api.js";

function PharmacyDiscoveryPage() {
  const [locality, setLocality] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationState, setLocationState] = useState("idle");

  async function loadShops(params = {}) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/pharmacy/shops", { params });
      setShops(data.shops || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load pharmacy locations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadShops(); }, []);

  function searchLocality(event) {
    event.preventDefault();
    setLocationState("idle");
    loadShops(locality.trim() ? { locality: locality.trim() } : {});
  }

  function findNearby() {
    if (!navigator.geolocation) {
      setError("Location search is not supported in this browser. Search by locality instead.");
      return;
    }
    setLocationState("requesting");
    setError("");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      setLocationState("located");
      setLoading(true);
      try {
        const { data } = await api.get("/pharmacy/nearby", { params: { latitude: coords.latitude, longitude: coords.longitude } });
        setShops(data.shops || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Could not search nearby pharmacies.");
      } finally {
        setLoading(false);
      }
    }, (geoError) => {
      setLocationState("denied");
      setError(geoError.code === geoError.PERMISSION_DENIED
        ? "Location access was declined. Search by locality to find registered pharmacies."
        : "Your location could not be determined. Search by locality instead.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">LOCAL CARE</p><h1>Find a pharmacy</h1><p>Search registered pharmacies by locality or use your location when you choose.</p></div></div>
      <form className="pharmacy-search-form" onSubmit={searchLocality}>
        <label className="search-control"><MapPin size={17} /><input onChange={(event) => setLocality(event.target.value)} placeholder="Enter a locality or area" value={locality} /></label>
        <button className="primary-action" type="submit">Search locality</button>
        <button className="secondary-action nearby-button" disabled={locationState === "requesting"} onClick={findNearby} type="button"><Navigation size={15} /> {locationState === "requesting" ? "Finding…" : "Use my location"}</button>
      </form>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {locationState === "located" && <p className="location-disclaimer">Distances are shown only for pharmacies with saved coordinates.</p>}
      {loading ? <div className="workspace-empty">Loading pharmacies…</div> : shops.length ? (
        <div className="pharmacy-list">
          {shops.map((shop) => (
            <article className="pharmacy-list-item" key={shop._id}>
              <span className="pharmacy-list-icon"><Pill size={20} /></span>
              <div className="pharmacy-list-copy"><h2>{shop.name}</h2><p><MapPin size={14} /> {shop.address}{shop.locality ? `, ${shop.locality}` : ""}</p>{shop.phone && <a href={`tel:${shop.phone}`}><Phone size={13} /> {shop.phone}</a>}</div>
              {Number.isFinite(shop.distanceKm) && <span className="pharmacy-distance">{shop.distanceKm.toFixed(1)} km</span>}
            </article>
          ))}
        </div>
      ) : <div className="workspace-empty">No registered pharmacies match this search.</div>}
    </section>
  );
}

export default PharmacyDiscoveryPage;