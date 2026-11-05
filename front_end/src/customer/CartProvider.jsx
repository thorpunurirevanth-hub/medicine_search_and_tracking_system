import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";

const CartContext = createContext(null);

function readCart(key) {
  if (!key) return [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { session } = useAuth();
  const userId = session?.user?.id || session?.user?._id;
  const key = userId ? `meditrack.cart.${userId}` : null;
  const [cart, setCart] = useState(() => readCart(key));

  useEffect(() => {
    setCart(readCart(key));
  }, [key]);

  useEffect(() => {
    if (key) sessionStorage.setItem(key, JSON.stringify(cart));
  }, [cart, key]);

  function addToCart(medicine) {
    if (!medicine.shop?._id || medicine.stock < 1) return false;
    const currentShop = cart[0]?.medicine.shop?._id;
    if (currentShop && currentShop !== medicine.shop._id) return false;

    const existing = cart.find((item) => item.medicine._id === medicine._id);
    if (existing?.quantity >= medicine.stock) return false;

    setCart((items) => {
      const current = items.find((item) => item.medicine._id === medicine._id);
      return current
        ? items.map((item) => item.medicine._id === medicine._id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
        : [...items, { medicine, quantity: 1 }];
    });
    return true;
  }

  function setQuantity(medicineId, quantity) {
    setCart((items) => items
      .map((item) => item.medicine._id === medicineId
        ? { ...item, quantity: Math.max(0, Math.min(item.medicine.stock, quantity)) }
        : item)
      .filter((item) => item.quantity > 0));
  }

  function clearCart() {
    setCart([]);
    if (key) sessionStorage.removeItem(key);
  }

  const value = useMemo(() => ({
    cart,
    addToCart,
    setQuantity,
    removeFromCart: (medicineId) => setCart((items) => items.filter((item) => item.medicine._id !== medicineId)),
    clearCart,
    count: cart.reduce((total, item) => total + item.quantity, 0),
    total: cart.reduce((sum, item) => sum + Number(item.medicine.price) * item.quantity, 0),
  }), [cart, key]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used within CartProvider.");
  return cart;
}