import React, { useState } from 'react';

const SubjectTable = ({ subjects, userProgress, onUpdateProgress, onRemoveElective, allSubjects }) => {
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [collapsedYears, setCollapsedYears] = useState({});

  // Group subjects by year
  const subjectsByYear = subjects.reduce((acc, subject) => {
    if (!acc[subject.year]) acc[subject.year] = [];
    acc[subject.year].push(subject);
    return acc;
  }, {});

  const years = Object.keys(subjectsByYear).sort();

  const getMissingPrerequisites = (subject) => {
    const missing = { regular: [], approved: [] };
    const subjectsList = allSubjects || subjects;

    subject.regularPrereqs.forEach(id => {
      const status = userProgress[id]?.status;
      if (status !== 'regularized' && status !== 'approved') {
        const prereq = subjectsList.find(s => s.id === id);
        if (prereq) missing.regular.push(prereq);
      }
    });

    subject.approvedPrereqs.forEach(id => {
      const status = userProgress[id]?.status;
      if (status !== 'approved') {
        const prereq = subjectsList.find(s => s.id === id);
        if (prereq) missing.approved.push(prereq);
      }
    });

    return missing;
  };

  const isLocked = (subject) => {
    const missing = getMissingPrerequisites(subject);
    return missing.regular.length > 0 || missing.approved.length > 0;
  };

  const getRowClass = (subject) => {
    const progress = userProgress[subject.id];
    if (progress?.status === 'approved') return 'aprobada';
    if (progress?.status === 'regularized') return 'cursada';
    if (isLocked(subject)) return 'locked';
    return '';
  };

  const getYearClass = (yearSubjects) => {
    let hasLocked = false;
    let hasPending = false;
    let hasRegularized = false;
    let allApproved = true;

    yearSubjects.forEach(subject => {
      const progress = userProgress[subject.id];
      const status = progress?.status;
      const locked = isLocked(subject);

      if (locked) hasLocked = true;
      if (!status || (status !== 'regularized' && status !== 'approved')) {
        if (!locked) hasPending = true;
        allApproved = false;
      }
      if (status === 'regularized') {
        hasRegularized = true;
        allApproved = false;
      }
    });

    if (hasLocked) return 'year-header-locked'; // Dark Red
    if (hasPending) return 'year-header-pending'; // Grey (Default)
    if (hasRegularized) return 'year-header-regularized'; // Dark Blue
    if (allApproved && yearSubjects.length > 0) return 'year-header-approved'; // Dark Green
    
    return 'year-header-pending';
  };

  const handleStatusChange = (subjectId, newStatus) => {
    const currentStatus = userProgress[subjectId]?.status;
    
    if (currentStatus === newStatus) {
      // If clicking the same status, remove the progress entirely
      const newProgress = { ...userProgress };
      delete newProgress[subjectId];
      onUpdateProgress(subjectId, undefined, newProgress);
    } else {
      // Otherwise, set the new status
      onUpdateProgress(subjectId, { ...userProgress[subjectId], status: newStatus });
    }
  };

  const handleGradeChange = (subjectId, grade) => {
    onUpdateProgress(subjectId, { ...userProgress[subjectId], grade });
  };

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

  const toggleExpand = (subjectId) => {
    setExpandedSubjectId(expandedSubjectId === subjectId ? null : subjectId);
  };

  const toggleYearCollapse = (year) => {
    setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  return (
    <div className="container">
      <table>
        <thead>
          <tr>
            <th className="col-year">Nivel</th>
            <th className="col-id">N°</th>
            <th className="col-name">Asignatura</th>
            <th className="col-modality">Modalidad</th>
            <th className="col-prereqs">Regular</th>
            <th className="col-prereqs">Aprobada</th>
            <th className="col-actions">Estado</th>
            <th className="col-grade">Nota</th>
            <th className="col-info"></th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => {
            const yearSubjects = subjectsByYear[year];
            const yearClass = getYearClass(yearSubjects);
            const isCollapsed = collapsedYears[year];

            return (
              <React.Fragment key={year}>
                <tr 
                  className={`year-header ${yearClass}`} 
                  onClick={() => toggleYearCollapse(year)}
                  style={{ cursor: 'pointer' }}
                  title="Click para contraer/expandir"
                >
                  <td colSpan="9">
                    {year}º Año <span style={{ float: 'right' }}>{isCollapsed ? '▼' : '▲'}</span>
                  </td>
                </tr>
                {!isCollapsed && yearSubjects.map(subject => {
                  const locked = isLocked(subject, userProgress, allSubjects);
                  const missing = locked ? getMissingPrerequisites(subject, userProgress, allSubjects) : null;
                  const isExpanded = expandedSubjectId === subject.id;
                  const isElective = subject.id >= 100;

                  return (
                    <React.Fragment key={subject.id}>
                      <tr className={getRowClass(subject)}>
                        <td className="col-year">{subject.year}</td>
                        <td className="col-id">{subject.id}</td>
                        <td className="col-name">{subject.name}</td>
                        <td className="col-modality">{subject.modality}</td>
                        <td className="col-prereqs">{subject.regularPrereqs.join(', ') || '–'}</td>
                        <td className="col-prereqs">{subject.approvedPrereqs.join(', ') || '–'}</td>
                        <td className="col-actions">
                          <button 
                            className={`btn-cursada ${userProgress[subject.id]?.status === 'regularized' ? 'active' : ''}`}
                            onClick={() => handleStatusChange(subject.id, 'regularized')}
                            disabled={locked}
                            title={locked ? "No se puede regularizar (faltan correlativas)" : "Marcar como Regularizada"}
                          >
                            R
                          </button>
                          <button 
                            className={`btn-aprobada ${userProgress[subject.id]?.status === 'approved' ? 'active' : ''}`}
                            onClick={() => handleStatusChange(subject.id, 'approved')}
                            disabled={locked}
                            title={locked ? "No se puede aprobar (faltan correlativas)" : "Marcar como Aprobada"}
                          >
                            A
                          </button>
                          {isElective && (
                            <button 
                              className="btn-remove"
                              onClick={() => handleRemoveClick(subject.id)}
                              title="Quitar de mi lista"
                            >
                              X
                            </button>
                          )}
                        </td>
                        <td className="col-grade">
                          <input 
                            type="number" 
                            min="1" 
                            max="10" 
                            value={userProgress[subject.id]?.grade || ''}
                            onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                            disabled={userProgress[subject.id]?.status !== 'approved' || locked}
                            placeholder="-"
                          />
                        </td>
                        <td className="col-info">
                          {locked && (
                            <button 
                              className="btn-info"
                              onClick={() => toggleExpand(subject.id)}
                              title="Ver motivos"
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && locked && (
                        <tr className="details-row">
                          <td colSpan="9">
                            <div className="missing-prereqs">
                              <strong>No se puede cursar porque faltan:</strong>
                              {missing.regular.length > 0 && (
                                <div>
                                  <span className="label">Regularizar:</span>
                                  {missing.regular.map(s => <span key={s.id} className="tag">{s.id} - {s.name}</span>)}
                                </div>
                              )}
                              {missing.approved.length > 0 && (
                                <div>
                                  <span className="label">Aprobar:</span>
                                  {missing.approved.map(s => <span key={s.id} className="tag">{s.id} - {s.name}</span>)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default SubjectTable;
