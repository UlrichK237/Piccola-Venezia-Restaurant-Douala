#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. User-Agent avec repli sur GitHub si CONTACT_EMAIL n'est pas défini
const contact =
  process.env.CONTACT_EMAIL && process.env.CONTACT_EMAIL.trim()
    ? `mailto:${process.env.CONTACT_EMAIL.trim()}`
    : 'https://github.com/UlrichK237/Piccola-Venezia-Restaurant-Douala';

const userAgent = `PiccolaVeneziaDemo/1.0 (${contact})`;

// Analyse des arguments
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const onlyIndex = args.indexOf('--only');
const onlyArg = onlyIndex !== -1 && args[onlyIndex + 1] ? args[onlyIndex + 1].trim().toLowerCase() : null;

// Chemins
const queriesPath = path.join(rootDir, 'src', 'data', 'photoQueries.json');
const platPhotosPath = path.join(rootDir, 'src', 'data', 'platPhotos.json');
const photosDir = path.join(rootDir, 'public', 'photos', 'plats');
const outDir = path.join(rootDir, 'scripts', 'out');
const reviewHtmlPath = path.join(outDir, 'photos-review.html');

fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(queriesPath)) {
  console.error(`Fichier introuvable : ${queriesPath}`);
  process.exit(1);
}
const photoQueries = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));

