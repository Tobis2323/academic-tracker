import { useState, useEffect } from 'react';
import SubjectTable from './components/SubjectTable';
import ElectivesTable from './components/ElectivesTable';
import Sidebar from './components/Sidebar';
import { subjects, electives } from './data/subjects';

function App() {
  // Load initial state from localStorage or default to empty object
  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('academicProgress');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeElectives, setActiveElectives] = useState(() => {
    const saved = localStorage.getItem('activeElectives');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('academicProgress', JSON.stringify(userProgress));
  }, [userProgress]);

  useEffect(() => {
    localStorage.setItem('activeElectives', JSON.stringify(activeElectives));
  }, [activeElectives]);

  const handleUpdateProgress = (subjectId, newData) => {
    setUserProgress(prev => ({
      ...prev,
      [subjectId]: newData
    }));
  };

  const handleAddElective = (subjectId) => {
    if (!activeElectives.includes(subjectId)) {
      setActiveElectives(prev => [...prev, subjectId]);
    }
  };

  const handleRemoveElective = (subjectId) => {
    setActiveElectives(prev => prev.filter(id => id !== subjectId));
    // Clear progress for removed elective
    setUserProgress(prev => {
      const newState = { ...prev };
      delete newState[subjectId];
      return newState;
    });
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar todo? Esto borrará todo tu progreso y las materias electivas agregadas.')) {
      setUserProgress({});
      setActiveElectives([]);
    }
  };

  // Combine subjects for main table
  const displayedSubjects = [
    ...subjects,
    ...electives.filter(e => activeElectives.includes(e.id))
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div>
      <div className="main-layout">
        <div className="content-area">
          <h1>Seguimiento Académico - Ingeniería en Sistemas</h1>
          
          <SubjectTable 
            subjects={displayedSubjects} 
            userProgress={userProgress} 
            onUpdateProgress={handleUpdateProgress}
            onRemoveElective={handleRemoveElective}
            allSubjects={[...subjects, ...electives]} // Pass all for prereq checking
          />

          <ElectivesTable 
            electives={electives}
            activeElectives={activeElectives}
            userProgress={userProgress}
            subjects={[...subjects, ...electives]} // Pass all for prereq checking
            onAddElective={handleAddElective}
            onRemoveElective={handleRemoveElective}
          />
        </div>
        
        <Sidebar 
          subjects={subjects}
          electives={electives}
          userProgress={userProgress}
          activeElectives={activeElectives}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}

export default App;
