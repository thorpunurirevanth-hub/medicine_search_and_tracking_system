export function dashboardPathFor(role) {
  if (role === "pharmacy") return "/pharmacy/dashboard";
  if (role === "admin") return "/admin/dashboard";
  if (role === "user") return "/customer/dashboard";
  return "/";
}