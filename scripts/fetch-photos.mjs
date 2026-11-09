#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Vérification de la variable CONTACT_EMAIL
const contactEmail = process.env.CONTACT_EMAIL;
if (!contactEmail || !contactEmail.trim()) {
  console.error('\x1b[31m%s\x1b[0m', "Erreur : La variable d'environnement CONTACT_EMAIL est manquante.");
  console.error("Conformément aux règles d'utilisation de Wikimedia Commons, un User-Agent avec email de contact est obligatoire.");
  console.error('Veuillez définir CONTACT_EMAIL dans votre fichier .env puis lancer le script avec :');
  console.error('\x1b[36m%s\x1b[0m', '  node --env-file=.env scripts/fetch-photos.mjs\n');
  process.exit(1);
}

const userAgent = `PiccolaVeneziaDemo/1.0 (mailto:${contactEmail.trim()})`;

// Analyse des arguments de la ligne de commande
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const onlyIndex = args.indexOf('--only');
const onlyDish = onlyIndex !== -1 && args[onlyIndex + 1] ? args[onlyIndex + 1].trim().toLowerCase() : null;

// Chemins des fichiers
const queriesPath = path.join(rootDir, 'src', 'data', 'photoQueries.json');
const platPhotosPath = path.join(rootDir, 'src', 'data', 'platPhotos.json');
const photosDir = path.join(rootDir, 'public', 'photos', 'plats');
const outDir = path.join(rootDir, 'scripts', 'out');
const reviewHtmlPath = path.join(outDir, 'photos-review.html');

// Création des dossiers nécessaires
fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// Lecture des requêtes
if (!fs.existsSync(queriesPath)) {
  console.error(`Fichier introuvable : ${queriesPath}`);
  process.exit(1);
}
const photoQueries = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));

// Chargement des photos déjà existantes
let platPhotos = {};
if (fs.existsSync(platPhotosPath)) {
  try {
    platPhotos = JSON.parse(fs.readFileSync(platPhotosPath, 'utf-8'));
  } catch (e) {
    platPhotos = {};
  }
}

// Fonction de pause (600 ms minimum pour Wikimedia)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Génération de slug URL / fichier
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Nettoyage de balises HTML
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Vérification de la licence Wikimedia (CC0, Public domain, CC BY, CC BY-SA, sans NC ni ND)
function isValidLicense(license) {
  if (!license) return false;
  const s = String(license).trim();
  if (/NC|ND/i.test(s)) return false;
  if (/^(CC0|Public[ _-]domain|PD|CC[ _-]BY|CC[ _-]BY[ _-]SA)/i.test(s)) {
    return true;
  }
  return false;
}

// Validation d'un candidat Wikimedia
function isValidCandidate(info, page, motsCles) {
  if (info.mime !== 'image/jpeg') return false;
  if (!info.width || info.width < 800) return false;
  if (!info.thumburl) return false;

  const extmeta = info.extmetadata || {};
  const license = extmeta.LicenseShortName?.value || '';
  if (!isValidLicense(license)) return false;

  const title = (page.title || '').toLowerCase();
  const desc = stripHtml(extmeta.ImageDescription?.value || '').toLowerCase();
  const objName = (extmeta.ObjectName?.value || '').toLowerCase();
  const fullText = `${title} ${desc} ${objName}`;

  const hasKeyword = motsCles.some(kw => fullText.includes(kw.toLowerCase()));
  if (!hasKeyword) return false;

  return true;
}

// Interrogation de l'API Wikimedia Commons
async function searchWikimedia(requete, motsCles) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrsearch', requete);
  url.searchParams.set('gsrlimit', '10');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  url.searchParams.set('iiurlwidth', '720');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': userAgent,
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur HTTP Wikimedia : ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.query || !data.query.pages) {
    return null;
  }

  const pages = Object.values(data.query.pages);
  for (const page of pages) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const info = page.imageinfo[0];
    if (isValidCandidate(info, page, motsCles)) {
      return {
        page,
        info,
      };
    }
  }

  return null;
}

