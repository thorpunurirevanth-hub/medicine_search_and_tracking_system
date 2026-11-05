import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { dashboardPathFor } from "../auth/roleRoutes.js";

function ProtectedRoute({ role, children }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  if (session.user.role !== role) {
    return <Navigate replace to={dashboardPathFor(session.user.role)} />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { session } = useAuth();
  return session
    ? <Navigate replace to={dashboardPathFor(session.user.role)} />
    : children;
}

export default ProtectedRoute;