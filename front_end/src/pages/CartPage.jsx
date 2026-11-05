import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../customer/CartProvider.jsx";
import { apiRequest } from "../lib/api.js";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

function CartPage() {
  const { cart, setQuantity, removeFromCart, clearCart, total } = useCart();
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  async function checkout() {
    if (!cart.length || placing) return;
    setPlacing(true);
    setError("");
    try {
      await apiRequest("/api/users/orders", null, {
        method: "POST",
        body: { shop: cart[0].medicine.shop._id, items: cart.map(({ medicine, quantity }) => ({ medicine: medicine._id, quantity })) },
      });
      clearCart();
      navigate("/customer/orders", { state: { placed: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section className="customer-page">
      <div className="customer-page-heading"><div><p className="section-kicker">CHECKOUT</p><h1>Your cart</h1><p>{cart[0]?.medicine.shop?.name || "Review your medicine selection."}</p></div></div>
      {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
      {cart.length ? (
        <div className="cart-page-layout">
          <div className="cart-page-items">
            {cart.map(({ medicine, quantity }) => (
              <article className="cart-page-item" key={medicine._id}>
                <span className="medicine-placeholder">✚</span>
                <div className="cart-page-copy"><strong>{medicine.name}</strong><span>{formatPrice(medicine.price)} each</span></div>
                <div className="cart-page-quantity"><button aria-label={`Decrease ${medicine.name}`} onClick={() => setQuantity(medicine._id, quantity - 1)} type="button">−</button><span>{quantity}</span><button aria-label={`Increase ${medicine.name}`} onClick={() => setQuantity(medicine._id, quantity + 1)} type="button">+</button></div>
                <strong>{formatPrice(Number(medicine.price) * quantity)}</strong>
                <button className="text-action" onClick={() => removeFromCart(medicine._id)} type="button">Remove</button>
              </article>
            ))}
          </div>
          <aside className="checkout-summary"><h2>Order summary</h2><div><span>Items</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></div><div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div><small>Final availability is confirmed by the pharmacy when the order is placed.</small><button className="primary-action" disabled={placing} onClick={checkout} type="button">{placing ? "Placing order…" : "Place order"}</button></aside>
        </div>
      ) : <div className="workspace-empty cart-empty">Your cart is empty. <Link to="/customer/medicines">Find a medicine</Link></div>}
    </section>
  );
}

export default CartPage;