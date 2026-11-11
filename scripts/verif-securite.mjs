#!/usr/bin/env node

/**
 * Script de vérification automatique de sécurité et conformité.
 * Exécuté avec Node 20+, sans dépendance externe.
 * Termine avec code 0 si tout est OK, ou code 1 en cas d'erreur.
 */

import fs from 'node:fs';
import path from 'node:path';

let hasError = false;

function report(testName, ok, details = '') {
  if (ok) {
    console.log(`[OK] ${testName}`);
  } else {
    console.error(`[ERREUR] ${testName} ${details ? ': ' + details : ''}`);
    hasError = true;
  }
}

function getAllFiles(dir, exts = []) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.length === 0 || exts.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ----------------------------------------------------------------------------
// 1. Contrôle des termes interdits dans src/
// ----------------------------------------------------------------------------
const forbiddenTerms = [
  'MODE_DEMO',
  'BANDEAU_DEMO_HAUT',
  'Maquette',
  'non officielle',
  'dangerouslySetInnerHTML',
  'innerHTML',
  'eval(',
  'new Function',
  '/public/assets',
  'PV-CMD',
  'RES-',
  'Commande Confirmée',
  'confirmée instantanément',
  'momo',
  'Orange Money',
  'quartiersDouala',
  'maxReservationsParCreneau'
];

const srcFiles = getAllFiles('src');
let forbiddenFound = [];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const term of forbiddenTerms) {
    if (content.includes(term)) {
      forbiddenFound.push(`${file} contient "${term}"`);
    }
  }
}

report(
  '1. Aucun terme interdit dans src/',
  forbiddenFound.length === 0,
  forbiddenFound.join(', ')
);

// ----------------------------------------------------------------------------
// 2. "wa.me" n'apparaît que dans src/lib/whatsapp.ts
// ----------------------------------------------------------------------------
let waMeViolations = [];
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const normalizedPath = file.replace(/\\/g, '/');
  if (content.includes('wa.me') && !normalizedPath.endsWith('src/lib/whatsapp.ts')) {
    waMeViolations.push(file);
  }
}

report(
  '2. "wa.me" strictement isolé dans src/lib/whatsapp.ts',
  waMeViolations.length === 0,
  waMeViolations.join(', ')
);

// ----------------------------------------------------------------------------
// 3. localStorage n'est utilisé que dans le fichier du panier, seule clé pv_panier_v2 écrite
// ----------------------------------------------------------------------------
let storageViolations = [];
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const normalizedPath = file.replace(/\\/g, '/');
  if (content.includes('localStorage')) {
    if (!normalizedPath.endsWith('src/context/CartContext.tsx')) {
      storageViolations.push(`localStorage présent dans ${file}`);
    } else {
      // Vérification des clés écrites via setItem
      const setItemMatches = content.match(/localStorage\.setItem\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
      for (const m of setItemMatches) {
        if (!m.includes('pv_panier_v2')) {
          storageViolations.push(`Clé d'écriture non autorisée: ${m}`);
        }
      }
    }
  }
}

report(
  '3. localStorage isolé dans CartContext.tsx avec seule clé écrite pv_panier_v2',
  storageViolations.length === 0,
  storageViolations.join(', ')
);

// ----------------------------------------------------------------------------
// 4. index.html : pas de noindex, pas de fonts.googleapis.com, lang="fr"
// ----------------------------------------------------------------------------
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexNoindex = indexHtml.includes('noindex');
const indexGoogleFonts = indexHtml.includes('fonts.googleapis.com');
const indexLangFr = /<html[^>]*lang=["']fr["']/i.test(indexHtml);

report(
  '4. index.html configuré (lang="fr", aucun noindex, aucune requête Google Fonts)',
  !indexNoindex && !indexGoogleFonts && indexLangFr,
  `noindex: ${indexNoindex}, googleFonts: ${indexGoogleFonts}, langFr: ${indexLangFr}`
);

// ----------------------------------------------------------------------------
// 5. package.json sans dépendances superflues et package-lock.json présent
// ----------------------------------------------------------------------------
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const forbiddenDeps = ['@google/genai', 'express', 'dotenv', 'motion', 'tsx'];
const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const foundDeps = forbiddenDeps.filter(d => allDeps[d] !== undefined);
const lockExists = fs.existsSync('package-lock.json');

report(
  '5. package.json nettoyé et package-lock.json présent',
  foundDeps.length === 0 && lockExists,
  `dépendances interdites: [${foundDeps.join(', ')}], lockfile présent: ${lockExists}`
);

// ----------------------------------------------------------------------------
// 6. public/_headers existe et contient les en-têtes requis
// ----------------------------------------------------------------------------
let headersOk = false;
let headersDetails = '';
if (fs.existsSync('public/_headers')) {
  const headers = fs.readFileSync('public/_headers', 'utf8');
  const hasCsp = headers.includes('Content-Security-Policy');
  const hasNosniff = headers.includes('X-Content-Type-Options');
  const hasRef = headers.includes('Referrer-Policy');
  const hasFrame = headers.includes('frame-ancestors');
  headersOk = hasCsp && hasNosniff && hasRef && hasFrame;
  if (!headersOk) {
    headersDetails = `CSP: ${hasCsp}, nosniff: ${hasNosniff}, referrer: ${hasRef}, frame: ${hasFrame}`;
  }
} else {
  headersDetails = 'Fichier public/_headers introuvable';
}

report(
  '6. public/_headers configuré avec les en-têtes de sécurité',
  headersOk,
  headersDetails
);

// ----------------------------------------------------------------------------
// 7. public/assets/aistudio et metadata.json n'existent pas
// ----------------------------------------------------------------------------
const aistudioExists = fs.existsSync('public/assets/aistudio');
const metadataExists = fs.existsSync('metadata.json');

report(
  '7. Dossier public/assets/aistudio et metadata.json absents',
  !aistudioExists && !metadataExists,
  `aistudio: ${aistudioExists}, metadata.json: ${metadataExists}`
);

// ----------------------------------------------------------------------------
// 8. Dans dist/ : URL https:// restreintes à la liste blanche
// ----------------------------------------------------------------------------
const allowedHosts = new Set([
  'wa.me',
  'schema.org',
  'www.w3.org',
  'www.google.com',
  'commons.wikimedia.org',
  'creativecommons.org',
  'react.dev',
  'tailwindcss.com',
  // Hôtes autorisés issus des crédits photos de platPhotos.json
  'www.flickr.com'
]);

let distViolations = [];
if (fs.existsSync('dist')) {
  const distFiles = getAllFiles('dist', ['.html', '.js', '.css']);
  const urlRegex = /https:\/\/([a-zA-Z0-9.-]+)/g;

  for (const file of distFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      const host = match[1];
      if (!allowedHosts.has(host)) {
        distViolations.push(`${path.basename(file)}: ${host}`);
      }
    }
  }
  report(
    '8. URLs dist/ conformes à la liste blanche autorisée',
    distViolations.length === 0,
    `Hôtes non autorisés trouvés: ${[...new Set(distViolations)].join(', ')}`
  );
} else {
  console.log('[INFO] Dossier dist/ absent. Lancez npm run build pour vérifier le bloc 8.');
}

