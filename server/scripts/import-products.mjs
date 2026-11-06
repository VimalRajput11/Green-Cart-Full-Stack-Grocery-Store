// Bulk product import from the local product folder.
//
//   1) Export a sheet of products not yet in the store:
//        node scripts/import-products.mjs export
//      -> writes product-import.csv in the project root. Fill in mrp, price, stock.
//
//   2) Preview what would be imported (nothing is uploaded or saved):
//        node scripts/import-products.mjs import
//
//   3) Import for real (uploads images to Cloudinary, creates products).
//      Tip: try a few first with --limit=5
//        node scripts/import-products.mjs import --commit
//
// Re-running is safe: products whose name already exists are skipped.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import stringSimilarity from 'string-similarity';
import Product from '../models/Product.js';
import { readProductFolder } from './productFolder.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const PRODUCT_DIR = path.join(ROOT, 'product');
const CSV_PATH = path.join(ROOT, 'product-import.csv');
const MAX_IMAGES = 4; // same as the seller "Add Product" page
const COLUMNS = ['import', 'name', 'category', 'weight', 'mrp', 'price', 'stock', 'possible_duplicate', 'images', 'folder', 'description'];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// --- tiny CSV helpers (handles quotes, commas and newlines in fields) ---
const toCsv = (rows) => [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => {
  const v = String(r[c] ?? '');
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}).join(','))].join('\r\n');

const fromCsv = (text) => {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const [header, ...data] = rows.filter((r) => r.some((c) => c.trim()));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
};

const connect = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in server/.env');
  await mongoose.connect(`${process.env.MONGODB_URI}/GreenCart`);
};

// ---------------------------------------------------------------------------

const exportSheet = async () => {
  await connect();
  const existing = await Product.find({}, 'name').lean();
  const existingNorm = existing.map((p) => norm(p.name));
  const items = readProductFolder(PRODUCT_DIR).filter((p) => p.images.length > 0);

  const rows = [];
  let skippedExact = 0;
  for (const p of items) {
    const n = norm(p.name);
    if (existingNorm.includes(n)) { skippedExact++; continue; }
    let dup = '';
    if (existingNorm.length) {
      const best = stringSimilarity.findBestMatch(n, existingNorm).bestMatch;
      if (best.rating >= 0.6) dup = `${existing[existingNorm.indexOf(best.target)].name} (${Math.round(best.rating * 100)}%)`;
    }
    rows.push({
      import: dup && parseInt(dup.match(/(\d+)%/)[1], 10) >= 85 ? 'no' : 'yes',
      name: p.name, category: p.category, weight: p.weight,
      mrp: '', price: '', stock: '',
      possible_duplicate: dup,
      images: Math.min(p.images.length, MAX_IMAGES),
      folder: p.folder,
      description: p.description.join(' | '),
    });
  }
  rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  fs.writeFileSync(CSV_PATH, '﻿' + toCsv(rows), 'utf8'); // BOM so Excel shows ₹/accents correctly

  console.log(`Found ${items.length} products with photos in /product`);
  console.log(`Already in store (same name): ${skippedExact}`);
  console.log(`Written to sheet: ${rows.length}  (${rows.filter((r) => r.possible_duplicate).length} flagged as possible duplicates)`);
  console.log(`\nSheet: ${CSV_PATH}`);
  console.log('Fill in mrp, price and stock. Set import=no for anything you do not want. Then run:');
  console.log('  node scripts/import-products.mjs import            (preview)');
  console.log('  node scripts/import-products.mjs import --commit   (upload & create)');
};

const uploadImage = (file) =>
  cloudinary.uploader.upload(file, {
    folder: 'green-cart',
    resource_type: 'image',
    // Store a web-sized copy, like the seller page does before uploading
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto', fetch_format: 'webp' }],
  }).then((r) => r.secure_url);

