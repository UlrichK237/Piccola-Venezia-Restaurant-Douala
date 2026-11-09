#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const queriesPath = path.join(rootDir, 'src', 'data', 'photoQueries.json');
const platPhotosPath = path.join(rootDir, 'src', 'data', 'platPhotos.json');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(queriesPath)) {
  console.error(`Fichier introuvable : ${queriesPath}`);
  process.exit(1);
}

const photoQueries = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));

let platPhotos = {};
if (fs.existsSync(platPhotosPath)) {
  try {
    platPhotos = JSON.parse(fs.readFileSync(platPhotosPath, 'utf-8'));
  } catch (err) {
    console.error(`Erreur de lecture de ${platPhotosPath} :`, err.message);
    platPhotos = {};
  }
}

const totalEntries = Object.keys(photoQueries).length;
const exactCount = Object.values(photoQueries).filter(x => x.niveau === 'exact').length;
const approchantCount = Object.values(photoQueries).filter(x => x.niveau === 'approchant').length;

const photosPresentes = Object.keys(platPhotos);
const sansPhoto = Object.keys(photoQueries).filter(key => !platPhotos[key]);

console.log('=== Vérification des photos du menu ===\n');
console.log(`Total d'entrées dans photoQueries.json : ${totalEntries} (attendu : 69)`);
console.log(`Nombre de plats "exact"               : ${exactCount} (attendu : 41)`);
console.log(`Nombre de plats "approchant"          : ${approchantCount} (attendu : 28)`);
console.log(`Nombre de photos présentes            : ${photosPresentes.length} / ${totalEntries}\n`);

if (sansPhoto.length > 0) {
  console.log(`Plats sans photo (${sansPhoto.length}) :`);
  sansPhoto.forEach(k => console.log(`  - [${photoQueries[k]?.niveau || 'inconnu'}] ${k}`));
  console.log();
} else {
  console.log('✔ Tous les 69 plats disposent d\'une photo locale.\n');
}

// Vérification des erreurs
const erreurs = {
  platInexistant: [],
  fichierAbsent: [],
  cheminHttp: [],
  metadonneesVides: []
};

for (const [key, item] of Object.entries(platPhotos)) {
  // 1. Photo dont le plat n'existe pas dans photoQueries.json
  if (!photoQueries[key]) {
    erreurs.platInexistant.push(key);
  }

  // 2. Chemin d'image commençant par http ou https
  const fichier = item.fichier || '';
  if (/^https?:\/\//i.test(fichier)) {
    erreurs.cheminHttp.push(`${key} -> ${fichier}`);
  } else {
    // 3. Fichier image absent de public/
    const relPath = fichier.startsWith('/') ? fichier.slice(1) : fichier;
    const fullDiskPath = path.join(publicDir, relPath);
    if (!fs.existsSync(fullDiskPath)) {
      erreurs.fichierAbsent.push(`${key} -> ${fichier} (introuvable dans ${path.relative(rootDir, fullDiskPath)})`);
    }
  }

  // 4. Entrée sans auteur, licence ou source_url
  const auteur = (item.auteur || '').trim();
  const licence = (item.licence || '').trim();
  const sourceUrl = (item.source_url || '').trim();
  if (!auteur || !licence || !sourceUrl) {
    const manquants = [];
    if (!auteur) manquants.push('auteur');
    if (!licence) manquants.push('licence');
    if (!sourceUrl) manquants.push('source_url');
    erreurs.metadonneesVides.push(`${key} (champs manquants : ${manquants.join(', ')})`);
  }
}

const totalErreurs =
  erreurs.platInexistant.length +
  erreurs.fichierAbsent.length +
  erreurs.cheminHttp.length +
  erreurs.metadonneesVides.length;

if (totalErreurs > 0) {
  console.error('\x1b[31m%s\x1b[0m', `ERREURS DÉTECTÉES (${totalErreurs}) :`);

  if (erreurs.platInexistant.length > 0) {
    console.error('\nPlats dans platPhotos.json absents de photoQueries.json :');
    erreurs.platInexistant.forEach(e => console.error(`  - ${e}`));
  }
  if (erreurs.cheminHttp.length > 0) {
    console.error("\nChemins d'image non locaux (http/https interdits) :");
    erreurs.cheminHttp.forEach(e => console.error(`  - ${e}`));
  }
  if (erreurs.fichierAbsent.length > 0) {
    console.error('\nFichiers image introuvables sur le disque :');
    erreurs.fichierAbsent.forEach(e => console.error(`  - ${e}`));
  }
  if (erreurs.metadonneesVides.length > 0) {
    console.error('\nMétadonnées obligatoires vides (auteur, licence, source_url) :');
    erreurs.metadonneesVides.forEach(e => console.error(`  - ${e}`));
  }

  console.error("\nLe script s'est terminé avec code 1 en raison des erreurs ci-dessus.");
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '✔ Aucune erreur détectée : la configuration et les photos sont valides.');
  process.exit(0);
}
