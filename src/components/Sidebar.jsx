import React from 'react';
import { isLocked } from '../utils/prerequisites';

const Sidebar = ({ subjects, electives, userProgress, activeElectives, isOpen, onToggle, onReset }) => {
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

  // Count available electives
  const availableElectivesCount = electives.filter(subject => {
    const status = userProgress[subject.id]?.status;
    const locked = isLocked(subject, userProgress, allSubjects);
    const isAdded = activeElectives.includes(subject.id);
    return !status && !locked && !isAdded; // Not started, not locked, not already added
  }).length;

  // 2. Priority to Approve (Regularized -> Unlocks most subjects)
  const regularizedSubjects = allSubjects.filter(subject => {
    return userProgress[subject.id]?.status === 'regularized';
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
  
  // Available count (already calculated as availableSubjects.length + availableElectivesCount)
  // But for the chart we might want "Pending but Available" vs "Locked"
  
  // Re-calculate strictly for the chart based on the Total Subjects set
  const chartData = allSubjects.reduce((acc, subject) => {
    const isMandatory = subject.id < 100;
    const isAddedElective = activeElectives.includes(subject.id);
    
    if (!isMandatory && !isAddedElective) return acc; // Skip unadded electives

    const status = userProgress[subject.id]?.status;
    
    if (status === 'approved') {
      acc.approved++;
    } else if (status === 'regularized') {
      acc.regularized++;
    } else {
      // Pending
      const locked = isLocked(subject, userProgress, allSubjects);
      if (locked) {
        acc.locked++;
      } else {
        acc.available++;
      }
    }
    return acc;
  }, { approved: 0, regularized: 0, available: 0, locked: 0 });

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
      { value: chartData.regularized, color: '#3498db', label: 'Regularizadas' },
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
        {isOpen ? '✕' : '☰'}
      </button>

      <div className="sidebar-content">
        <div className="sidebar-section stats-section">
          <h3>Progreso de Carrera</h3>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="progress-text">{progressPercentage}% Completado</div>
          </div>

          <div className="chart-container">
            {renderPieChart()}
          </div>

          <div className="stats-grid">
            <div className="stat-item" style={{ color: '#2ecc71' }}>
              <span className="stat-value">{chartData.approved}</span>
              <span className="stat-label">Aprobadas</span>
            </div>
            <div className="stat-item" style={{ color: '#3498db' }}>
              <span className="stat-value">{chartData.regularized}</span>
              <span className="stat-label">Regularizadas</span>
            </div>
            <div className="stat-item" style={{ color: '#95a5a6' }}>
              <span className="stat-value">{chartData.available}</span>
              <span className="stat-label">Disponibles</span>
            </div>
            <div className="stat-item" style={{ color: '#c0392b' }}>
              <span className="stat-value">{chartData.locked}</span>
              <span className="stat-label">Bloqueadas</span>
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
            <div className="extra-stat-row">
              <span>Total Materias:</span>
              <strong>{totalSubjects}</strong>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Materias Disponibles</h3>
          <p className="sidebar-subtitle">Puedes cursar estas materias:</p>
          <ul className="sidebar-list">
            {availableSubjects.map(s => (
              <li key={s.id}>
                {s.name} <span className="tag-year">{s.year}º</span>
              </li>
            ))}
            {availableElectivesCount > 0 && (
              <li className="elective-count">
                + {availableElectivesCount} Electivas disponibles
              </li>
            )}
            {availableSubjects.length === 0 && availableElectivesCount === 0 && (
              <li className="empty-msg">No hay materias disponibles por ahora.</li>
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
                  🔓 {s.unlocksCount} <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>({s.unlocksMandatory} Ob. + {s.unlocksElective} El.)</span>
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