const importSheet = async (commit) => {
  if (!fs.existsSync(CSV_PATH)) throw new Error(`No sheet found. Run "export" first.`);
  const rows = fromCsv(fs.readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, ''));
  const folderItems = new Map(readProductFolder(PRODUCT_DIR).map((p) => [p.folder, p]));

  await connect();
  const existing = new Set((await Product.find({}, 'name').lean()).map((p) => norm(p.name)));

  const ready = []; const problems = [];
  for (const [i, r] of rows.entries()) {
    if ((r.import || '').toLowerCase() !== 'yes') continue;
    const line = i + 2;
    const mrp = Number(r.mrp); const price = Number(r.price); const stock = r.stock === '' ? 0 : Number(r.stock);
    const item = folderItems.get(r.folder);
    if (!item) { problems.push(`row ${line} "${r.name}": folder not found`); continue; }
    if (!item.images.length) { problems.push(`row ${line} "${r.name}": no usable photos`); continue; }
    if (!r.mrp || !r.price) { problems.push(`row ${line} "${r.name}": mrp/price missing`); continue; }
    if (!(mrp > 0) || !(price >= 0) || price > mrp) { problems.push(`row ${line} "${r.name}": invalid prices (mrp ${r.mrp}, price ${r.price})`); continue; }
    if (!Number.isInteger(stock) || stock < 0) { problems.push(`row ${line} "${r.name}": invalid stock "${r.stock}"`); continue; }
    if (existing.has(norm(r.name))) continue; // already imported
    ready.push({ r, item, mrp, price, stock });
  }

  console.log(`Rows marked import=yes and valid: ${ready.length}`);
  if (problems.length) {
    console.log(`Skipped ${problems.length} row(s):`);
    problems.slice(0, 25).forEach((p) => console.log('  -', p));
    if (problems.length > 25) console.log(`  … and ${problems.length - 25} more`);
  }
  if (!commit) {
    ready.slice(0, 10).forEach(({ r, mrp, price, stock }) => console.log(`  would add: ${r.name} | ${r.category} | MRP ${mrp} → ${price} | stock ${stock}`));
    console.log('\nPreview only. Nothing was uploaded or saved. Add --commit to import.');
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const batch = limitArg ? ready.slice(0, Number(limitArg.split('=')[1]) || ready.length) : ready;
  if (batch.length < ready.length) console.log(`Importing first ${batch.length} of ${ready.length} (--limit)`);

  // Skip repeated names inside the sheet itself
  const seen = new Set();
  const queue = batch.filter(({ r }) => !seen.has(norm(r.name)) && seen.add(norm(r.name)));

  let done = 0; let failed = 0;
  const CONCURRENCY = 3; // products in flight at once; each uploads its photos in parallel
  const worker = async () => {
    while (queue.length) {
      const { r, item, mrp, price, stock } = queue.shift();
      await importOne(r, item, mrp, price, stock);
    }
  };
  const importOne = async (r, item, mrp, price, stock) => {
    try {
      const image = await Promise.all(item.images.slice(0, MAX_IMAGES).map(uploadImage));
      await Product.create({
        name: r.name,
        description: (r.description || item.description.join(' | ')).split(' | ').filter(Boolean),
        price: mrp,
        offerPrice: price,
        image,
        category: r.category,
        weight: r.weight || item.weight || '',
        stock,
        inStock: stock > 0,
      });
      existing.add(norm(r.name));
      done++;
      console.log(`[${done}/${batch.length}] added ${r.name} (${image.length} images)`);
    } catch (error) {
      failed++;
      console.log(`  FAILED ${r.name}: ${error.message}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDone. Added ${done}, failed ${failed}. Re-run the same command to retry failures.`);
};

const [mode] = process.argv.slice(2);
try {
  if (mode === 'export') await exportSheet();
  else if (mode === 'import') await importSheet(process.argv.includes('--commit'));
  else console.log('Usage: node scripts/import-products.mjs export | import [--commit]');
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
