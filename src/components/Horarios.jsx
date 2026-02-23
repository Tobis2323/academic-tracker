import { useState, useEffect } from 'react';
import comisiones2do from '../data/comisiones2do.json';
import comisiones3ro from '../data/comisiones3ro.json';
import comisiones4to from '../data/comisiones4to.json';
import comisiones5to from '../data/comisiones5to.json';
import { subjects, electives } from '../data/subjects';
import './Horarios.css';

function Horarios() {
  // Map of available years
  const availableYears = {
    '2do': { data: comisiones2do, label: '2do Año' },
    '3ro': { data: comisiones3ro, label: '3er Año' },
    '4to': { data: comisiones4to, label: '4to Año' },
    // Placeholders for future years
    '1ro': { data: null, label: '1er Año' },
    '5to': { data: comisiones5to, label: '5to Año' }
  };

  const [selectedYear, setSelectedYear] = useState('2do');
  const [selectedComision, setSelectedComision] = useState('');
  const [viewMode, setViewMode] = useState('comision'); // 'comision' or 'materia'
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [hoveredComision, setHoveredComision] = useState(null);

  // Get selected year data
  const yearData = availableYears[selectedYear].data;
  
  // Set initial selections when year changes
  useEffect(() => {
    if (yearData && yearData.comisiones.length > 0) {
      // Logic for Comision Mode
      const currentComisionExists = yearData.comisiones.some(c => c.id === selectedComision);
      if (!currentComisionExists) {
        setSelectedComision(yearData.comisiones[0].id);
      }
      
      // Logic for Materia Mode
      // Reset subject if it doesn't belong to the new year?
      // For simplicity, we can just clear it or let the user pick.
      // We'll filter the available subjects in the render.
    }
  }, [selectedYear, yearData, selectedComision]);

  // Get filtered subjects for the current year
  // Get filtered subjects for the current year based on available data
  // Instead of static year, we look at what's actually in the JSON
  const availableSubjectIds = new Set();
  
  if (yearData) {
      yearData.comisiones.forEach(c => {
          c.materias.forEach(m => {
              if (m.id) availableSubjectIds.add(m.id);
              if (m.ids) m.ids.forEach(id => availableSubjectIds.add(id));
          });
      });
  }

  const allSubjects = [...subjects, ...electives];
  const currentYearSubjects = allSubjects.filter(s => {
      // Logic: If we have data, show only what's in the data.
      // Fallback to year-based if data is missing (though data should be there for dropdown to matter)
      if (yearData) {
          return availableSubjectIds.has(s.id);
      }
      
      // Fallback to static mapping
      const yearMap = { '1ro': 1, '2do': 2, '3ro': 3, '4to': 4, '5to': 5 };
      return s.year === yearMap[selectedYear];
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Get data based on view mode
  const getDisplayData = () => {
    if (viewMode === 'comision') {
      return yearData?.comisiones.find(c => c.id === selectedComision);
    } else if (viewMode === 'materia' && selectedSubjectId) {
      if (!yearData) return null;
      
      const aggregatedMaterias = [];
      const subjectIdInt = parseInt(selectedSubjectId);

      yearData.comisiones.forEach(comision => {
        const match = comision.materias.find(m => 
          m.id === subjectIdInt || (m.ids && m.ids.includes(subjectIdInt))
        );

        if (match) {
          // Clone and modify for display
          aggregatedMaterias.push({
            ...match,
            displayCode: comision.id, // Show Commission ID (5K1) instead of Subject Code
            originalCode: match.codigo, // Keep original for color
            // Ensure distinct key for rendering if needed
          });
        }
      });
      
      if (aggregatedMaterias.length > 0) {
        return {
          id: 'aggregated',
          turno: 'Todos',
          materias: aggregatedMaterias
        };
      }
    }
    return null;
  };

  const comisionData = getDisplayData();

  // Define base days of the week
  const baseDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // Check if Saturday is needed for a specific semester
  const getDaysForSemester = (semestre) => {
    if (!comisionData) return baseDias;

    const hasSaturday = comisionData.materias.some(materia => 
      materia.horarios.some(h => h.dia === 'Sábado' && h.semestre === semestre)
    );

    return hasSaturday ? [...baseDias, 'Sábado'] : baseDias;
  };

  // Function to parse time string to minutes from midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Function to format minutes to time string
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Get all time slots for the selected commission
  const getAllTimeSlots = () => {
    if (!comisionData) return { start: 480, end: 1380 }; // Default 8:00 to 23:00

    let minTime = Infinity;
    let maxTime = -Infinity;

    comisionData.materias.forEach(materia => {
      materia.horarios.forEach(horario => {
        const start = timeToMinutes(horario.inicio);
        const end = timeToMinutes(horario.fin);
        minTime = Math.min(minTime, start);
        maxTime = Math.max(maxTime, end);
      });
    });

    // Round to nearest hour
    minTime = Math.floor(minTime / 60) * 60;
    maxTime = Math.ceil(maxTime / 60) * 60;

    return { start: minTime, end: maxTime };
  };

  const { start: startTime, end: endTime } = getAllTimeSlots();
  const totalMinutes = endTime - startTime;

  // Generate time labels
  const generateTimeLabels = () => {
    const labels = [];
    for (let time = startTime; time <= endTime; time += 60) {
      labels.push(minutesToTime(time));
    }
    return labels;
  };

  // Get classes for a specific day and semester with overlap detection
  const getClassesForDay = (dia, semestre) => {
    if (!comisionData) return [];

    const classes = [];
    comisionData.materias.forEach(materia => {
      const horariosForDayAndSemester = materia.horarios.filter(
        h => h.dia === dia && h.semestre === semestre
      );

      horariosForDayAndSemester.forEach(horario => {
        classes.push({
          codigo: materia.codigo,
          nombre: materia.nombre,
          inicio: horario.inicio,
          fin: horario.fin,
          tipo: materia.tipo,
          inicioMinutes: timeToMinutes(horario.inicio),
          tipo: materia.tipo,
          inicioMinutes: timeToMinutes(horario.inicio),
          finMinutes: timeToMinutes(horario.fin),
          // Properties for display
          displayCode: materia.displayCode || materia.codigo,
          colorCode: materia.originalCode || materia.codigo
        });
      });
    });

    // Sort by start time
    classes.sort((a, b) => a.inicioMinutes - b.inicioMinutes);

    // Detect overlaps and assign columns
    classes.forEach((clase, index) => {
      let column = 0;
      let maxColumns = 1;

      // Check for overlaps with previous classes
      for (let i = 0; i < index; i++) {
        const other = classes[i];
        // Classes overlap if one starts before the other ends
        if (clase.inicioMinutes < other.finMinutes && clase.finMinutes > other.inicioMinutes) {
          // They overlap, so this class needs a different column
          if (other.column === column) {
            column++;
          }
          maxColumns = Math.max(maxColumns, column + 1);
        }
      }

      clase.column = column;
      clase.totalColumns = maxColumns;
    });

    // Update totalColumns for all overlapping classes
    const groups = [];
    classes.forEach(clase => {
      // Find which group this class belongs to
      let group = groups.find(g => 
        g.some(c => 
          clase.inicioMinutes < c.finMinutes && clase.finMinutes > c.inicioMinutes
        )
      );

      if (!group) {
        group = [];
        groups.push(group);
      }
      group.push(clase);
    });

    // Set totalColumns for each group
    groups.forEach(group => {
      const maxCols = Math.max(...group.map(c => c.column + 1));
      group.forEach(c => c.totalColumns = maxCols);
    });

    return classes;
  };

  // Calculate position and height for a class block
  const getBlockStyle = (clase) => {
    const startMinutes = clase.inicioMinutes;
    const endMinutes = clase.finMinutes;
    const duration = endMinutes - startMinutes;

    const top = ((startMinutes - startTime) / totalMinutes) * 100;
    const height = (duration / totalMinutes) * 100;

    // Calculate width and left position based on column
    const column = clase.column || 0;
    const totalColumns = clase.totalColumns || 1;
    const width = 100 / totalColumns;
    const left = (width * column);

    return {
      top: `${top}%`,
      height: `${height}%`,
      width: `${width}%`,
      left: `${left}%`
    };
  };

  // Color mapping for subjects
  const subjectColors = {
    // 3er Año
    'DSI': '#93c5fd',      // Blue 300
    'COM': '#fcd34d',      // Yellow 300
    'Ingles II': '#86efac', // Green 300
    'BDA': '#fde047',      // Yellow 200
    'DDS': '#fdba74',      // Orange 300
    'AN': '#c4b5fd',       // Purple 300
    'ECO': '#fca5a5',      // Red 300
    'Elect': '#67e8f9',    // Cyan 300
    // 2do Año
    'SOP': '#a78bfa',      // Violet 400
    'AM2': '#60a5fa',      // Blue 400
    'FISII': '#34d399',    // Emerald 400
    'SSL': '#fbbf24',      // Amber 400
    'ASI': '#f472b6',      // Pink 400
    'EST': '#fb923c',      // Orange 400
    'PPR': '#818cf8',      // Indigo 400

    // 4to Año
    'AS': '#7dd3fc',    // Admin de Sistemas (Sky 300)
    'RED': '#fca5a5',   // Redes (Red 300)
    'SIM': '#d8b4fe',   // Simulación (Fuchsia 300)
    'IOP': '#86efac',   // Inv. Operativa (Green 300)
    'E1': '#fdba74',    // Electiva 1 (Orange 300)
    'E2': '#67e8f9',    // Electiva 2 (Cyan 300)
    'LEG': '#a5b4fc',   // Legislación (Indigo 300)
    'TA': '#f9a8d4',    // Tecnologías para Auto (Pink 300)
    'IS': '#fcd34d',    // Ing. Software (Amber 300)
    'DAO': '#cbd5e1',   // DAO (Slate 300)

    // 5to Año
    'IA / Proy Fin': '#6366f1', // Indigo 500
    'Proy Fin / GG': '#64748b', // Slate 500
    'SSI': '#f43f5e',      // Rose 500
    'GG': '#3b82f6',       // Blue 500
    'SG': '#10b981',       // Emerald 500
    'E1': '#f97316',       // Orange 500
    'SoftAb': '#84cc16',   // Lime 500
    'IA': '#6366f1',       // Indigo 500
    'Proy Fin': '#64748b', // Slate 500
    'CDD': '#14b8a6',      // Teal 500
    'E2': '#06b6d4',       // Cyan 500
    'E3': '#ec4899',       // Pink 500
    'E4 / E5': '#a855f7',  // Purple 500
    'E4': '#d946ef'        // Fuchsia 500
  };

  const renderCalendar = (semestre) => {
    const timeLabels = generateTimeLabels();
    const currentDias = getDaysForSemester(semestre);

    return (
      <div className="calendar-container">
        <h3 className="semester-title">
          {semestre === 1 ? '1er Cuatrimestre' : '2do Cuatrimestre'} - {comisionData?.turno}
        </h3>
        <div 
          className="calendar-grid"
          style={{ gridTemplateColumns: `60px repeat(${currentDias.length}, 1fr)` }}
        >
          {/* Time column */}
          <div className="time-column">
            <div className="time-header"></div>
            {timeLabels.map((time, idx) => (
              <div key={idx} className="time-label">
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {currentDias.map(dia => (
            <div key={dia} className="day-column">
              <div className="day-header">{dia}</div>
              <div className="day-content">
                {/* Time grid lines */}
                {timeLabels.map((_, idx) => (
                  <div key={idx} className="time-slot"></div>
                ))}

                {/* Class blocks */}
                {getClassesForDay(dia, semestre).map((clase, idx) => (
                  <div
                    key={idx}
                    className={`class-block ${hoveredComision && hoveredComision !== clase.displayCode ? 'dimmed' : ''} ${hoveredComision === clase.displayCode ? 'highlighted' : ''}`}
                    style={{
                      ...getBlockStyle(clase),
                      backgroundColor: subjectColors[clase.colorCode] || '#cbd5e1'
                    }}
                    onMouseEnter={() => viewMode === 'materia' && setHoveredComision(clase.displayCode)}
                    onMouseLeave={() => viewMode === 'materia' && setHoveredComision(null)}
                  >
                    <div className="class-code">{clase.displayCode}</div>
                    <div className="class-time">
                      {clase.inicio} - {clase.fin}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check if year data is available
  if (!yearData) {
    return (
      <div className="horarios-view">
        <h1>Horarios de Cursada</h1>
        <div className="controls">
          <label htmlFor="year-select">Año:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="comision-select"
          >
            {Object.entries(availableYears).map(([key, year]) => (
              <option key={key} value={key}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <p>Los horarios para {availableYears[selectedYear].label} aún no están disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="horarios-view">
      <h1>Horarios de Cursada</h1>

      <div className="controls">
        <label htmlFor="year-select">Año:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            setSelectedComision(''); // Reset commission when year changes
          }}
          className="comision-select"
        >
          {Object.entries(availableYears).map(([key, year]) => (
            <option key={key} value={key} disabled={!year.data}>
              {year.label} {!year.data ? '(No disponible)' : ''}
            </option>
          ))}
        </select>

        <div className="view-mode-toggle">
          <label>
            <input 
              type="radio" 
              name="viewMode" 
              value="comision" 
              checked={viewMode === 'comision'} 
              onChange={() => setViewMode('comision')}
            /> Por Comisión
          </label>
          <label>
            <input 
              type="radio" 
              name="viewMode" 
              value="materia" 
              checked={viewMode === 'materia'} 
              onChange={() => setViewMode('materia')}
            /> Por Materia
          </label>
        </div>

        {viewMode === 'comision' ? (
          <>
            <label htmlFor="comision-select">Comisión:</label>
            <select
              id="comision-select"
              value={selectedComision}
              onChange={(e) => setSelectedComision(e.target.value)}
              className="comision-select"
            >
              {yearData?.comisiones.map(comision => (
                <option key={comision.id} value={comision.id}>
                  {comision.id} - {comision.turno}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="subject-select">Materia:</label>
            <select
              id="subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="comision-select"
            >
              <option value="">Seleccione una materia...</option>
              {currentYearSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
              {/* Also add Electives logic if needed? subjects.js seems to distinct them by Year but keep them in 'subjects' OR 'electives' arrays? */}
            </select>
          </>
        )}
      </div>

      <div className="calendars-wrapper">
        {renderCalendar(1)}
        {renderCalendar(2)}
      </div>

      {/* Legend */}
      <div className="legend">
        <h4>Referencias:</h4>
        <div className="legend-items">
          {Object.entries(subjectColors).map(([codigo, color]) => {
            const materia = comisionData?.materias.find(m => m.codigo === codigo);
            if (!materia) return null;
            return (
              <div key={codigo} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: color }}></div>
                <span>{codigo} - {materia.nombre}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Horarios;
