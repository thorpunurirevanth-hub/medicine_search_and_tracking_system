function HeroSection({ onSearchChange, query }) {
  return (
    <section className="hero" id="search">
      <div className="hero-copy">
        <p className="eyebrow"><span /> YOUR HEALTH, MADE SIMPLER</p>
        <h1>The right medicine.<br /><span>Right around you.</span></h1>
        <p className="hero-description">
          Search local pharmacy inventory and find the care you need, without
          the extra trip.
        </p>
        <form className="search-bar" onSubmit={(event) => event.preventDefault()}>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            aria-label="Search medicines"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search a medicine or health product..."
            value={query}
          />
          <button type="submit">Search <span aria-hidden="true">→</span></button>
        </form>
        <div className="trust-note">
          <span className="trust-check" aria-hidden="true">✓</span>
          Up-to-date availability from local pharmacies
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-glow" />
        <div className="cross cross-one">+</div>
        <div className="cross cross-two">+</div>
        <div className="medicine-card">
          <div className="card-sparkle">✳</div>
          <div className="capsule"><span /><span /></div>
          <div className="card-label">CARE, CLOSE BY</div>
          <div className="card-sub-label">Your neighborhood pharmacy</div>
        </div>
        <div className="availability-chip">
          <span className="availability-dot" />
          Nearby care, made easy
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
