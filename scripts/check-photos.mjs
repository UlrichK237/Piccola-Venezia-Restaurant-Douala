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
const aPhotographier = [];
const exclus = [];

for (const [key, val] of Object.entries(photoQueries)) {
  if (val.exclu) {
    exclus.push(key);
  } else {
    aPhotographier.push(key);
  }
}

const photosPresentes = Object.keys(platPhotos);
const sansPhoto = aPhotographier.filter(key => !platPhotos[key]);

console.log('=== Vérification des photos de plats ===\n');
console.log(`Nombre total d'entrées dans photoQueries.json : ${totalEntries}`);
console.log(`Nombre de plats à photographier               : ${aPhotographier.length}`);
console.log(`Nombre de plats exclus                          : ${exclus.length}`);
console.log(`Nombre de photos présentes dans platPhotos.json : ${photosPresentes.length}\n`);

if (sansPhoto.length > 0) {
  console.log(`Plats à photographier en attente de photo (${sansPhoto.length}) :`);
  sansPhoto.forEach(k => console.log(`  - ${k}`));
  console.log();
} else {
  console.log("Tous les plats à photographier disposent d'une photo.\n");
}

// Vérification des erreurs
const erreurs = {
  platInexistant: [],
  platExclu: [],
  fichierAbsent: [],
  cheminHttp: [],
  metadonneesVides: []
};

for (const [key, item] of Object.entries(platPhotos)) {
  // 1. Photo dont le plat n'existe pas dans photoQueries.json
  if (!photoQueries[key]) {
    erreurs.platInexistant.push(key);
  } else if (photoQueries[key].exclu) {
    // 2. Photo associée à un plat exclu
    erreurs.platExclu.push(key);
  }

  // 3. Chemin d'image commençant par http ou https
  const fichier = item.fichier || '';
  if (/^https?:\/\//i.test(fichier)) {
    erreurs.cheminHttp.push(`${key} -> ${fichier}`);
  } else {
    // 4. Fichier image absent de public/
    const relPath = fichier.startsWith('/') ? fichier.slice(1) : fichier;
    const fullDiskPath = path.join(publicDir, relPath);
    if (!fs.existsSync(fullDiskPath)) {
      erreurs.fichierAbsent.push(`${key} -> ${fichier} (attendu dans ${path.relative(rootDir, fullDiskPath)})`);
    }
  }

  // 5. Entrée dont auteur, licence ou source_url est vide
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
  erreurs.platExclu.length +
  erreurs.fichierAbsent.length +
  erreurs.cheminHttp.length +
  erreurs.metadonneesVides.length;

if (totalErreurs > 0) {
  console.error('\x1b[31m%s\x1b[0m', `ERREURS DÉTECTÉES (${totalErreurs}) :`);

  if (erreurs.platInexistant.length > 0) {
    console.error('\nPlats dans platPhotos.json inexistants dans photoQueries.json :');
    erreurs.platInexistant.forEach(e => console.error(`  - ${e}`));
  }
  if (erreurs.platExclu.length > 0) {
    console.error('\nPhotos associées à un plat exclu :');
    erreurs.platExclu.forEach(e => console.error(`  - ${e}`));
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
