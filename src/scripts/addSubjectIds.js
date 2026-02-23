// Script to add subject IDs to comisiones JSON files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping from subject codes to IDs based on subjects.js
const subjectIdMap = {
  // 2do Año
  'AM2': 9,    // Análisis Matemático II
  'FISII': 10, // Física II
  'Ingles II': 12, // Inglés II
  'SSL': 13,   // Sintaxis y Semántica de los Lenguajes
  'PPR': 14,   // Paradigmas de Programación
  'SOP': 15,   // Sistemas Operativos
  'ASI': 16,   // Análisis de Sistemas de Información
  'PYE': 17,   // Probabilidad y Estadística
  'EST': 17,   // Probabilidad y Estadística (alias)
  
  // 3er Año
  'ECO': 18,   // Economía
  'BDA': 19,   // Bases de Datos
  'DDS': 20,   // Desarrollo de Software
  'Dsoft': 20, // Desarrollo de Software (alias)
  'COM': 21,   // Comunicación de Datos
  'AN': 22,    // Análisis Numérico
  'DSI': 23,   // Diseño de Sistemas de Información
  
  // Electivas 3er Año
  'Elect': 99, // Seminario Integrador (placeholder)

  // 4to Año
  'LEG': 24,   // Legislación
  'IS': 25,    // Ingeniería y Calidad de Software
  'RED': 26,   // Redes de Datos
  'IOP': 27,   // Investigación Operativa
  'SIM': 28,   // Simulación
  'TA': 29,    // Tecnologías Para la Automatización
  'AS': 30,    // Administración de Sistemas de Información
  'DAO': 106   // Desarrollo de Aplicaciones Con Objetos
};

// Mapping for electives by name (when code is E1 or E2)
const electiveNameMap = {
  'Green Software': 102,
  'Gestión Industrial de la Producción': 103, // Full name
  'Gestión Industrial': 103, // Short name
  'Gestión de la Mejora de los Procesos': 104, // Full name
  'Gestión de Procesos': 104, // Short name
  'Desarrollo y Operaciones devOPS': 105,
  'DevOps': 105,
  'Desarrollo de Aplicaciones Con Objetos': 106,
  'Comunicación Multimedial': 107,
  'Arquitectura de Software': 108
};

function addSubjectIds(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Read the JSON file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let updatedCount = 0;
  
  // Iterate through all commissions
  data.comisiones.forEach(comision => {
    comision.materias.forEach(materia => {
      let id = null;

      // Special handling for electives
      if (['E1', 'E2'].includes(materia.codigo)) {
        // Try to match by name
        for (const [name, electiveId] of Object.entries(electiveNameMap)) {
          if (materia.nombre.includes(name)) {
            id = electiveId;
            break;
          }
        }
      } else {
        // Standard mapping by code
        id = subjectIdMap[materia.codigo];
      }

      if (id) {
        materia.id = id;
        updatedCount++;
      } else {
        console.warn(`Warning: No ID found for codigo "${materia.codigo}" name "${materia.nombre}"`);
      }
    });
  });
  
  // Write back to file with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log(`✓ Updated ${updatedCount} subjects in ${path.basename(filePath)}`);
  return updatedCount;
}

// Process both files
const dataDir = path.join(__dirname, '../data');
const files = [
  path.join(dataDir, 'comisiones2do.json'),
  path.join(dataDir, 'comisiones3ro.json'),
  path.join(dataDir, 'comisiones4to.json')
];

let totalUpdated = 0;
files.forEach(file => {
  if (fs.existsSync(file)) {
    totalUpdated += addSubjectIds(file);
  } else {
    console.error(`File not found: ${file}`);
  }
});

console.log(`\n✓ Total subjects updated: ${totalUpdated}`);