// Téléchargement d'un fichier image
async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
    },
  });
  if (!res.ok) {
    throw new Error(`Échec du téléchargement image (${res.status}) : ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

// Script principal
async function main() {
  console.log('\x1b[32m%s\x1b[0m', '=== Script de téléchargement Wikimedia Commons - Piccola Venezia ===');
  console.log(`User-Agent : ${userAgent}`);
  if (isForce) console.log('Option --force activée : les images existantes seront écrasées.');
  if (onlyDish) console.log(`Option --only activée pour : "${onlyDish}"`);

  let downloadedCount = 0;
  const missingPhotos = [];

  const entries = Object.entries(photoQueries);

  for (const [key, data] of entries) {
    const [categorie, nom] = key.split('::');

    // Filtre --only
    if (onlyDish && !nom.toLowerCase().includes(onlyDish) && !key.toLowerCase().includes(onlyDish)) {
      continue;
    }

    // Ignorer les plats exclus
    if (data.exclu) {
      continue;
    }

    const slug = slugify(nom);
    const fileName = `${slug}.jpg`;
    const destPath = path.join(photosDir, fileName);
    const publicUrl = `/photos/plats/${fileName}`;

    // Si la photo existe déjà et pas de --force
    if (fs.existsSync(destPath) && !isForce && platPhotos[key]) {
      console.log(`[Déjà présent] ${nom} -> ${fileName}`);
      continue;
    }

    console.log(`\nRecherche pour : \x1b[33m${nom}\x1b[0m (${categorie})`);
    let found = null;
    let successfulQuery = null;

    for (const requete of data.requetes) {
      await sleep(600); // 600 ms de pause entre chaque appel
      try {
        const candidate = await searchWikimedia(requete, data.mots_cles);
        if (candidate) {
          found = candidate;
          successfulQuery = requete;
          console.log(`  ✓ Trouvé avec requête : "${requete}" (${candidate.page.title})`);
          break;
        } else {
          console.log(`  - Aucun résultat valable pour : "${requete}"`);
        }
      } catch (err) {
        console.error(`  ✗ Erreur lors de la recherche ("${requete}") :`, err.message);
      }
    }

    if (found) {
      const extmeta = found.info.extmetadata || {};
      const author = stripHtml(extmeta.Artist?.value || extmeta.Credit?.value || 'Inconnu');
      const license = extmeta.LicenseShortName?.value || 'Licence libre';
      const licenseUrl = extmeta.LicenseUrl?.value || '';
      const sourceUrl = found.info.descriptionurl || found.page.fullurl || '';
      const thumbUrl = found.info.thumburl;

      try {
        console.log(`  Téléchargement miniature (${found.info.thumbwidth || 720}px)...`);
        await sleep(600);
        await downloadFile(thumbUrl, destPath);

        platPhotos[key] = {
          fichier: publicUrl,
          auteur: author,
          licence: license,
          licence_url: licenseUrl,
          source_url: sourceUrl,
          requete: successfulQuery,
        };

        downloadedCount++;
        console.log(`  \x1b[32m✔ Enregistré dans ${fileName}\x1b[0m`);
      } catch (err) {
        console.error(`  ✗ Échec téléchargement pour ${nom} :`, err.message);
        missingPhotos.push(`${key} (erreur téléchargement)`);
      }
    } else {
      console.log(`  \x1b[31m✗ Aucune photo trouvée pour ${nom}\x1b[0m`);
      missingPhotos.push(key);
    }
  }

  // Écriture du fichier platPhotos.json mis à jour
  fs.writeFileSync(platPhotosPath, JSON.stringify(platPhotos, null, 2) + '\n', 'utf-8');
  console.log(`\n\x1b[32m✔ Fichier mis à jour : ${platPhotosPath}\x1b[0m`);

  // Génération de scripts/out/photos-review.html
  generateReviewHtml(platPhotos, photoQueries);

  // Résumé
  console.log('\n========================================');
  console.log(`Photos téléchargées / mises à jour : ${downloadedCount}`);
  console.log(`Total des plats avec photo dans platPhotos.json : ${Object.keys(platPhotos).length}`);
  if (missingPhotos.length > 0) {
    console.log(`Plats non exclus sans photo (${missingPhotos.length}) :`);
    missingPhotos.forEach(p => console.log(`  - ${p}`));
  } else {
    console.log('Tous les plats éligibles ont une photo !');
  }
  console.log(`Page de revue générée : ${reviewHtmlPath}`);
  console.log('========================================\n');
}

// Générateur de la page HTML de revue scripts/out/photos-review.html
function generateReviewHtml(platPhotos, photoQueries) {
  // Extraction des descriptions du menu depuis restaurantData.ts
  const restDataPath = path.join(rootDir, 'src', 'data', 'restaurantData.ts');
  const descriptions = {};
  if (fs.existsSync(restDataPath)) {
    const content = fs.readFileSync(restDataPath, 'utf-8');
    const regex = /nom:\s*"([^"]+)",\s*description:\s*("([^"]*)"|null)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      descriptions[match[1]] = match[3] || '';
    }
  }

  const cardsHtml = Object.entries(platPhotos)
    .map(([key, item]) => {
      const [categorie, nom] = key.split('::');
      const menuDesc = descriptions[nom] || '';
      const relPhotoPath = `../../public${item.fichier}`;

      return `
      <div class="card" data-key="${escapeHtml(key)}">
        <div class="card-img-wrap">
          <img src="${escapeHtml(relPhotoPath)}" alt="${escapeHtml(nom)}" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-header">
            <span class="category-badge">${escapeHtml(categorie)}</span>
            <label class="keep-checkbox">
              <input type="checkbox" checked data-key="${escapeHtml(key)}" />
              <span>Garder</span>
            </label>
          </div>
          <h3 class="dish-title">${escapeHtml(nom)}</h3>
          ${menuDesc ? `<p class="dish-desc">"${escapeHtml(menuDesc)}"</p>` : ''}
          <p class="dish-meta">Requête : <em>"${escapeHtml(item.requete || '')}"</em></p>
          <div class="dish-credits">
            <p><strong>Auteur :</strong> ${escapeHtml(item.auteur || 'Inconnu')}</p>
            <p><strong>Licence :</strong> <a href="${escapeHtml(item.licence_url || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.licence || '')}</a></p>
            <p><a href="${escapeHtml(item.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="source-link">Fiche Wikimedia Commons ↗</a></p>
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  const fullDataJson = JSON.stringify(platPhotos);

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vérification des photos - Piccola Venezia</title>
  <style>
    :root {
      --fond: #FBF6EE;
      --texte: #2B1A12;
      --texte-2: #6B5446;
      --marque: #EB7F36;
      --marque-fonce: #A84A15;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--fond);
      color: var(--texte);
      padding: 24px;
      line-height: 1.5;
    }
    header {
      max-width: 1200px;
      margin: 0 auto 24px auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #EADFCF;
    }
    h1 { font-size: 24px; font-weight: bold; }
    p.subtitle { font-size: 14px; color: var(--texte-2); }
    .btn-export {
      background: var(--marque-fonce);
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-export:hover { background: #8D3C0F; }
    .grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .card {
      background: #fff;
      border: 1px solid #EADFCF;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .card-img-wrap {
      width: 100%;
      height: 220px;
      background: #eee;
      position: relative;
    }
    .card-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 8px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-badge {
      font-size: 11px;
      text-transform: uppercase;
      background: #F0E6D8;
      color: var(--texte-2);
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 600;
    }
    .keep-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .dish-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--texte);
    }
    .dish-desc {
      font-size: 12px;
      color: var(--texte-2);
      font-style: italic;
      line-height: 1.4;
    }
    .dish-meta { font-size: 12px; color: var(--texte-2); }
    .dish-credits {
      font-size: 12px;
      color: var(--texte-2);
      border-top: 1px dashed #EADFCF;
      padding-top: 8px;
      margin-top: auto;
    }
    .dish-credits a { color: var(--marque-fonce); text-decoration: none; }
    .dish-credits a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Revue des photos de plats (Wikimedia Commons)</h1>
      <p class="subtitle">Cochez les photos à conserver puis cliquez sur "Exporter la sélection" pour générer le fichier platPhotos.json définitif.</p>
    </div>
    <button id="exportBtn" class="btn-export">Exporter la sélection</button>
  </header>

  <div class="grid">
    ${cardsHtml}
  </div>

  <script>
    const fullData = ${fullDataJson};

    document.getElementById('exportBtn').addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-key]');
      const exported = {};

      checkboxes.forEach(cb => {
        if (cb.checked) {
          const key = cb.dataset.key;
          if (fullData[key]) {
            exported[key] = fullData[key];
          }
        }
      });

      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'platPhotos.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(reviewHtmlPath, html, 'utf-8');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

main().catch(err => {
  console.error('\x1b[31mErreur fatale :\x1b[0m', err);
  process.exit(1);
});
