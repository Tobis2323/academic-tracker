import React, { useState, useMemo, useEffect } from 'react';
import comisiones2do from '../data/comisiones2do.json';
import comisiones3ro from '../data/comisiones3ro.json';
import comisiones4to from '../data/comisiones4to.json';
import comisiones5to from '../data/comisiones5to.json';
import { subjects, electives } from '../data/subjects';
import './Horarios.css'; // Reusing Horarios styles
import './Armador.css';

const Armador = ({ userProgress, isSidebarOpen }) => {
  // Initialize from localStorage for persistence
  const [fixedClasses, setFixedClasses] = useState(() => {
    try {
      const saved = localStorage.getItem('armador_current');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading armador_current", e);
      return [];
    }
  });

  const [savedSchedules, setSavedSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('armador_saved');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading armador_saved", e);
      return [];
    }
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedPossibleId, setSelectedPossibleId] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showPriority, setShowPriority] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('armador_current', JSON.stringify(fixedClasses));
  }, [fixedClasses]);

  useEffect(() => {
    localStorage.setItem('armador_saved', JSON.stringify(savedSchedules));
  }, [savedSchedules]);

  // Handlers for persistence
  const handleSaveSchedule = () => {
    const name = window.prompt("Nombre para este horario (ej: Mañana ideal):");
    if (!name) return;
    
    const newSchedule = {
        id: Date.now(),
        name,
        classes: fixedClasses
    };
    
    setSavedSchedules(prev => [...prev, newSchedule]);
  };

  const handleLoadSchedule = (schedule) => {
    if (fixedClasses.length > 0 && !window.confirm("Esto reemplazará tu horario actual. ¿Continuar?")) {
        return;
    }
    setFixedClasses(schedule.classes);
  };

  const handleClearArmador = () => {
    if (window.confirm("¿Seguro que quieres limpiar todo el armador?")) {
        setFixedClasses([]);
    }
  };

  const handleDeleteSavedSchedule = (id, e) => {
    e.stopPropagation();
    if (window.confirm("¿Eliminar este horario guardado?")) {
        setSavedSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  // 1. Calculate Available Subjects that can be taken (meet prerequisites)
  const { availableMandatory, availableElectives } = useMemo(() => {
    const available = [...subjects, ...electives].filter(subject => {
      const progress = userProgress[subject.id];
      if (progress?.status === 'approved' || progress?.status === 'regularized') {
         return false; 
      }

      // Check prerequisites
      const missingRegular = subject.regularPrereqs.some(id => {
         const pStatus = userProgress[id]?.status;
         return pStatus !== 'regularized' && pStatus !== 'approved';
      });
      if (missingRegular) return false;

      const missingApproved = subject.approvedPrereqs.some(id => {
         const pStatus = userProgress[id]?.status;
         return pStatus !== 'approved';
      });
      if (missingApproved) return false;

      return true;
    });

    // Split by checking which array they belong to
    const mandatory = available.filter(s => subjects.some(subj => subj.id === s.id)).sort((a, b) => a.name.localeCompare(b.name));
    const electivesOnly = available.filter(s => electives.some(elec => elec.id === s.id)).sort((a, b) => a.name.localeCompare(b.name));

    return { availableMandatory: mandatory, availableElectives: electivesOnly };
  }, [userProgress]);


  const priorityList = useMemo(() => {
    const allSubjects = [...subjects, ...electives];
    
    // Get ALL subjects that are not approved or regularized
    const allPossible = allSubjects.filter(subject => {
      const progress = userProgress[subject.id];
      return progress?.status !== 'approved' && progress?.status !== 'regularized';
    });
    
    const prioritized = allPossible.map(subject => {
      // Count how many subjects have this one as an 'approvedPrereq'
      const unlockedSubjects = allSubjects.filter(s => 
        s.approvedPrereqs.includes(subject.id)
      );
      
      // Check which array each unlocked subject belongs to
      const unlocksMandatory = unlockedSubjects.filter(s => subjects.some(subj => subj.id === s.id)).length;
      const unlocksElective = unlockedSubjects.filter(s => electives.some(elec => elec.id === s.id)).length;
      const unlocksCount = unlockedSubjects.length;
      
      return { ...subject, unlocksCount, unlocksMandatory, unlocksElective };
    }).filter(s => s.unlocksCount > 0) // Only show subjects that unlock something
      .sort((a, b) => {
        // First prioritize by Mandatory unlocks
        if (b.unlocksMandatory !== a.unlocksMandatory) {
          return b.unlocksMandatory - a.unlocksMandatory;
        }
        // Then by Elective unlocks
        return b.unlocksElective - a.unlocksElective;
      });
    
    return prioritized;
  }, [userProgress]);

  // 2. Aggregate All Commission Data
  const allComisiones = useMemo(() => {
    const datasets = [
        { data: comisiones2do, year: '2do' }, 
        { data: comisiones3ro, year: '3ro' },
        { data: comisiones4to, year: '4to' },
        { data: comisiones5to, year: '5to' }
    ];
    let all = [];
    datasets.forEach(ds => {
        if(ds.data && ds.data.comisiones) {
            ds.data.comisiones.forEach(com => {
                all.push({ ...com, yearLabel: ds.year });
            });
        }
    });
    return all;
  }, []);

  // Compute Possible Subjects: unlocked if fixedClasses subjects are passed
  const possibleSubjects = useMemo(() => {
    const allSubjects = [...subjects, ...electives];
    const fixedIds = fixedClasses.map(fc => fc.subjectId);
    if (fixedIds.length === 0) return [];

    const projectedProgress = { ...userProgress };
    fixedIds.forEach(id => {
      const current = projectedProgress[id]?.status;
      if (current !== 'approved') {
        projectedProgress[id] = { status: 'regularized' };
      }
    });

    return allSubjects.filter(subject => {
      const realStatus = userProgress[subject.id]?.status;
      if (realStatus === 'approved' || realStatus === 'regularized') return false;

      const alreadyAvailable = [...availableMandatory, ...availableElectives].some(s => s.id === subject.id);
      if (alreadyAvailable) return false;

      if (fixedIds.includes(subject.id)) return false;

      const missingRegular = subject.regularPrereqs.some(id => {
        const pStatus = projectedProgress[id]?.status;
        return pStatus !== 'regularized' && pStatus !== 'approved';
      });
      if (missingRegular) return false;

      const missingApproved = subject.approvedPrereqs.some(id => {
        const pStatus = projectedProgress[id]?.status;
        return pStatus !== 'approved';
      });
      if (missingApproved) return false;

      const hasSem2 = allComisiones.some(com =>
        com.materias.some(m =>
          (m.id === subject.id || (m.ids && m.ids.includes(subject.id))) &&
          m.horarios.some(h => h.semestre === 2)
        )
      );
      return hasSem2;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [fixedClasses, userProgress, availableMandatory, availableElectives, allComisiones]);

  // 3. Helper: Convert time to minutes
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 4. Helper: Detect Overlap
  const hasOverlap = (scheduleA, scheduleB) => {
     // schedule is array of { dia, inicio, fin, semestre }
     // Check if they share any slot
     return scheduleA.some(slotA => {
        return scheduleB.some(slotB => {
            if (slotA.dia !== slotB.dia) return false;
            // Assuming simplified view where we care about general overlap regardless of semester for safety?
            // Or strictly by semester? Usually schedules must work for both semesters if annual.
            // If one is 1st sem and other is 2nd sem, no overlap.
            // If one is annual (Anual) and other is 1st sem, overlap possible.
            // Let's check semester overlap first.
            const semOverlap = 
                slotA.semestre === slotB.semestre || 
                (slotA.semestre === 0 || slotB.semestre === 0); // Assuming 0 or undefined might mean something?
                // Actually our data uses 1 or 2. Annual usually implies appearing in both?
                // In our data, "Annual" subjects often have entries for sem 1 and sem 2 in the array.
            
            if (slotA.semestre !== slotB.semestre) return false;

            const startA = timeToMinutes(slotA.inicio);
            const endA = timeToMinutes(slotA.fin);
            const startB = timeToMinutes(slotB.inicio);
            const endB = timeToMinutes(slotB.fin);

            return (startA < endB && endA > startB);
        });
     });
  };

  // 5. Get Options for Selected Subject (including conflicting ones)
  const subjectOptions = useMemo(() => {
    if (!selectedSubjectId) return [];
    
    const options = [];
    allComisiones.forEach(com => {
        const match = com.materias.find(m => 
            m.id === selectedSubjectId || (m.ids && m.ids.includes(selectedSubjectId))
        );
        
        if (match) {
            // Check collision with FIXED classes
            const hasConflict = fixedClasses.some(fixed => hasOverlap(match.horarios, fixed.horarios));
            
            // Include ALL options, but mark those with conflicts
            options.push({
                comisionId: com.id,
                materia: match,
                yearLabel: com.yearLabel,
                hasConflict: hasConflict
            });
        }
    });
    return options;
  }, [selectedSubjectId, allComisiones, fixedClasses]);

  // Get options for a possible subject (semester 2 only) — must be after hasOverlap
  const possibleSubjectOptions = useMemo(() => {
    if (!selectedPossibleId) return [];
    const options = [];
    allComisiones.forEach(com => {
      const match = com.materias.find(m =>
        m.id === selectedPossibleId || (m.ids && m.ids.includes(selectedPossibleId))
      );
      if (match && match.horarios.some(h => h.semestre === 2)) {
        const sem2Horarios = match.horarios.filter(h => h.semestre === 2);
        const hasConflict = fixedClasses.some(fc => hasOverlap(sem2Horarios, fc.horarios));
        options.push({
          comisionId: com.id,
          materia: match,
          yearLabel: com.yearLabel,
          hasConflict
        });
      }
    });
    return options;
  }, [selectedPossibleId, allComisiones, fixedClasses]);

  // 6. Handlers
  const handleSelectSubject = (id) => {
    // Check if already fixed
    const isFixed = fixedClasses.some(fc => fc.subjectId === id);
    
    if (isFixed) {
      // Remove from fixed classes
      setFixedClasses(fixedClasses.filter(fc => fc.subjectId !== id));
      // Also clear selection if this was the selected subject
      if (selectedSubjectId === id) {
        setSelectedSubjectId(null);
      }
    } else {
      // Select subject to see options
      setSelectedSubjectId(id);
    }
  };

  const handleFixClass = (option) => {
    setFixedClasses([
        ...fixedClasses,
        {
            subjectId: selectedSubjectId,
            subjectName: option.materia.nombre,
            comisionId: option.comisionId,
            horarios: option.materia.horarios,
            colorCode: option.materia.codigo
        }
    ]);
    setSelectedSubjectId(null);
  };

  const handleRemoveFixed = (idx) => {
    const newFixed = [...fixedClasses];
    newFixed.splice(idx, 1);
    setFixedClasses(newFixed);
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Helper: Generate time labels from a time range
  const generateTimeLabels = (startTime, endTime) => {
    const labels = [];
    for (let t = startTime; t <= endTime; t += 60) {
      const h = Math.floor(t / 60);
      labels.push(`${h}:00`);
    }
    return labels;
  };

  // Helper: Compute the visible time range for a semester from fixed classes + current options
  const getTimeRangeForSemester = (semester) => {
    const slots = [];

    fixedClasses.forEach(fc => {
      fc.horarios.forEach(h => {
        if (h.semestre === semester || h.semestre === 0) slots.push(h);
      });
    });

    if (selectedSubjectId) {
      subjectOptions.forEach(opt => {
        opt.materia.horarios.forEach(h => {
          if (h.semestre === semester || h.semestre === 0) slots.push(h);
        });
      });
    }

    // Include possible subject options for semester 2 range calculation
    if (selectedPossibleId && semester === 2) {
      possibleSubjectOptions.forEach(opt => {
        opt.materia.horarios.forEach(h => {
          if (h.semestre === 2) slots.push(h);
        });
      });
    }

    if (slots.length === 0) {
      return { startTime: 480, endTime: 1380, totalMinutes: 900 };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;
    slots.forEach(h => {
      minTime = Math.min(minTime, timeToMinutes(h.inicio));
      maxTime = Math.max(maxTime, timeToMinutes(h.fin));
    });

    minTime = Math.max(480, Math.floor(minTime / 60) * 60 - 60);
    maxTime = Math.min(1380, Math.ceil(maxTime / 60) * 60 + 60);

    return { startTime: minTime, endTime: maxTime, totalMinutes: maxTime - minTime };
  };

  // Helper: Resolve Overlaps (Calculates columns for side-by-side display)
  const resolveOverlaps = (classes) => {
    if (classes.length === 0) return [];
    
    // Convert times to minutes for comparison if not already
    const processed = classes.map(c => ({
        ...c,
        startMinutes: timeToMinutes(c.horario.inicio),
        endMinutes: timeToMinutes(c.horario.fin)
    }));

    // Sort by start time
    processed.sort((a, b) => a.startMinutes - b.startMinutes);

    // Assign columns
    processed.forEach((clase, index) => {
      let column = 0;
      let maxColumns = 1;

      for (let i = 0; i < index; i++) {
        const other = processed[i];
        if (clase.startMinutes < other.endMinutes && clase.endMinutes > other.startMinutes) {
          if (other.column === column) {
            column++;
          }
          maxColumns = Math.max(maxColumns, column + 1);
        }
      }
      clase.column = column;
      clase.totalColumns = maxColumns;
    });

    // Group concurrent classes to share same totalColumns
    const groups = [];
    processed.forEach(clase => {
      let group = groups.find(g => 
        g.some(c => 
          clase.startMinutes < c.endMinutes && clase.endMinutes > c.startMinutes
        )
      );
      if (!group) {
        group = [];
        groups.push(group);
      }
      group.push(clase);
    });

    groups.forEach(group => {
      const maxCols = Math.max(...group.map(c => c.column + 1));
      group.forEach(c => c.totalColumns = maxCols);
    });

    return processed;
  };

  // Helper to calculate style for a block
  const getBlockStyle = (clase, startTime = 480, totalMinutes = 900) => {
    const startMinutes = clase.startMinutes;
    const endMinutes = clase.endMinutes;
    const duration = endMinutes - startMinutes;

    const top = ((startMinutes - startTime) / totalMinutes) * 100;
    const height = (duration / totalMinutes) * 100;

    const column = clase.column || 0;
    const totalColumns = clase.totalColumns || 1;
    const width = 100 / totalColumns;
    const left = width * column;

    return {
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
        position: 'absolute'
    };
  };

  // Subject Colors (copied from Horarios.jsx)
  const subjectColors = {
    // 3er Año
    'DSI': '#93c5fd', 'COM': '#fcd34d', 'Ingles II': '#86efac', 
    'BDA': '#fde047', 'DDS': '#fdba74', 'AN': '#c4b5fd', 
    'ECO': '#fca5a5', 'Elect': '#67e8f9',
    // 2do Año
    'SOP': '#a78bfa', 'AM2': '#60a5fa', 'FISII': '#34d399', 
    'SSL': '#fbbf24', 'ASI': '#f472b6', 'EST': '#fb923c', 'PPR': '#818cf8',
    // 4to Año
    'AS': '#7dd3fc', 'RED': '#fca5a5', 'SIM': '#d8b4fe', 
    'IOP': '#86efac', 'E1': '#fdba74', 'E2': '#67e8f9', 
    'LEG': '#a5b4fc', 'TA': '#f9a8d4', 'IS': '#fcd34d', 'DAO': '#cbd5e1',
    // 5to Año
    'IA / Proy Fin': '#6366f1', 'Proy Fin / GG': '#64748b', 'SSI': '#f43f5e', 
    'GG': '#3b82f6', 'SG': '#10b981', 'E1': '#f97316', 'SoftAb': '#84cc16', 
    'IA': '#6366f1', 'Proy Fin': '#64748b', 'CDD': '#14b8a6', 
    'E2': '#06b6d4', 'E3': '#ec4899', 'E4 / E5': '#a855f7', 'E4': '#d946ef'
  };

  const getSubjectColor = (code) => {
      // Try exact match or code part
      if (subjectColors[code]) return subjectColors[code];
      // Fallback
      return '#a5b4fc';
  };

  // Helper to get blocks for a specific day AND semester
  const getBlocksForDay = (day, semester, startTime, totalMinutes) => {
    const rawBlocks = [];

    // Collect Fixed Classes
    fixedClasses.forEach((fc, idx) => {
        fc.horarios.forEach((h, hIdx) => {
            // Check semester: match or 0 (anual check logic? if 0 usually means anual or both)
            // Assuming anual (0) shows in both.
            const showsInSemester = h.semestre === semester || h.semestre === 0;
            
            if (h.dia === day && showsInSemester) {
                rawBlocks.push({
                    id: `fixed-${idx}-${hIdx}`,
                    type: 'fixed',
                    horario: h,
                    data: fc
                });
            }
        });
    });

    // Collect Options (regular subject selection)
    if (selectedSubjectId) {
        subjectOptions.forEach((opt, idx) => {
             opt.materia.horarios.forEach((h, hIdx) => {
                const showsInSemester = h.semestre === semester || h.semestre === 0;
                if (h.dia === day && showsInSemester) {
                    rawBlocks.push({
                        id: `opt-${idx}-${hIdx}`,
                        type: 'option',
                        horario: h,
                        data: opt
                    });
                }
             });
        });
    }

    // Collect Possible Subject Options (semester 2 only)
    if (selectedPossibleId && semester === 2) {
        possibleSubjectOptions.forEach((opt, idx) => {
            opt.materia.horarios.forEach((h, hIdx) => {
                if (h.dia === day && h.semestre === 2) {
                    rawBlocks.push({
                        id: `poss-${idx}-${hIdx}`,
                        type: 'possible',
                        horario: h,
                        data: opt
                    });
                }
            });
        });
    }
    
    // Process overlaps
    const positionedBlocks = resolveOverlaps(rawBlocks);

    // Render
    return positionedBlocks.map(block => {
        if (block.type === 'fixed') {
            const fc = block.data;
            const color = getSubjectColor(fc.colorCode) || '#475569';

            return (
                <div
                    key={block.id}
                    className="class-block fixed"
                    style={{
                        ...getBlockStyle(block, startTime, totalMinutes),
                        backgroundColor: color,
                        border: '1px solid rgba(0,0,0,0.2)',
                        zIndex: 20
                    }}
                    title={`${fc.subjectName} - ${fc.comisionId}`}
                >
                    <div className="class-code">{fc.colorCode}</div>
                    <div className="class-time">{block.horario.inicio} - {block.horario.fin}</div>
                    <div className="class-comision">{fc.comisionId}</div>
                </div>
            );
        } else if (block.type === 'option') {
            const opt = block.data;
            const isHovered = hoveredOption === opt.comisionId;
            const baseColor = getSubjectColor(opt.materia.codigo);
            const isConflict = opt.hasConflict;
            
            let opacity;
            if (isConflict) {
                opacity = 0.3;
            } else {
                opacity = hoveredOption && !isHovered ? 0.3 : 0.9;
            }
            
            const zIndex = isHovered ? 50 : 10;
            const border = isConflict 
                ? '2px dashed rgba(239, 68, 68, 0.6)' 
                : (isHovered ? '2px solid #1e293b' : '1px solid rgba(0,0,0,0.1)');

            return (
                <div
                    key={block.id}
                    className={`class-block option ${isHovered ? 'highlighted' : ''} ${isConflict ? 'conflict' : ''}`}
                    onClick={() => !isConflict && handleFixClass(opt)}
                    onMouseEnter={() => !isConflict && setHoveredOption(opt.comisionId)}
                    onMouseLeave={() => !isConflict && setHoveredOption(null)}
                    style={{
                        ...getBlockStyle(block, startTime, totalMinutes),
                        backgroundColor: baseColor,
                        opacity: opacity,
                        cursor: isConflict ? 'not-allowed' : 'pointer',
                        zIndex: zIndex,
                        border: border,
                        pointerEvents: isConflict ? 'none' : 'auto'
                    }}
                    title={isConflict ? 'Esta comisión tiene conflicto de horario' : `${opt.materia.nombre} (${opt.comisionId})`}
                >
                    <div className="class-code">{opt.materia.codigo}</div>
                    <div className="class-time">{block.horario.inicio} - {block.horario.fin}</div>
                    {isHovered && <div className="class-comision">{opt.comisionId}</div>}
                </div>
            );
        } else {
            // Possible subject block
            const opt = block.data;
            const isHovered = hoveredOption === opt.comisionId;
            const baseColor = getSubjectColor(opt.materia.codigo);
            const isConflict = opt.hasConflict;
            const opacity = isConflict ? 0.25 : (hoveredOption && !isHovered ? 0.3 : 0.85);
            return (
                <div
                    key={block.id}
                    className={`class-block possible-block ${isHovered ? 'highlighted' : ''} ${isConflict ? 'conflict' : ''}`}
                    onMouseEnter={() => setHoveredOption(opt.comisionId)}
                    onMouseLeave={() => setHoveredOption(null)}
                    style={{
                        ...getBlockStyle(block, startTime, totalMinutes),
                        backgroundColor: baseColor,
                        opacity: opacity,
                        cursor: 'default',
                        zIndex: isHovered ? 50 : 10,
                        border: isConflict ? '2px dashed rgba(239, 68, 68, 0.7)' : '2px dashed rgba(0,0,0,0.4)',
                        outline: isConflict ? '2px solid rgba(239,68,68,0.5)' : `2px solid ${baseColor}`,
                        outlineOffset: '2px'
                    }}
                    title={isConflict
                        ? `POSIBLE con CONFLICTO: ${opt.materia.nombre} (${opt.comisionId})`
                        : `POSIBLE (2do cuatrimestre): ${opt.materia.nombre} (${opt.comisionId})`}
                >
                    <div className="class-code" style={{ fontSize: '0.6rem' }}>{isConflict ? 'CONFLICTO' : 'POSIBLE'}</div>
                    <div className="class-code">{opt.materia.codigo}</div>
                    <div className="class-time">{block.horario.inicio} - {block.horario.fin}</div>
                    {isHovered && <div className="class-comision">{opt.comisionId}</div>}
                </div>
            );
        }
    });
  };

  return (
    <div className={`armador-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Calendars first (left side) */}
        <div className="calendar-area">
             <div className="calendars-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {[1, 2].map(semestre => {
                    const { startTime, endTime, totalMinutes } = getTimeRangeForSemester(semestre);
                    const timeLabels = generateTimeLabels(startTime, endTime);
                    return (
                    <div key={semestre} className="semester-calendar">
                        <h4 className="semester-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            {semestre}º Semestre
                        </h4>
                        <div className="calendar-grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
                            <div className="time-column">
                                <div className="time-header"></div>
                                {timeLabels.map((time, i) => (
                                    <div key={i} className="time-label">{time}</div>
                                ))}
                            </div>
                            
                            {days.map(day => (
                                <div key={day} className="day-column">
                                    <div className="day-header">{day}</div>
                                    <div className="day-content" style={{ position: 'relative', flex: 1 }}>
                                         {timeLabels.map((_, i) => (
                                            <div key={i} className="time-slot"></div>
                                         ))}
                                         
                                         {getBlocksForDay(day, semestre, startTime, totalMinutes)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                })}
             </div>

             {/* Saved Schedules Section */}
             <div className="saved-schedules-container">
                <div className="armador-controls">
                    <button className="armador-btn save-btn" onClick={handleSaveSchedule} disabled={fixedClasses.length === 0}>
                        Guardar Horario
                    </button>
                    <button className="armador-btn clear-btn" onClick={handleClearArmador} disabled={fixedClasses.length === 0}>
                        Limpiar Armador
                    </button>
                </div>
                
                {savedSchedules.length > 0 && (
                    <div className="saved-list-wrapper">
                        <h3>Mis Horarios Guardados</h3>
                        <div className="saved-list">
                            {savedSchedules.map(schedule => (
                                <div 
                                    key={schedule.id} 
                                    className="saved-schedule-item"
                                    onClick={() => handleLoadSchedule(schedule)}
                                    title="Cargar este horario"
                                >
                                    <span className="schedule-name">{schedule.name}</span>
                                    <span className="schedule-info">{schedule.classes.length} materias</span>
                                    <button 
                                        className="delete-schedule-btn"
                                        onClick={(e) => handleDeleteSavedSchedule(schedule.id, e)}
                                        title="Eliminar horario guardado"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* Subjects panel second (right side) */}
        <div className="sidebar-armador">
            <div className="sidebar-section">
                <h3>Materias Obligatorias</h3>
                <div className="subject-list">
                    {availableMandatory.map(subj => {
                        const isFixed = fixedClasses.some(fc => fc.subjectId === subj.id);
                        return (
                            <div 
                                key={subj.id} 
                                className={`subject-item ${selectedSubjectId === subj.id ? 'active' : ''} ${isFixed ? 'fixed-item' : ''}`}
                                onClick={() => !isFixed && handleSelectSubject(subj.id)}
                            >
                                <span>{subj.name}</span>
                                {isFixed && (
                                    <button 
                                        className="remove-subject-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectSubject(subj.id);
                                        }}
                                        title="Quitar del horario"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {availableMandatory.length === 0 && (
                        <div className="empty-subjects-msg">No hay materias obligatorias disponibles</div>
                    )}
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Materias Posibles <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', verticalAlign: 'middle' }}>(2do cuatrimestre)</span></h3>
                <div className="subject-list">
                    {fixedClasses.length === 0 && (
                        <div className="empty-subjects-msg">Anotate a materias del 1er cuatrimestre para ver proyecciones</div>
                    )}
                    {fixedClasses.length > 0 && possibleSubjects.length === 0 && (
                        <div className="empty-subjects-msg">No hay materias que se habiliten con las actuales</div>
                    )}
                    {fixedClasses.length > 0 && possibleSubjects.length > 0 && possibleSubjects.map(subj => {
                        const isSelected = selectedPossibleId === subj.id;
                        return (
                            <div
                                key={subj.id}
                                className={`subject-item possible-subject-item ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedSubjectId(null);
                                    setSelectedPossibleId(isSelected ? null : subj.id);
                                }}
                            >
                                <span>{subj.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Materias Electivas</h3>
                <div className="subject-list">
                    {availableElectives.map(subj => {
                        const isFixed = fixedClasses.some(fc => fc.subjectId === subj.id);
                        return (
                            <div 
                                key={subj.id} 
                                className={`subject-item ${selectedSubjectId === subj.id ? 'active' : ''} ${isFixed ? 'fixed-item' : ''}`}
                                onClick={() => !isFixed && handleSelectSubject(subj.id)}
                            >
                                <span>{subj.name}</span>
                                {isFixed && (
                                    <button 
                                        className="remove-subject-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectSubject(subj.id);
                                        }}
                                        title="Quitar del horario"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {availableElectives.length === 0 && (
                        <div className="empty-subjects-msg">No hay materias electivas disponibles</div>
                    )}
                </div>
            </div>

            {/* Priority Section - Collapsible */}
            {priorityList.length > 0 && (
                <div className="sidebar-section">
                    <div 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            background: 'var(--bg-ground)',
                            borderRadius: '4px',
                            marginBottom: showPriority ? '0.5rem' : '0'
                        }}
                        onClick={() => setShowPriority(!showPriority)}
                    >
                        <h3 style={{ margin: 0 }}>Prioridad de Materias</h3>
                        <span style={{ fontSize: '1.2rem' }}>{showPriority ? '▾' : '▸'}</span>
                    </div>
                    
                    {showPriority && (
                        <>
                            <p style={{ 
                                fontSize: '0.85rem', 
                                color: 'var(--text-secondary)', 
                                margin: '0.5rem 0',
                                textAlign: 'center'
                            }}>
                                Aprobar estas habilita más materias:
                            </p>
                            <div style={{ 
                                maxHeight: '200px', 
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                {priorityList.map(subj => {
                                    const isFixed = fixedClasses.some(fc => fc.subjectId === subj.id);
                                    return (
                                        <div 
                                            key={subj.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                background: isFixed ? 'var(--success-bg, #dcfce7)' : 'var(--bg-ground)',
                                                border: `1px solid ${selectedSubjectId === subj.id ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                                borderRadius: '4px',
                                                cursor: isFixed ? 'default' : 'pointer',
                                                opacity: isFixed ? 0.6 : 1,
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => !isFixed && handleSelectSubject(subj.id)}
                                        >
                                            <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                                {subj.name}
                                            </div>
                                            <div 
                                                style={{ 
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={`Habilita ${subj.unlocksMandatory} obligatorias y ${subj.unlocksElective} electivas`}
                                            >
                                                +{subj.unlocksCount} ({subj.unlocksMandatory} Ob. + {subj.unlocksElective} El.)
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default Armador;
