import logoBg from '../img/logo-bg.png';
import './Navbar.css';

function Navbar({ currentView, onViewChange, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={logoBg} alt="Logo" className="navbar-logo" />
          <h2 className="navbar-title">Academic Tracker</h2>
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
          {onLogout && (
            <button className="nav-link logout-btn" onClick={onLogout} title="Cerrar sesión">
              Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
