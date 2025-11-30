import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguration baserad på VERIFIERADE API-endpoints
const APIS = [
  {
    name: 'Syllabus (Läroplaner)',
    url: 'https://api.skolverket.se/syllabus/v3/api-docs',
    output: '../src/types/generated/syllabus-schema.ts'
  },
  {
    name: 'School Units (Skolenhetsregistret) v2',
    url: 'https://api.skolverket.se/skolenhetsregistret/skolenhetsregistret_v2_openapi.yaml',
    output: '../src/types/generated/school-units-schema.ts'
  },
  {
    name: 'Planned Education (Utbildningsinfo)',
    url: 'https://api.skolverket.se/planned-educations/v3/api-docs',
    output: '../src/types/generated/planned-education-schema.ts'
  }
];

async function generateTypes() {
  const generatedDir = path.join(__dirname, '../src/types/generated');
  
  // Skapa katalogen om den saknas
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  console.log('🚀 Startar uppdatering av Skolverkets API-definitioner...\n');

  for (const api of APIS) {
    const outputPath = path.join(__dirname, api.output);
    console.log(`📦 Hämtar ${api.name} från: ${api.url}`);

    try {
      // Genererar TypeScript-typer direkt från Swagger/OpenAPI
      execSync(`npx openapi-typescript ${api.url} -o ${outputPath}`, { 
        stdio: 'inherit',
        encoding: 'utf-8' 
      });

      // Lägg till header för tydlighet
      if (fs.existsSync(outputPath)) {
        const content = fs.readFileSync(outputPath, 'utf-8');
        const header = `/**\n * AUTO-GENERATED FILE - DO NOT EDIT\n * Source: ${api.url}\n * Generated at: ${new Date().toISOString()}\n */\n\n`;
        fs.writeFileSync(outputPath, header + content);
        console.log(`✅ Sparad till: ${api.output}\n`);
      }
    } catch (error) {
      console.error(`❌ Misslyckades med ${api.name}. Kontrollera URL eller nätverk.`);
      // Vi fortsätter till nästa API istället för att krascha direkt
    }
  }
}

generateTypes().catch(console.error);
