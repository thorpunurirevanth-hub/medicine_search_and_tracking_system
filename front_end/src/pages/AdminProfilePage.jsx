function AdminProfilePage({ session }) {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="section-kicker">ACCOUNT</p>
          <h1>Administrator profile</h1>
          <p>Signed-in account details.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <dl className="admin-profile-details">
          <div><dt>Name</dt><dd>{session.user.name || "—"}</dd></div>
          <div><dt>Email</dt><dd>{session.user.email || "—"}</dd></div>
          <div><dt>Role</dt><dd>Administrator</dd></div>
        </dl>
      </div>
    </section>
  );
}

export default AdminProfilePage;
