
import { useEffect, useState } from "react";
import HeroSection from "../components/HeroSection.jsx";
import MedicineCard from "../components/MedicineCard.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import CustomerOrders from "../components/CustomerOrders.jsx";
import { apiRequest } from "../lib/api.js";
import "../App.css";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

function HomePage({ session, onSessionChange, onRequestAuth }) {
  const [query, setQuery] = useState("");
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState([]);
  const [shopsError, setShopsError] = useState("");

  const [cart, setCart] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [orderNotice, setOrderNotice] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.quantity * Number(item.medicine.price),
    0
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Load pharmacies
  useEffect(() => {
    const controller = new AbortController();

    async function loadShops() {
      try {
        setShopsError("");

        const data = await apiRequest("/api/pharmacy/shops", null, {
          signal: controller.signal,
        });
        setShops(data.shops || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setShopsError(err.message);
        }
      }
    }

    loadShops();

    return () => controller.abort();
  }, []);

  // Search medicines and filter by pharmacy
  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (query.trim()) {
          params.set("search", query.trim());
        }

        if (shopId) {
          params.set("shop", shopId);
        }

        const data = await apiRequest(`/api/pharmacy/medicines?${params}`, null, {
          signal: controller.signal,
        });
        setMedicines(data.medicines || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, shopId, refreshKey]);

  // Add medicine to cart
  function addToCart(medicine) {
    setOrderError("");
    setOrderNotice("");

    if (medicine.stock < 1) {
      setOrderError("This medicine is currently out of stock.");
      return;
    }

    if (
      cart.length > 0 &&
      cart[0].medicine.shop?._id !== medicine.shop?._id
    ) {
      setOrderError(
        "You can order medicines from only one pharmacy at a time. Clear your current order to switch pharmacies."
      );
      return;
    }

    const existing = cart.find(
      (item) => item.medicine._id === medicine._id
    );

    if (existing && existing.quantity >= medicine.stock) {
      setOrderError("Available stock limit reached.");
      return;
    }

    setCart((current) => {
      const found = current.find(
        (item) => item.medicine._id === medicine._id
      );

      if (found) {
        return current.map((item) =>
          item.medicine._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { medicine, quantity: 1 }];
    });
  }

  // Increase medicine quantity
  function increaseQuantity(medicineId) {
    setCart((current) =>
      current.map((item) => {
        if (item.medicine._id !== medicineId) return item;

        if (item.quantity >= item.medicine.stock) {
          setOrderError("Available stock limit reached.");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  }

  // Decrease medicine quantity
  function decreaseQuantity(medicineId) {
    setCart((current) =>
      current
        .map((item) =>
          item.medicine._id === medicineId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // Remove medicine from cart
  function removeFromCart(medicineId) {
    setCart((current) =>
      current.filter(
        (item) => item.medicine._id !== medicineId
      )
    );
  }

  // Place customer order
  async function placeOrder() {
    if (!session) {
      onRequestAuth();
      return;
    }

    if (!cart.length || placingOrder) return;

    setPlacingOrder(true);
    setOrderError("");
    setOrderNotice("");

    try {
      await apiRequest("/api/users/orders", session.token, {
        method: "POST",
        body: {
          shop: cart[0].medicine.shop._id,
          items: cart.map(({ medicine, quantity }) => ({
            medicine: medicine._id,
            quantity,
          })),
        },
      });

      setCart([]);
      setOrderNotice(
        "Your order has been placed successfully! Track its status below."
      );

      setRefreshKey((key) => key + 1);
      setOrdersRefreshKey((key) => key + 1);

    } catch (err) {
      setOrderError(
        err.message || "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <main className="page-shell">

      {/* Navigation */}
      <SiteHeader
        onRequestAuth={onRequestAuth}
        session={session}
        onSessionChange={onSessionChange}
      />

      {/* Hero and Search */}
      <HeroSection
        onSearchChange={setQuery}
        query={query}
      />

      {/* Medicine Catalog */}
      <section className="catalog" aria-labelledby="catalog-title">

        <div className="catalog-heading">
          <div>
            <p className="section-kicker">
              LOCAL PHARMACIES
            </p>

            <h2 id="catalog-title">
              Find what you need
            </h2>
          </div>

          <span className="result-count">
            {loading
              ? "Searching..."
              : `${medicines.length} ${
                  medicines.length === 1 ? "result" : "results"
                }`}
          </span>
        </div>

        {/* Pharmacy Filter */}
        <div className="catalog-filters">
          <label className="filter-field">
            Pharmacy

            <select
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
            >
              <option value="">All pharmacies</option>

              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </label>

          {shopsError && (
            <span className="filter-error" role="status">
              {shopsError}
            </span>
          )}
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <section
            className="order-summary"
            aria-label="Shopping cart"
          >
            <div className="order-summary-heading">
              <div>
                <p className="section-kicker">
                  YOUR ORDER
                </p>

                <h3>
                  {cart[0].medicine.shop?.name}
                </h3>
              </div>

              <span>
                {cartCount} items
              </span>
            </div>

            {cart.map(({ medicine, quantity }) => (
              <div
                className="cart-line"
                key={medicine._id}
              >
                <span>{medicine.name}</span>

                <div className="cart-quantity">
                  <button
                    type="button"
                    onClick={() =>
                      decreaseQuantity(medicine._id)
                    }
                    aria-label={`Decrease ${medicine.name} quantity`}
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      increaseQuantity(medicine._id)
                    }
                    aria-label={`Increase ${medicine.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <span>
                  {formatPrice(
                    medicine.price * quantity
                  )}
                </span>

                <button
                  type="button"
                  aria-label={`Remove ${medicine.name}`}
                  onClick={() =>
                    removeFromCart(medicine._id)
                  }
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="order-summary-footer">
              <strong>
                Total: {formatPrice(cartTotal)}
              </strong>

              <button
                className="primary-action"
                disabled={placingOrder}
                onClick={placeOrder}
                type="button"
              >
                {placingOrder
                  ? "Placing order..."
                  : session
                    ? "Place order"
                    : "Sign in to order"}
              </button>
            </div>

            <button
              className="clear-cart"
              type="button"
              onClick={() => {
                setCart([]);
                setOrderError("");
              }}
            >
              Clear cart
            </button>
          </section>
        )}

        {/* Order Messages */}
        {orderError && (
          <p
            className="dashboard-message error-message"
            role="alert"
          >
            {orderError}
          </p>
        )}

        {orderNotice && (
          <p
            className="dashboard-message success-message"
            role="status"
          >
            {orderNotice}
          </p>
        )}

        {/* Medicine Results */}
        {error ? (
          <div className="empty-state" role="alert">
            <span className="empty-icon">!</span>

            <h3>
              We couldn't reach the pharmacy list
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>

        ) : loading ? (
          <div
            className="loading-state"
            aria-live="polite"
          >
            Finding available medicines...
          </div>

        ) : medicines.length > 0 ? (
          <div className="medicine-grid">
            {medicines.map((medicine) => (
              <MedicineCard
                key={medicine._id}
                medicine={medicine}
                onAddToCart={addToCart}
              />
            ))}
          </div>

        ) : (
          <div className="empty-state">
            <span className="empty-icon">⌕</span>

            <h3>
              {query
                ? "No matching medicines found"
                : "Your local listings will appear here"}
            </h3>

            <p>
              {query
                ? "Try another medicine name or check back later."
                : "Search for a medicine to see availability from local pharmacies."}
            </p>
          </div>
        )}

      </section>

      {/* Customer Order History */}
      {session?.user.role === "user" && (
        <CustomerOrders
          refreshKey={ordersRefreshKey}
          session={session}
        />
      )}

      {/* Footer */}
      <footer id="how-it-works">
        <span className="footer-brand">
          MediTrack
        </span>

        <span>
          Helping you find care, one search at a time.
        </span>
      </footer>

    </main>
  );
}

export default HomePage;
