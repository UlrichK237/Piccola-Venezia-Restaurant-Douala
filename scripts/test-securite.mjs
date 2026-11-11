#!/usr/bin/env node

/**
 * Script de tests automatisés pour les modules TypeScript purs :
 * - src/lib/securite.ts
 * - src/lib/corrections.ts
 * - src/lib/horaires.ts
 *
 * Exécuté avec Node 20+, sans dépendance externe en production.
 * Compile avec tsc dans scripts/out/tests/ puis exécute la suite de tests.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

console.log('=== Lancement des tests de sécurité et utilitaires ===\n');

// 1. Compilation des fichiers TS purs dans scripts/out/tests/
console.log('Compilation TypeScript vers scripts/out/tests/ ...');
try {
  execSync(
    'npx tsc src/lib/securite.ts src/lib/corrections.ts src/lib/horaires.ts --outDir scripts/out/tests --target es2022 --module esnext --moduleResolution bundler --declaration false --ignoreConfig',
    { stdio: 'inherit' }
  );
  console.log('[OK] Compilation réussie.\n');
} catch (err) {
  console.error('[ERREUR] Échec de la compilation TypeScript des modules de test.');
  process.exit(1);
}

// 2. Importation des modules compilés
const outDir = path.resolve('scripts', 'out', 'tests');
const securitePath = pathToFileURL(path.join(outDir, 'securite.js')).href;
const correctionsPath = pathToFileURL(path.join(outDir, 'corrections.js')).href;
const horairesPath = pathToFileURL(path.join(outDir, 'horaires.js')).href;

const securite = await import(securitePath);
const corrections = await import(correctionsPath);
const horaires = await import(horairesPath);

function test(description, assertionFn) {
  try {
    const passed = assertionFn();
    if (passed) {
      console.log(`[OK] ${description}`);
    } else {
      console.error(`[ERREUR] ${description} : Assertion non vérifiée`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`[ERREUR] ${description} : Exception ${err.message}`);
    process.exit(1);
  }
}

// --- Tests validateNom ---
test('validateNom : accepte "Jean-Paul", "Marie-Hélène", "Ngono"', () => {
  const r1 = securite.validateNom('Jean-Paul');
  const r2 = securite.validateNom('Marie-Hélène');
  const r3 = securite.validateNom('Ngono');
  return r1.valide && r2.valide && r3.valide;
});

test('validateNom : refuse "John<script>", "", "A", "a"', () => {
  const r1 = securite.validateNom('John<script>');
  const r2 = securite.validateNom('');
  const r3 = securite.validateNom('A');
  const r4 = securite.validateNom('a');
  return !r1.valide && !r2.valide && !r3.valide && !r4.valide;
});

// --- Tests validatePhone ---
test('validatePhone : accepte "+237 6 99 93 17 21"', () => {
  const res = securite.validatePhone('+237 6 99 93 17 21');
  return (
    res.valide === true &&
    res.telephoneE164 === '+237699931721' &&
    res.telephoneNormalise === '699931721'
  );
});

test('validatePhone : accepte "699931721"', () => {
  const res = securite.validatePhone('699931721');
  return (
    res.valide === true &&
    res.telephoneE164 === '+237699931721' &&
    res.telephoneNormalise === '699931721'
  );
});

test('validatePhone : accepte "+33 6 12 34 56 78"', () => {
  const res = securite.validatePhone('+33 6 12 34 56 78');
  return (
    res.valide === true &&
    res.telephoneE164 === '+33612345678' &&
    res.telephoneNormalise === '33612345678'
  );
});

test('validatePhone : refuse "12345" avec erreur contenant "9 chiffres"', () => {
  const res = securite.validatePhone('12345');
  const err = (res.erreur || res.error || '').toLowerCase();
  return res.valide === false && err.includes('9 chiffres');
});

test('validatePhone : refuse "+33 1 23" avec erreur contenant "indicatif"', () => {
  const res = securite.validatePhone('+33 1 23');
  const err = (res.erreur || res.error || '').toLowerCase();
  return res.valide === false && err.includes('indicatif');
});

// --- Tests sanitizeText ---
test('sanitizeText : neutralise les balises HTML et les retours à la ligne consécutifs', () => {
  const dirty = '<b>Texte important</b>\n\n\n\nDeuxième ligne';
  const clean = securite.sanitizeText(dirty);
  return !clean.includes('<b>') && !clean.includes('</b>') && !clean.includes('\n\n\n') && clean.includes('Texte important\nDeuxième ligne');
});

// --- Tests buildWhatsAppUrl ---
test('buildWhatsAppUrl : encode correctement les paramètres et refuse les caractères non autorisés', () => {
  const validUrl = securite.buildWhatsAppUrl('+237699931721', 'Bonjour & Bienvenue !');
  const isEncoded = validUrl && validUrl.includes('Bonjour%20%26%20Bienvenue%20!');
  const invalidUrl = securite.buildWhatsAppUrl('invalid-phone', 'Test');
  return isEncoded && invalidUrl === null;
});

// --- Tests appliquerCorrections ---
test('appliquerCorrections : remplace "Parmesane" par "Parmigiana" sans toucher à "Parmesanes"', () => {
  const dict = { Parmesane: 'Parmigiana' };
  const res1 = corrections.appliquerCorrections('Aubergines à la Parmesane', dict);
  const res2 = corrections.appliquerCorrections('Les sauces Parmesanes sont bonnes', dict);
  return res1 === 'Aubergines à la Parmigiana' && res2 === 'Les sauces Parmesanes sont bonnes';
});

test('appliquerCorrections : remplace "Gnocci" par "Gnocchi"', () => {
  const dict = { Gnocci: 'Gnocchi' };
  const res = corrections.appliquerCorrections('Assiette de Gnocci pesto', dict);
  return res === 'Assiette de Gnocchi pesto';
});

test('appliquerCorrections : ne touche pas à un texte sans faute', () => {
  const dict = { Parmesane: 'Parmigiana', Gnocci: 'Gnocchi' };
  const text = 'Pizza Margherita classique et savoureuse';
  const res = corrections.appliquerCorrections(text, dict);
  return res === text;
});

// --- Tests horaires ---
test('horaires : maintenantDouala renvoie un fuseau cohérent (+01:00) avec dateIso et minutes', () => {
  const now = horaires.maintenantDouala();
  const dateIsoValid = /^\d{4}-\d{2}-\d{2}$/.test(now.dateIso);
  const minutesValid = typeof now.minutes === 'number' && now.minutes >= 0 && now.minutes < 1440;
  const fuseauValid = now.fuseau === '+01:00';
  return dateIsoValid && minutesValid && fuseauValid;
});

test('horaires : calculerDateMax(date, 30) ajoute exactement 30 jours civils', () => {
  const base = '2026-03-01';
  const max = horaires.calculerDateMax(base, 30);
  return max === '2026-03-31';
});

test('horaires : genererCreneauxHoraires exclut les créneaux passés si la date demandée est aujourd\'hui à Douala', () => {
  const now = horaires.maintenantDouala();
  // Générer créneaux pour aujourd'hui
  const slotsAujourdhui = horaires.genererCreneauxHoraires(now.dateIso, '08:00 - 23:00');
  const pastSlotsExcluded = slotsAujourdhui.every((slot) => {
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m > now.minutes;
  });
  // Générer pour une date future (ex: dans 10 jours)
  const dateFuture = horaires.calculerDateMax(now.dateIso, 10);
  const slotsFuturs = horaires.genererCreneauxHoraires(dateFuture, '08:00 - 23:00');
  const fullSlotsIncluded = slotsFuturs.includes('08:00');
  return pastSlotsExcluded && fullSlotsIncluded;
});

console.log('\n------------------------------------------------------------');
console.log('✅ Tous les tests unitaires de sécurité et logique ont réussi.');
process.exit(0);
