export const subjects = [
  // 1 año
  { id: 1, year: 1, name: "Análisis Matemático I", modality: "A", regularPrereqs: [], approvedPrereqs: [] },
  { id: 2, year: 1, name: "Álgebra y Geometría Analítica", modality: "A", regularPrereqs: [], approvedPrereqs: [] },
  { id: 3, year: 1, name: "Física I", modality: "A", regularPrereqs: [], approvedPrereqs: [] },
  { id: 4, year: 1, name: "Inglés I", modality: "A", regularPrereqs: [], approvedPrereqs: [] },
  { id: 5, year: 1, name: "Matemáticas Discretas", modality: "1C-2C", regularPrereqs: [], approvedPrereqs: [] },
  { id: 6, year: 1, name: "Algoritmos y Estructura de Datos", modality: "A", regularPrereqs: [], approvedPrereqs: [] },
  { id: 7, year: 1, name: "Arquitectura de Computadoras", modality: "2C-1C", regularPrereqs: [], approvedPrereqs: [] },
  { id: 8, year: 1, name: "Sistemas y Organizaciones", modality: "1C-2C", regularPrereqs: [], approvedPrereqs: [] },
  { id: 11, year: 1, name: "Ingeniería y Sociedad", modality: "2C-1C", regularPrereqs: [], approvedPrereqs: [] },

  // 2 año
  { id: 9, year: 2, name: "Análisis Matemático II", modality: "A", regularPrereqs: [1, 2], approvedPrereqs: [] },
  { id: 10, year: 2, name: "Física II", modality: "A", regularPrereqs: [1, 3], approvedPrereqs: [] },
  { id: 12, year: 2, name: "Inglés II", modality: "A", regularPrereqs: [4], approvedPrereqs: [] },
  { id: 13, year: 2, name: "Sintaxis y Semántica de los Lenguajes", modality: "1C-2C", regularPrereqs: [5, 6], approvedPrereqs: [] },
  { id: 14, year: 2, name: "Paradigmas de Programación", modality: "1C-2C", regularPrereqs: [5, 6], approvedPrereqs: [] },
  { id: 15, year: 2, name: "Sistemas Operativos", modality: "A", regularPrereqs: [7], approvedPrereqs: [] },
  { id: 16, year: 2, name: "Análisis de Sistemas de Información (Int)", modality: "A", regularPrereqs: [6, 8], approvedPrereqs: [] },
  { id: 17, year: 2, name: "Probabilidad y Estadística", modality: "1C-2C", regularPrereqs: [1, 2], approvedPrereqs: [] },

  // 3 año
  { id: 18, year: 3, name: "Economía", modality: "2C-1C", regularPrereqs: [], approvedPrereqs: [1, 2] },
  { id: 19, year: 3, name: "Bases de Datos", modality: "1C-2C", regularPrereqs: [13, 16], approvedPrereqs: [5, 6] },
  { id: 20, year: 3, name: "Desarrollo de Software", modality: "1C-2C", regularPrereqs: [14, 16], approvedPrereqs: [5, 6] },
  { id: 21, year: 3, name: "Comunicación de Datos", modality: "A", regularPrereqs: [], approvedPrereqs: [3, 7] },
  { id: 22, year: 3, name: "Análisis Numérico", modality: "2C-1C", regularPrereqs: [9], approvedPrereqs: [1, 2] },
  { id: 23, year: 3, name: "Diseño de Sistemas de Información (Int)", modality: "A", regularPrereqs: [14, 16], approvedPrereqs: [4, 6, 8] },

  // 4 año
  { id: 24, year: 4, name: "Legislación", modality: "2C-1C", regularPrereqs: [11], approvedPrereqs: [] },
  { id: 25, year: 4, name: "Ingeniería y Calidad de Software", modality: "2C-1C", regularPrereqs: [19, 20, 23], approvedPrereqs: [13, 14] },
  { id: 26, year: 4, name: "Redes de Datos", modality: "A", regularPrereqs: [15, 21], approvedPrereqs: [] },
  { id: 27, year: 4, name: "Investigación Operativa", modality: "A", regularPrereqs: [17, 22], approvedPrereqs: [] },
  { id: 28, year: 4, name: "Simulación", modality: "1C-2C", regularPrereqs: [17], approvedPrereqs: [9] },
  { id: 29, year: 4, name: "Tecnologías Para la Automatización", modality: "2C-1C", regularPrereqs: [10, 22], approvedPrereqs: [9] },
  { id: 30, year: 4, name: "Administración de Sistemas de Información(Int)", modality: "A", regularPrereqs: [18, 23], approvedPrereqs: [16] },

  // 5 año
  { id: 31, year: 5, name: "Inteligencia Artificial", modality: "2C-1C", regularPrereqs: [28], approvedPrereqs: [17, 22] },
  { id: 32, year: 5, name: "Ciencia de Datos", modality: "2C-1C", regularPrereqs: [28], approvedPrereqs: [17, 19] },
  { id: 33, year: 5, name: "Sistemas de Gestión", modality: "1C-2C", regularPrereqs: [18, 27], approvedPrereqs: [23] },
  { id: 34, year: 5, name: "Gestión Gerencial", modality: "1C-2C", regularPrereqs: [24, 30], approvedPrereqs: [18] },
  { id: 35, year: 5, name: "Seguridad en los Sistemas de Información", modality: "1C-2C", regularPrereqs: [26, 30], approvedPrereqs: [20, 21] },
  { id: 36, year: 5, name: "Proyecto Final (Int)**", modality: "A", regularPrereqs: [25, 26, 30], approvedPrereqs: [12, 20, 23] },
];