// Chargement des photos existantes et mise à jour du champ niveau pour les entrées existantes
let platPhotos = {};
if (fs.existsSync(platPhotosPath)) {
  try {
    platPhotos = JSON.parse(fs.readFileSync(platPhotosPath, 'utf-8'));
    for (const [key, item] of Object.entries(platPhotos)) {
      if (!item.niveau && photoQueries[key]?.niveau) {
        item.niveau = photoQueries[key].niveau;
      }
    }
  } catch (e) {
    platPhotos = {};
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function isValidLicense(license) {
  if (!license) return false;
  const s = String(license).trim();
  if (/NC|ND/i.test(s)) return false;
  if (/^(CC0|Public[ _-]domain|PD|CC[ _-]BY|CC[ _-]BY[ _-]SA)/i.test(s)) {
    return true;
  }
  return false;
}

// Mots interdits dans le titre du fichier (logo, façade, intérieur, etc.)
const FORBIDDEN_TITLE_REGEX = /(logo|menu|facade|façade|interior|map|diagram|flag|painting|grainproducts|preparation_amatriciana|making_of|campagne_cosb|scallop_shell|scallop_specimen|kokkikartano|full_breakfast)/i;

function isValidCandidate(info, page, motsCles) {
  if (info.mime !== 'image/jpeg') return false;
  if (!info.width || info.width < 800) return false;
  if (!info.thumburl) return false;

  const title = page.title || '';
  if (FORBIDDEN_TITLE_REGEX.test(title)) return false;

  const extmeta = info.extmetadata || {};
  const license = extmeta.LicenseShortName?.value || '';
  if (!isValidLicense(license)) return false;

  const titleLower = title.toLowerCase();
  const desc = stripHtml(extmeta.ImageDescription?.value || '').toLowerCase();
  const objName = (extmeta.ObjectName?.value || '').toLowerCase();
  const fullText = `${titleLower} ${desc} ${objName}`;

  const hasKeyword = motsCles.some(kw => fullText.includes(kw.toLowerCase()));
  if (!hasKeyword) return false;

  return true;
}

// Requête fetch avec gestion des erreurs 429 et 503 (Retry-After)
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 503) {
      if (attempt === maxRetries) return res;
      const retryAfter = res.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) || 5 : 5;
      console.warn(`  [HTTP ${res.status}] Attente de ${waitSeconds}s avant réessai (${attempt + 1}/${maxRetries})...`);
      await sleep(waitSeconds * 1000);
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

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

  const res = await fetchWithRetry(url.toString(), {
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

async function downloadFile(url, destPath) {
  const res = await fetchWithRetry(url, {
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

async function main() {
  console.log('\x1b[32m%s\x1b[0m', '=== Script de téléchargement Wikimedia Commons - Piccola Venezia ===');
  console.log(`User-Agent : ${userAgent}`);
  if (isForce) console.log('Option --force activée : remplacement forcé.');
  if (onlyArg) console.log(`Option --only activée pour : "${onlyArg}"`);

  let downloadedCount = 0;
  const missingPhotos = [];

  const entries = Object.entries(photoQueries);

  for (const [key, data] of entries) {
    const [categorie, nom] = key.split('::');

    // Filtre --only : recherche dans nom, clé ou catégorie
    if (onlyArg) {
      const matchNom = nom.toLowerCase().includes(onlyArg);
      const matchKey = key.toLowerCase().includes(onlyArg);
      const matchCat = categorie.toLowerCase().includes(onlyArg);
      if (!matchNom && !matchKey && !matchCat) {
        continue;
      }
    }

    const slug = slugify(nom);
    const fileName = `${slug}.jpg`;
    const destPath = path.join(photosDir, fileName);
    const publicUrl = `/photos/plats/${fileName}`;

    // Si la photo existe déjà sur le disque et dans platPhotos.json et que --force n'est pas demandé
    if (fs.existsSync(destPath) && !isForce && platPhotos[key]) {
      // S'assurer que le champ niveau est bien renseigné
      if (!platPhotos[key].niveau) {
        platPhotos[key].niveau = data.niveau || 'exact';
      }
      console.log(`[Déjà présent] ${nom} (${platPhotos[key].niveau}) -> ${fileName}`);
      continue;
    }

    console.log(`\nRecherche pour : \x1b[33m${nom}\x1b[0m (${categorie}) [niveau: ${data.niveau}]`);
    let found = null;
    let successfulQuery = null;
    let finalNiveau = data.niveau;

    // 1. Essai des requêtes configurées
    for (const requete of data.requetes) {
      await sleep(600);
      try {
        const candidate = await searchWikimedia(requete, data.mots_cles);
        if (candidate) {
          found = candidate;
          successfulQuery = requete;
          console.log(`  ✓ Trouvé avec requête : "${requete}" (${candidate.page.title})`);
          break;
        } else {
          console.log(`  - Aucun résultat pour : "${requete}"`);
        }
      } catch (err) {
        console.error(`  ✗ Erreur recherche ("${requete}") :`, err.message);
      }
    }

    // 2. Si plat "exact" et rien trouvé : tentative de repli en "approchant"
    if (!found && data.niveau === 'exact') {
      const fallbackQuery = nom
        .replace(/[/,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`  Tentative de repli en "approchant" avec : "${fallbackQuery}"...`);
      await sleep(600);
      try {
        const candidate = await searchWikimedia(fallbackQuery, data.mots_cles);
        if (candidate) {
          found = candidate;
          successfulQuery = fallbackQuery;
          finalNiveau = 'approchant';
          console.log(`  ✓ Trouvé en repli approchant : "${fallbackQuery}" (${candidate.page.title})`);
        }
      } catch (err) {
        console.error(`  ✗ Erreur repli ("${fallbackQuery}") :`, err.message);
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
          niveau: finalNiveau,
        };

        downloadedCount++;
        console.log(`  \x1b[32m✔ Enregistré dans ${fileName} [${finalNiveau}]\x1b[0m`);
      } catch (err) {
        console.error(`  ✗ Échec téléchargement pour ${nom} :`, err.message);
        missingPhotos.push(`${key} (erreur téléchargement)`);
      }
    } else {
      console.log(`  \x1b[31m✗ Aucune photo trouvée pour ${nom}\x1b[0m`);
      missingPhotos.push(key);
    }
  }

  // Sauvegarde systématique de platPhotos.json
  fs.writeFileSync(platPhotosPath, JSON.stringify(platPhotos, null, 2) + '\n', 'utf-8');
  console.log(`\n\x1b[32m✔ Fichier mis à jour : ${platPhotosPath}\x1b[0m`);

  // Génération de la page de revue
  generateReviewHtml(platPhotos, photoQueries);

  // Résumé
  console.log('\n========================================');
  console.log(`Nouvelles photos téléchargées : ${downloadedCount}`);
  console.log(`Total des plats avec photo dans platPhotos.json : ${Object.keys(platPhotos).length} / ${entries.length}`);
  if (missingPhotos.length > 0) {
    console.log(`Plats sans photo (${missingPhotos.length}) :`);
    missingPhotos.forEach(p => console.log(`  - ${p}`));
  } else {
    console.log('\x1b[32m✔ Tous les 69 plats ont désormais une photo locale !\x1b[0m');
  }
  console.log(`Page de revue disponible : ${reviewHtmlPath}`);
  console.log('========================================\n');
}

function generateReviewHtml(platPhotos, photoQueries) {
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
      const niveauBadge =
        item.niveau === 'approchant'
          ? '<span class="badge-approchant">Approchant</span>'
          : '<span class="badge-exact">Exact</span>';

      return `
      <div class="card" data-key="${escapeHtml(key)}">
        <div class="card-img-wrap">
          <img src="${escapeHtml(relPhotoPath)}" alt="${escapeHtml(nom)}" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-header">
            <span class="category-badge">${escapeHtml(categorie)}</span>
            ${niveauBadge}
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
      gap: 8px;
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
    .badge-exact {
      font-size: 10px;
      background: #E8F5E9;
      color: #2E7D32;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge-approchant {
      font-size: 10px;
      background: #FFF3E0;
      color: #E65100;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .keep-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-left: auto;
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
