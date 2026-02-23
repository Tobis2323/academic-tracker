import './Navbar.css';

function Navbar({ currentView, onViewChange }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2 className="navbar-title">Seguimiento Académico</h2>
        </div>
        <div className="navbar-links">
          <button
            className={`nav-link ${currentView === 'correlativas' ? 'active' : ''}`}
            onClick={() => onViewChange('correlativas')}
          >
            Correlativas
          </button>
          <button
            className={`nav-link ${currentView === 'horarios' ? 'active' : ''}`}
            onClick={() => onViewChange('horarios')}
          >
            Horarios
          </button>
          <button
            className={`nav-link ${currentView === 'armador' ? 'active' : ''}`}
            onClick={() => onViewChange('armador')}
          >
            Armador
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
