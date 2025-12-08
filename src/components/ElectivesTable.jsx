import React, { useState } from 'react';
import { isLocked } from '../utils/prerequisites';

const ElectivesTable = ({ electives, activeElectives, userProgress, subjects, onAddElective, onRemoveElective }) => {
  const [collapsedYears, setCollapsedYears] = useState({});

  const toggleYearCollapse = (year) => {
    setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };
  // Group electives by year
  const electivesByYear = electives.reduce((acc, subject) => {
    if (!acc[subject.year]) acc[subject.year] = [];
    acc[subject.year].push(subject);
    return acc;
  }, {});

  const years = Object.keys(electivesByYear).sort();

  const handleRemoveClick = (subjectId) => {
    const progress = userProgress[subjectId];
    const hasProgress = progress?.status === 'regularized' || progress?.status === 'approved';

    if (hasProgress) {
      if (window.confirm('Esta materia tiene progreso (Cursada o Aprobada). ¿Estás seguro de que quieres quitarla de tu lista?')) {
        onRemoveElective(subjectId);
      }
    } else {
      onRemoveElective(subjectId);
    }
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h2>Materias Electivas</h2>
      <table>
        <thead>
          <tr>
            <th className="col-year">Nivel</th>
            <th className="col-name">Asignatura</th>
            <th className="col-modality">Modalidad</th>
            <th className="col-prereqs">Regular (Necesita)</th>
            <th className="col-prereqs">Aprobada (Necesita)</th>
            <th className="col-grade">Créditos</th>
            <th className="col-actions">Acción</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => {
            const isCollapsed = collapsedYears[year];
            return (
              <React.Fragment key={year}>
                <tr 
                  className="electives-year-header"
                  onClick={() => toggleYearCollapse(year)}
                  style={{ cursor: 'pointer' }}
                  title="Click para contraer/expandir"
                >
                  <td colSpan="7">
                    {year}º Año <span style={{ float: 'right' }}>{isCollapsed ? '▼' : '▲'}</span>
                  </td>
                </tr>
                {!isCollapsed && electivesByYear[year].map(subject => {
                  const isAdded = activeElectives.includes(subject.id);
                  const allSubjects = [...subjects, ...electives]; // Ensure we have all subjects for checking
                  const locked = isLocked(subject, userProgress, allSubjects);
                  
                  return (
                    <tr key={subject.id} style={{ opacity: isAdded ? 1 : 1 }}>
                      <td className="col-year">{subject.year}</td>
                      <td className="col-name">{subject.name}</td>
                      <td className="col-modality">{subject.modality}</td>
                      <td className="col-prereqs">{subject.regularPrereqs.join(', ') || '–'}</td>
                      <td className="col-prereqs">{subject.approvedPrereqs.join(', ') || '–'}</td>
                      <td className="col-grade">{subject.credits}</td>
                      <td className="col-actions">
                        {isAdded ? (
                          <button 
                            className="btn-remove"
                            onClick={() => handleRemoveClick(subject.id)}
                            title="Quitar de mi lista"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button 
                            className="btn-add"
                            onClick={() => onAddElective(subject.id)}
                            disabled={locked}
                            title={locked ? "Faltan correlativas" : "Agregar a mi plan"}
                          >
                            Agregar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ElectivesTable;
