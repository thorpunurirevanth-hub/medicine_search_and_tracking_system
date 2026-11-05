import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { dashboardPathFor } from "../auth/roleRoutes.js";
import AuthLayout from "../components/AuthLayout.jsx";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const session = await apiRequest("/api/auth/login", null, {
        method: "POST",
        body: { email: email.trim(), password },
      });
      signIn(session);
      navigate(dashboardPathFor(session.user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Sign in to find medicines, manage pharmacy stock, or review platform activity."
      eyebrow="WELCOME BACK"
      footer={<>New to MediTrack? <Link to="/register/customer">Create a customer account</Link></>}
      title="Sign in to MediTrack"
    >
      <form className="auth-page-form" onSubmit={submit}>
        <label htmlFor="login-email">Email address</label>
        <input autoComplete="email" id="login-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        <label htmlFor="login-password">Password</label>
        <input autoComplete="current-password" id="login-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        {error && <p className="auth-page-error" role="alert">{error}</p>}
        <button className="auth-page-submit" disabled={submitting} type="submit">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="auth-role-links">
        <Link to="/register/pharmacy">Register a pharmacy</Link>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;