import { ClipboardList, FileText, LayoutDashboard, MapPin, PackagePlus, Pill } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown.jsx";
import "../pages/pharmacy-workspace.css";

const links = [
  ["/pharmacy/dashboard", "Overview", LayoutDashboard],
  ["/pharmacy/inventory", "Inventory", Pill],
  ["/pharmacy/medicines/new", "Add medicine", PackagePlus],
  ["/pharmacy/orders", "Orders", ClipboardList],
  ["/pharmacy/prescriptions", "Prescriptions", FileText],
  ["/pharmacy/profile", "Pharmacy profile", MapPin],
];

function PharmacyLayout({ session, onSessionChange }) {
  return (
    <div className="pharmacy-shell">
      <aside className="pharmacy-sidebar">
        <a className="workspace-brand" href="/pharmacy/dashboard"><span className="workspace-brand-mark"><Pill size={19} /></span><span>Medi<span>Track</span></span></a>
        <p className="workspace-label">PHARMACY</p>
        <nav className="workspace-nav" aria-label="Pharmacy navigation">
          {links.map(([to, label, Icon]) => <NavLink className={({ isActive }) => isActive ? "workspace-link active" : "workspace-link"} end={to.endsWith("dashboard")} key={to} to={to}><Icon aria-hidden="true" size={17} /><span>{label}</span></NavLink>)}
        </nav>
        <ProfileDropdown onSignOut={() => onSessionChange(null)} profilePath="/pharmacy/profile" role="pharmacy" session={session} />
      </aside>
      <main className="pharmacy-main">
        <header className="pharmacy-mobile-header"><a className="workspace-brand" href="/pharmacy/dashboard"><span className="workspace-brand-mark"><Pill size={18} /></span><span>Medi<span>Track</span></span></a><ProfileDropdown mobile onSignOut={() => onSessionChange(null)} profilePath="/pharmacy/profile" role="pharmacy" session={session} /></header>
        <div className="pharmacy-content"><Outlet /></div>
      </main>
      <nav className="pharmacy-mobile-nav" aria-label="Pharmacy navigation">
        {links.map(([to, label, Icon]) => <NavLink aria-label={label} className={({ isActive }) => isActive ? "mobile-workspace-link active" : "mobile-workspace-link"} end={to.endsWith("dashboard")} key={to} to={to}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}

export default PharmacyLayout;