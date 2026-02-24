import React from 'react';
import { isLocked } from '../utils/prerequisites';

const Sidebar = ({ subjects, electives, userProgress, activeElectives, isOpen, onToggle, onReset, currentView }) => {
  const allSubjects = [...subjects, ...electives];

  // 1. Available to Take (Unlocked & Pending)
  const availableSubjects = allSubjects.filter(subject => {
    const isMandatory = subject.id < 100;
    const isAddedElective = activeElectives.includes(subject.id);
    
    if (!isMandatory && !isAddedElective) return false; // Skip unadded electives

    const status = userProgress[subject.id]?.status;
    const locked = isLocked(subject, userProgress, allSubjects);
    return !status && !locked; // Not started and not locked
  });

  // All available electives (unlocked, not started — regardless of activeElectives)
  const availableElectivesList = electives.filter(subject => {
    const status = userProgress[subject.id]?.status;
    const locked = isLocked(subject, userProgress, allSubjects);
    return !status && !locked;
  });

  // 2. Priority to Approve (Regularized or Attending -> Unlocks most subjects)
  const regularizedSubjects = allSubjects.filter(subject => {
    const s = userProgress[subject.id]?.status;
    return s === 'regularized' || s === 'attending';
  });

  const priorityList = regularizedSubjects.map(subject => {
    // Count how many subjects have this one as an 'approvedPrereq'
    const unlockedSubjects = allSubjects.filter(s => 
      s.approvedPrereqs.includes(subject.id)
    );
    
    const unlocksMandatory = unlockedSubjects.filter(s => s.id < 100).length;
    const unlocksElective = unlockedSubjects.filter(s => s.id >= 100).length;
    const unlocksCount = unlockedSubjects.length;
    
    return { ...subject, unlocksCount, unlocksMandatory, unlocksElective };
  }).sort((a, b) => {
    // First prioritize by Mandatory unlocks
    if (b.unlocksMandatory !== a.unlocksMandatory) {
      return b.unlocksMandatory - a.unlocksMandatory;
    }
    // Then by Elective unlocks
    return b.unlocksElective - a.unlocksElective;
  });

  // --- Statistics Calculation ---
  const totalSubjects = allSubjects.filter(s => {
    const isMandatory = s.id < 100;
    const isAddedElective = activeElectives.includes(s.id);
    return isMandatory || isAddedElective;
  }).length;

  const approvedCount = Object.values(userProgress).filter(p => p.status === 'approved').length;
  const regularizedCount = Object.values(userProgress).filter(p => p.status === 'regularized').length;
  const attendingCount = Object.values(userProgress).filter(p => p.status === 'attending').length;
  
  // Re-calculate strictly for the chart based on the Total Subjects set
  const chartData = allSubjects.reduce((acc, subject) => {
    const isMandatory = subject.id < 100;
    const isAddedElective = activeElectives.includes(subject.id);
    
    if (!isMandatory && !isAddedElective) return acc;

    const status = userProgress[subject.id]?.status;
    
    if (status === 'approved') {
      acc.approved++;
    } else if (status === 'regularized') {
      acc.regularized++;
    } else if (status === 'attending') {
      acc.attending++;
    } else {
      const locked = isLocked(subject, userProgress, allSubjects);
      if (locked) {
        acc.locked++;
      } else {
        acc.available++;
      }
    }
    return acc;
  }, { approved: 0, regularized: 0, attending: 0, available: 0, locked: 0 });

  const progressPercentage = Math.round((chartData.approved / totalSubjects) * 100) || 0;

  // Calculate Average
  const grades = Object.values(userProgress)
    .filter(p => p.status === 'approved' && p.grade)
    .map(p => parseFloat(p.grade))
    .filter(g => !isNaN(g));
  
  const average = grades.length > 0 
    ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) 
    : '-';

  // Calculate Credits
  const totalCredits = electives
    .filter(e => activeElectives.includes(e.id) && userProgress[e.id]?.status === 'approved')
    .reduce((acc, curr) => acc + (curr.credits || 0), 0);


  // --- Pie Chart Helper ---
  const getPiePath = (startAngle, endAngle) => {
    const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
    const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
    const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
    const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);

    return `M50,50 L${x1},${y1} A50,50 0 ${endAngle - startAngle > 180 ? 1 : 0},1 ${x2},${y2} Z`;
  };

  const renderPieChart = () => {
    const data = [
      { value: chartData.approved, color: '#2ecc71', label: 'Aprobadas' },
      { value: chartData.regularized, color: '#f59e0b', label: 'Regularizadas' },
      { value: chartData.attending, color: '#3b82f6', label: 'Cursando' },
      { value: chartData.available, color: '#95a5a6', label: 'Disponibles' },
      { value: chartData.locked, color: '#c0392b', label: 'Bloqueadas' },
    ];

    const total = data.reduce((acc, item) => acc + item.value, 0);
    let currentAngle = 0;

    if (total === 0) return null;

    return (
      <svg viewBox="0 0 100 100" className="pie-chart">
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const sliceAngle = (item.value / total) * 360;
          const path = getPiePath(currentAngle, currentAngle + sliceAngle);
          currentAngle += sliceAngle;
          return <path key={index} d={path} fill={item.color} />;
        })}
        {/* Inner circle for donut effect (optional, removing for full pie as requested) */}
      </svg>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className="sidebar-toggle" 
        onClick={onToggle}
        title={isOpen ? "Ocultar Panel" : "Mostrar Panel"}
        style={{ fontSize: '1.2em' }} // Slightly larger for hamburger
      >
        {isOpen ? '×' : '≡'}
      </button>

      <div className="sidebar-content">
        <div className="sidebar-section stats-section">
          <h3>Progreso de Carrera</h3>

          {/* Compact donut + stat rows */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            {/* Donut SVG */}
            <svg viewBox="0 0 88 88" style={{ width: 72, height: 72, flexShrink: 0 }}>
              {(() => {
                const pieData = [
                  { value: chartData.approved, color: '#2ecc71' },
                  { value: chartData.regularized, color: '#f59e0b' },
                  { value: chartData.attending, color: '#3b82f6' },
                  { value: chartData.available + chartData.locked, color: '#2a2b2d' },
                ];
                const total = pieData.reduce((s, d) => s + d.value, 0);
                if (total === 0) return null;
                let angle = -90;
                return pieData.map((d, i) => {
                  if (d.value === 0) return null;
                  const deg = (d.value / total) * 360;
                  const r = 36, cx = 44, cy = 44;
                  const toRad = a => (a * Math.PI) / 180;
                  const x1 = cx + r * Math.cos(toRad(angle));
                  const y1 = cy + r * Math.sin(toRad(angle));
                  const x2 = cx + r * Math.cos(toRad(angle + deg));
                  const y2 = cy + r * Math.sin(toRad(angle + deg));
                  const large = deg > 180 ? 1 : 0;
                  const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
                  angle += deg;
                  return <path key={i} d={path} fill={d.color} />;
                });
              })()}
              <circle cx="44" cy="44" r="22" fill="var(--bg-card)" />
              <text x="44" y="48" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">{progressPercentage}%</text>
            </svg>

            {/* Stat rows */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#2ecc71' }}>Aprobadas</span>
                <strong style={{ color: 'var(--text-primary)' }}>{chartData.approved}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#8ab4f8' }}>Cursando</span>
                <strong style={{ color: 'var(--text-primary)' }}>{chartData.attending}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#f59e0b' }}>Regularizadas</span>
                <strong style={{ color: 'var(--text-primary)' }}>{chartData.regularized}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#e74c3c' }}>Bloqueadas</span>
                <strong style={{ color: 'var(--text-primary)' }}>{chartData.locked}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', marginTop: '2px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total oblig.</span>
                <strong style={{ color: 'var(--text-primary)' }}>{totalSubjects}</strong>
              </div>
            </div>
          </div>

          <div className="extra-stats">
            <div className="extra-stat-row">
              <span>Promedio:</span>
              <strong>{average}</strong>
            </div>
            <div className="extra-stat-row">
              <span>Créditos Electivas:</span>
              <strong style={{ color: '#8e44ad' }}>{totalCredits} / 20</strong>
            </div>
          </div>
        </div>


        <div className="sidebar-section">
          <h3>Materias Disponibles</h3>
          <p className="sidebar-subtitle">Puedes cursar estas materias:</p>
          <ul className="sidebar-list">
            {availableSubjects.filter(s => s.id < 100).map(s => (
              <li key={s.id}>
                {s.name} <span className="tag-year">{s.year}º</span>
              </li>
            ))}
            {availableSubjects.filter(s => s.id < 100).length === 0 && (
              <li className="empty-msg">No hay materias obligatorias disponibles.</li>
            )}
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Electivas Disponibles</h3>
          <p className="sidebar-subtitle">Electivas que puedes cursar:</p>
          <ul className="sidebar-list">
            {availableElectivesList.map(s => (
              <li key={s.id}>
                {s.name} <span className="tag-year">{s.year}º</span>
              </li>
            ))}
            {availableElectivesList.length === 0 && (
              <li className="empty-msg">No hay electivas disponibles.</li>
            )}
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Prioridad de Finales</h3>
          <p className="sidebar-subtitle">Aprobar estas habilita más materias:</p>
          <ul className="sidebar-list">
            {priorityList.map(s => (
              <li key={s.id} className="priority-item">
                <div className="priority-name">{s.name}</div>
                <div className="priority-badge" title={`Habilita ${s.unlocksMandatory} obligatorias y ${s.unlocksElective} electivas`}>
                  +{s.unlocksCount} <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>({s.unlocksMandatory} Ob. + {s.unlocksElective} El.)</span>
                </div>
              </li>
            ))}
            {priorityList.length === 0 && (
              <li className="empty-msg">No tienes materias regularizadas pendientes de final.</li>
            )}
          </ul>
        </div>

        <div className="sidebar-section reset-section">
          <button 
            onClick={onReset} 
            className="btn-reset-full"
          >
            Reiniciar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
