import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

function ProfileDropdown({ session, role, profilePath, onSignOut, mobile = false }) {
  const [open, setOpen] = useState(false);
  const name = session.user.name || "Account";
  const roleLabel = { user: "Customer", pharmacy: "Pharmacy", admin: "Admin" }[role] || role;

  function signOut() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    setOpen(false);
    onSignOut();
  }

  return (
    <div className={`profile-menu${mobile ? " profile-menu-mobile" : ""}`}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="profile-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</span>
        <span className="profile-menu-identity">
          <strong>{name}</strong>
          <small>{roleLabel}</small>
        </span>
        <ChevronDown aria-hidden="true" className={open ? "profile-menu-chevron open" : "profile-menu-chevron"} size={16} />
      </button>
      {open && (
        <div className="profile-menu-options" role="menu">
          <Link onClick={() => setOpen(false)} role="menuitem" to={profilePath}>
            <UserRound aria-hidden="true" size={16} />
            View Profile
          </Link>
          <button onClick={signOut} role="menuitem" type="button">
            <LogOut aria-hidden="true" size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
