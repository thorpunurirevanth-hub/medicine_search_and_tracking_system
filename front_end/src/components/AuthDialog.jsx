import { useState } from "react";
import { apiRequest } from "../lib/api.js";

function AuthDialog({ onAuthenticated, onClose }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const requestBody = mode === "login"
        ? { email, password }
        : {
            name,
            email,
            password,
            role,
            ...(role === "pharmacy"
              ? { pharmacy: { name: shopName, address: shopAddress, phone: shopPhone } }
              : {}),
          };
      const data = await apiRequest(`/api/auth/${mode === "login" ? "login" : "register"}`, null, {
        method: "POST",
        body: requestBody,
      });
      onAuthenticated({ token: data.token, user: data.user });
    } catch (requestError) {
      setError(requestError.message || "Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section aria-labelledby="auth-title" aria-modal="true" className="auth-dialog" role="dialog">
        <button aria-label="Close sign-in dialog" className="dialog-close" onClick={onClose} type="button">
          ×
        </button>
        <p className="section-kicker">MEDITRACK ACCOUNT</p>
        <h2 id="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-description">
          {mode === "login" ? "Sign in to follow your medicine orders." : "Save time tracking your medicine orders."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Full name
              <input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
          )}
          {mode === "register" && (
            <label>
              Account type
              <select onChange={(event) => setRole(event.target.value)} value={role}>
                <option value="user">Customer</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </label>
          )}
          {mode === "register" && role === "pharmacy" && (
            <>
              <label>
                Pharmacy name
                <input onChange={(event) => setShopName(event.target.value)} required value={shopName} />
              </label>
              <label>
                Pharmacy address
                <input autoComplete="street-address" onChange={(event) => setShopAddress(event.target.value)} required value={shopAddress} />
              </label>
              <label>
                Phone (optional)
                <input autoComplete="tel" onChange={(event) => setShopPhone(event.target.value)} value={shopPhone} />
              </label>
            </>
          )}
          <label>
            Email address
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "New to MediTrack?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            type="button"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </div>
  );
}

export default AuthDialog;