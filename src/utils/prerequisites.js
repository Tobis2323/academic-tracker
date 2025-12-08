export const getMissingPrerequisites = (subject, userProgress, allSubjects) => {
  const missing = { regular: [], approved: [] };

  // Check regular prerequisites (need to be Regularized OR Approved)
  subject.regularPrereqs.forEach(id => {
    const status = userProgress[id]?.status;
    if (status !== 'regularized' && status !== 'approved') {
      const prereq = allSubjects.find(s => s.id === id);
      if (prereq) missing.regular.push(prereq);
    }
  });

  // Check approved prerequisites (need to be Approved)
  subject.approvedPrereqs.forEach(id => {
    const status = userProgress[id]?.status;
    if (status !== 'approved') {
      const prereq = allSubjects.find(s => s.id === id);
      if (prereq) missing.approved.push(prereq);
    }
  });

  return missing;
};

export const isLocked = (subject, userProgress, allSubjects) => {
  const missing = getMissingPrerequisites(subject, userProgress, allSubjects);
  return missing.regular.length > 0 || missing.approved.length > 0;
};
