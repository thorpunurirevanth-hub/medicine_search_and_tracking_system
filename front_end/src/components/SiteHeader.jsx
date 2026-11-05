import { Link } from "react-router-dom";

function SiteHeader({ session, onSessionChange, onRequestAuth }) {
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="MediTrack home">
        <span className="brand-mark" aria-hidden="true">+</span>
        <span>Medi<span className="brand-accent">Track</span></span>
      </Link>
      <nav className="top-nav" aria-label="Main navigation">
        {session?.user.role === "pharmacy" ? (
          <>
            <a className="nav-active" href="#inventory-title">Inventory</a>
            <a href="#orders-title">Orders</a>
          </>
        ) : session?.user.role === "admin" ? (
          <a className="nav-active" href="#admin-overview">Overview</a>
        ) : (
          <>
            <a className="nav-active" href="#search">Find medicine</a>
            <a href="#how-it-works">How it works</a>
          </>
        )}
      </nav>
      <div className="header-actions">
        {session ? (
          <>
            <span className="account-name">{session.user.name}</span>
            <button className="account-button" onClick={() => onSessionChange(null)} type="button">
              Sign out
            </button>
          </>
        ) : (
          <button className="account-button" onClick={onRequestAuth} type="button">
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
