import { useState, useEffect } from 'react';
import SubjectTable from './components/SubjectTable';
import ElectivesTable from './components/ElectivesTable';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Horarios from './components/Horarios';
import Armador from './components/Armador';
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

  const handleUpdateProgress = (subjectId, newData, completeState) => {
    if (completeState !== undefined) {
      // If a complete state is provided, check if we need cascading
      const oldStatus = userProgress[subjectId]?.status;
      const newStatus = completeState[subjectId]?.status;
      
      // Determine what changed
      const wasApproved = oldStatus === 'approved';
      const wasRegularized = oldStatus === 'regularized';
      const isNowApproved = newStatus === 'approved';
      const isNowRegularized = newStatus === 'regularized';
      
      // We need to cascade if:
      // 1. Was approved, now is not (affects subjects needing it as approved prereq)
      // 2. Was approved or regularized, now is neither (affects subjects needing it as regular prereq)
      const needsCascade = (wasApproved && !isNowApproved) || 
                          ((wasApproved || wasRegularized) && !isNowApproved && !isNowRegularized);

      if (needsCascade) {
        // Find all subjects that depend on this one and clear them recursively
        const allSubjects = [...subjects, ...electives];
        const toClear = new Set();

        const findDependents = (prereqId, prereqNewStatus) => {
          allSubjects.forEach(subject => {
            // Check if this subject requires the prereq
            const requiresAsApproved = subject.approvedPrereqs.includes(prereqId);
            const requiresAsRegular = subject.regularPrereqs.includes(prereqId);
            
            // Clear if:
            // - Subject requires it as approved and it's no longer approved
            // - Subject requires it as regular and it's no longer regularized or approved
            const shouldClear = completeState[subject.id] && (
              (requiresAsApproved && prereqNewStatus !== 'approved') ||
              (requiresAsRegular && prereqNewStatus !== 'approved' && prereqNewStatus !== 'regularized')
            );
            
            if (shouldClear) {
              toClear.add(subject.id);
              // Recursively find subjects that depend on this one
              findDependents(subject.id, undefined); // Cleared subjects have no status
            }
          });
        };

        findDependents(subjectId, newStatus);

        // Clear all dependent subjects from the complete state
        const finalState = { ...completeState };
        toClear.forEach(id => {
          delete finalState[id];
        });
        
        setUserProgress(finalState);
      } else {
        setUserProgress(completeState);
      }
    } else {
      setUserProgress(prev => {
        const updated = {
          ...prev,
          [subjectId]: newData
        };

        // If removing status (setting to null/undefined or removing approved/regularized)
        const oldStatus = prev[subjectId]?.status;
        const newStatus = newData?.status;
        
        // Determine what changed
        const wasApproved = oldStatus === 'approved';
        const wasRegularized = oldStatus === 'regularized';
        const isNowApproved = newStatus === 'approved';
        const isNowRegularized = newStatus === 'regularized';
        
        const needsCascade = (wasApproved && !isNowApproved) || 
                            ((wasApproved || wasRegularized) && !isNowApproved && !isNowRegularized);

        if (needsCascade) {
          // Find all subjects that depend on this one and clear them recursively
          const allSubjects = [...subjects, ...electives];
          const toClear = new Set();

          const findDependents = (prereqId, prereqNewStatus) => {
            allSubjects.forEach(subject => {
              const requiresAsApproved = subject.approvedPrereqs.includes(prereqId);
              const requiresAsRegular = subject.regularPrereqs.includes(prereqId);
              
              const shouldClear = updated[subject.id] && (
                (requiresAsApproved && prereqNewStatus !== 'approved') ||
                (requiresAsRegular && prereqNewStatus !== 'approved' && prereqNewStatus !== 'regularized')
              );
              
              if (shouldClear) {
                toClear.add(subject.id);
                findDependents(subject.id, undefined);
              }
            });
          };

          findDependents(subjectId, newStatus);

          // Clear all dependent subjects
          toClear.forEach(id => {
            delete updated[id];
          });
        }

        return updated;
      });
    }
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
  const [currentView, setCurrentView] = useState('correlativas');

  return (
    <div>
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="main-layout">
        <div className="content-area">
          {currentView === 'correlativas' ? (
            <>
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
            </>
          ) : currentView === 'horarios' ? (
            <Horarios />
          ) : (
            <Armador userProgress={userProgress} isSidebarOpen={isSidebarOpen} />
          )}
        </div>
        
        <Sidebar 
          subjects={subjects}
          electives={electives}
          userProgress={userProgress}
          activeElectives={activeElectives}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onReset={handleReset}
          currentView={currentView}
        />
      </div>
    </div>
  );
}

export default App;