export const electives = [
  // 3 año
  { id: 99, year: 3, name: "Seminario Integrador (Analista)***", modality: "2C", regularPrereqs: [16], approvedPrereqs: [6, 8, 13, 14], credits: 0 },
  { id: 101, year: 3, name: "Backend de Aplicaciones", modality: "2C", regularPrereqs: [14, 13], approvedPrereqs: [6], credits: 4 },

  // 4 año
  { id: 102, year: 4, name: "Green Software", modality: "1C-2C", regularPrereqs: [20, 19], approvedPrereqs: [14, 13], credits: 3 },
  { id: 103, year: 4, name: "Gestión Industrial de la Producción", modality: "1C", regularPrereqs: [19], approvedPrereqs: [8, 16], credits: 3 },
  { id: 104, year: 4, name: "Gestión de la Mejora de los Procesos", modality: "1C", regularPrereqs: [19], approvedPrereqs: [8, 16], credits: 3 },
  { id: 105, year: 4, name: "Desarrollo y Operaciones devOPS", modality: "1C", regularPrereqs: [19, 20], approvedPrereqs: [14, 13], credits: 3 },
  { id: 106, year: 4, name: "Desarrollo de Aplicaciones Con Objetos", modality: "2C", regularPrereqs: [13], approvedPrereqs: [6], credits: 3 },
  { id: 107, year: 4, name: "Comunicación Multimedial en el Desarrollo de Sistemas de Información", modality: "2C", regularPrereqs: [19], approvedPrereqs: [8, 16], credits: 3 },
  { id: 108, year: 4, name: "Arquitectura de Software", modality: "1C", regularPrereqs: [19, 20], approvedPrereqs: [14, 13], credits: 3 },

  // 5 año
  { id: 109, year: 5, name: "Desarrollo de Tecnología Blockchain", modality: "1C", regularPrereqs: [26, 19], approvedPrereqs: [14, 20], credits: 3 },
  { id: 110, year: 5, name: "Creatividad e Innovación en Ingeniería", modality: "1C-2C", regularPrereqs: [30], approvedPrereqs: [20], credits: 3 },
  { id: 111, year: 5, name: "Auditorías de Si/Ti", modality: "1C", regularPrereqs: [30], approvedPrereqs: [20], credits: 3 },
  { id: 112, year: 5, name: "Gerenciamiento Estratégico", modality: "1C", regularPrereqs: [30], approvedPrereqs: [20], credits: 3 },
  { id: 113, year: 5, name: "Consultoría en Negocios Digitales", modality: "1C", regularPrereqs: [30], approvedPrereqs: [20], credits: 3 },
  { id: 114, year: 5, name: "Emprendimientos Tecnológicos", modality: "1C", regularPrereqs: [30], approvedPrereqs: [16, 19], credits: 3 },
  { id: 115, year: 5, name: "Decisiones en Escenarios Complejos", modality: "1C", regularPrereqs: [27], approvedPrereqs: [19], credits: 3 },
  { id: 116, year: 5, name: "Testing de Software", modality: "2C", regularPrereqs: [25], approvedPrereqs: [19, 20], credits: 3 },
  { id: 117, year: 5, name: "Seguridad en el Desarrollo de Software", modality: "2C", regularPrereqs: [26, 19], approvedPrereqs: [20, 8], credits: 3 },
  { id: 118, year: 5, name: "Integración de Aplicaciones en Entorno Web", modality: "2C", regularPrereqs: [26, 19], approvedPrereqs: [19, 20], credits: 3 },
  { id: 119, year: 5, name: "Ingeniería de Software de Fuentes Abiertas/Libres", modality: "2C", regularPrereqs: [19, 20, 26], approvedPrereqs: [13, 14], credits: 3 },
];