// ----------------------------------------------------------------------------
// 9. vercel.json existe, JSON valide, CSP identique et noindex sur vercel.app
// ----------------------------------------------------------------------------
let vercelOk = false;
let vercelDetails = '';
if (fs.existsSync('vercel.json')) {
  try {
    const vContent = fs.readFileSync('vercel.json', 'utf8');
    const vJson = JSON.parse(vContent);
    const headers = fs.readFileSync('public/_headers', 'utf8');
    const cspMatch = headers.match(/Content-Security-Policy:\s*(.+)/);
    const rawCsp = cspMatch ? cspMatch[1].trim() : '';

    const firstBlock = vJson.headers?.[0];
    const secondBlock = vJson.headers?.[1];

    const vercelCspObj = firstBlock?.headers?.find(h => h.key === 'Content-Security-Policy');
    const vercelCsp = vercelCspObj ? vercelCspObj.value.trim() : '';

    const cspMatches = rawCsp && vercelCsp && (rawCsp === vercelCsp);
    const hasRuleApp = secondBlock?.has?.[0]?.value === '.*\\.vercel\\.app';
    const hasNoIndex = secondBlock?.headers?.some(h => h.key === 'X-Robots-Tag' && h.value.includes('noindex'));

    vercelOk = Boolean(cspMatches && hasRuleApp && hasNoIndex);
    if (!vercelOk) {
      vercelDetails = `cspMatches: ${cspMatches}, hasRuleApp: ${hasRuleApp}, hasNoIndex: ${hasNoIndex}`;
    }
  } catch (err) {
    vercelDetails = `Erreur JSON: ${err.message}`;
  }
} else {
  vercelDetails = 'Fichier vercel.json introuvable';
}

report(
  '9. vercel.json conforme (CSP identique à public/_headers et règle noindex pour .vercel.app)',
  vercelOk,
  vercelDetails
);

// ----------------------------------------------------------------------------
// 10. bun.lock n'existe pas
// ----------------------------------------------------------------------------
const bunLockExists = fs.existsSync('bun.lock');
report('10. bun.lock absent du projet', !bunLockExists, bunLockExists ? 'bun.lock trouvé à la racine' : '');

// ----------------------------------------------------------------------------
// 11. Numéro en dur 237699931721 absent de src/
// ----------------------------------------------------------------------------
let hardcodedNumberViolations = [];
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('237699931721')) {
    hardcodedNumberViolations.push(file);
  }
}
report(
  '11. Numéro en dur 237699931721 absent de src/',
  hardcodedNumberViolations.length === 0,
  hardcodedNumberViolations.join(', ')
);

// ----------------------------------------------------------------------------
// 12. .env.example contient VITE_WHATSAPP_NUMBER
// ----------------------------------------------------------------------------
let envExampleOk = false;
if (fs.existsSync('.env.example')) {
  const envContent = fs.readFileSync('.env.example', 'utf8');
  envExampleOk = envContent.includes('VITE_WHATSAPP_NUMBER');
}
report('12. .env.example contient VITE_WHATSAPP_NUMBER', envExampleOk);

// ----------------------------------------------------------------------------
// 13. public/favicon.svg existe et est référencé dans index.html
// ----------------------------------------------------------------------------
const faviconSvgExists = fs.existsSync('public/favicon.svg');
const indexHasFavicon = indexHtml.includes('/favicon.svg');
report(
  '13. public/favicon.svg existe et est référencé dans index.html',
  faviconSvgExists && indexHasFavicon,
  `faviconExists: ${faviconSvgExists}, indexHasFavicon: ${indexHasFavicon}`
);

// ----------------------------------------------------------------------------
// 14. package.json contient le script "verif"
// ----------------------------------------------------------------------------
const hasVerifScript = typeof pkg.scripts?.verif === 'string' && pkg.scripts.verif.includes('scripts/verif-securite.mjs');
report('14. package.json contient le script "verif"', hasVerifScript);

console.log('------------------------------------------------------------');
if (hasError) {
  console.error('❌ Échec de la vérification de sécurité.');
  process.exit(1);
} else {
  console.log('✅ Tous les contrôles de sécurité et de conformité sont passés avec succès.');
  process.exit(0);
}
