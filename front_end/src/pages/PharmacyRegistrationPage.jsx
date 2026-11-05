import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

function PharmacyRegistrationPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    pharmacyName: "",
    address: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const session = await apiRequest("/api/auth/register", null, {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: "pharmacy",
          pharmacy: {
            name: form.pharmacyName.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
          },
        },
      });
      signIn(session);
      navigate("/pharmacy/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Create a pharmacy workspace to manage your medicine listings and orders."
      eyebrow="PHARMACY REGISTRATION"
      footer={<>Already have a pharmacy account? <Link to="/login">Sign in</Link></>}
      title="Register your pharmacy"
    >
      <form className="auth-page-form" onSubmit={submit}>
        <label htmlFor="pharmacy-owner-name">Account holder</label>
        <input autoComplete="name" id="pharmacy-owner-name" maxLength={100} onChange={update("name")} required value={form.name} />
        <label htmlFor="pharmacy-email">Email address</label>
        <input autoComplete="email" id="pharmacy-email" onChange={update("email")} required type="email" value={form.email} />
        <label htmlFor="pharmacy-password">Password</label>
        <input autoComplete="new-password" id="pharmacy-password" minLength={8} onChange={update("password")} required type="password" value={form.password} />
        <div className="auth-form-divider">Pharmacy details</div>
        <label htmlFor="pharmacy-name">Pharmacy name</label>
        <input id="pharmacy-name" maxLength={120} onChange={update("pharmacyName")} required value={form.pharmacyName} />
        <label htmlFor="pharmacy-address">Address</label>
        <input autoComplete="street-address" id="pharmacy-address" maxLength={300} onChange={update("address")} required value={form.address} />
        <label htmlFor="pharmacy-phone">Phone number</label>
        <input autoComplete="tel" id="pharmacy-phone" maxLength={30} onChange={update("phone")} type="tel" value={form.phone} />
        {error && <p className="auth-page-error" role="alert">{error}</p>}
        <button className="auth-page-submit" disabled={submitting} type="submit">
          {submitting ? "Creating pharmacy account…" : "Create pharmacy account"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default PharmacyRegistrationPage;