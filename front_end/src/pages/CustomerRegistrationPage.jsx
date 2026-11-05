import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

function CustomerRegistrationPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const session = await apiRequest("/api/auth/register", null, {
        method: "POST",
        body: { ...form, name: form.name.trim(), email: form.email.trim(), role: "user" },
      });
      signIn(session);
      navigate("/customer/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Create an account to place orders and follow their progress."
      eyebrow="CUSTOMER ACCOUNT"
      footer={<>Already registered? <Link to="/login">Sign in</Link></>}
      title="Create your account"
    >
      <form className="auth-page-form" onSubmit={submit}>
        <label htmlFor="customer-name">Full name</label>
        <input autoComplete="name" id="customer-name" maxLength={100} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
        <label htmlFor="customer-email">Email address</label>
        <input autoComplete="email" id="customer-email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
        <label htmlFor="customer-password">Password</label>
        <input autoComplete="new-password" id="customer-password" minLength={8} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
        {error && <p className="auth-page-error" role="alert">{error}</p>}
        <button className="auth-page-submit" disabled={submitting} type="submit">
          {submitting ? "Creating account…" : "Create customer account"}
        </button>
      </form>
      <div className="auth-role-links">
        Registering a pharmacy? <Link to="/register/pharmacy">Continue here</Link>
      </div>
    </AuthLayout>
  );
}

export default CustomerRegistrationPage;