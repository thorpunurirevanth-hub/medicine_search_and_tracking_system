import { ClipboardList, LayoutDashboard, MessageSquareText, Pill, Store, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown.jsx";
import "../pages/admin-workspace.css";

const links = [
  ["/admin/dashboard", "Overview", LayoutDashboard],
  ["/admin/customers", "Customers", Users],
  ["/admin/pharmacies", "Pharmacies", Store],
  ["/admin/medicines", "Medicines", Pill],
  ["/admin/orders", "Orders", ClipboardList],
  ["/admin/feedback", "Feedback", MessageSquareText],
];

function AdminLayout({ session, onSessionChange }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="workspace-brand" href="/admin/dashboard"><span className="workspace-brand-mark">+</span><span>Medi<span>Track</span></span></a>
        <p className="workspace-label">ADMINISTRATION</p>
        <nav className="workspace-nav" aria-label="Admin navigation">{links.map(([to, label, Icon]) => <NavLink className={({ isActive }) => isActive ? "workspace-link active" : "workspace-link"} end={to.endsWith("dashboard")} key={to} to={to}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
        <ProfileDropdown onSignOut={() => onSessionChange(null)} profilePath="/admin/profile" role="admin" session={session} />
      </aside>
      <main className="admin-main"><header className="admin-mobile-header"><a className="workspace-brand" href="/admin/dashboard">Medi<span>Track</span></a><ProfileDropdown mobile onSignOut={() => onSessionChange(null)} profilePath="/admin/profile" role="admin" session={session} /></header><div className="admin-content"><Outlet /></div></main>
      <nav className="admin-mobile-nav" aria-label="Admin navigation">{links.map(([to, label, Icon]) => <NavLink aria-label={label} className={({ isActive }) => isActive ? "mobile-workspace-link active" : "mobile-workspace-link"} end={to.endsWith("dashboard")} key={to} to={to}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
    </div>
  );
}

export default AdminLayout;