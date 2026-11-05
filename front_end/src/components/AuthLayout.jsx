import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import "../pages/auth-pages.css";

function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-page-shell">
      <header className="auth-page-header">
        <Link aria-label="MediTrack home" className="brand" to="/">
          <span className="brand-mark" aria-hidden="true"><Plus size={19} strokeWidth={2.5} /></span>
          <span>Medi<span className="brand-accent">Track</span></span>
        </Link>
        <Link className="auth-back-link" to="/">
          <ArrowLeft aria-hidden="true" size={16} /> Back to search
        </Link>
      </header>
      <section aria-labelledby="auth-page-title" className="auth-page-content">
        <p className="auth-page-eyebrow">{eyebrow}</p>
        <h1 id="auth-page-title">{title}</h1>
        <p className="auth-page-description">{description}</p>
        {children}
        {footer && <div className="auth-page-footer">{footer}</div>}
      </section>
    </main>
  );
}

export default AuthLayout;