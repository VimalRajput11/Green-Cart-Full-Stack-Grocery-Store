// Reads the local product folder: <category>/<sub-category>/<product name>/{images, product details.rtf}
import fs from 'fs';
import path from 'path';

// Folder names that differ from the store's category names
export const CATEGORY_MAP = {
  'Breakast & Instant Food': 'Breakfast & Instant Food',
  'pan corner': 'paan corner',
  'Tea, Coffee & Health Drink': 'Tea, Coffe & Health Drink',
};

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

// Text that must never appear in our store (copied from another retailer)
const BLOCKED = /blinkit|grofers|zomato|customer care|return policy|non-returnable|fssai|udyam|disclaimer|seller name|marketed by|manufacturer/i;

// Minimal RTF -> plain text (enough for the WordPad files in this folder)
export const rtfToText = (rtf) => {
  let s = rtf.replace(/\r\n?/g, '\n');
  s = s.replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(n < 0 ? 65536 + Number(n) : Number(n)));
  s = s.replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  s = s.replace(/\{\\\*[^{}]*\}/g, '');          // ignorable destinations
  s = s.replace(/\{\\fonttbl[\s\S]*?\}\}/g, '');  // font table
  s = s.replace(/\\par[d]?\b ?/g, '\n');
  s = s.replace(/\\\n/g, '\n');                  // "\" + newline is a line break in WordPad output
  s = s.replace(/\\[a-z]+-?\d* ?/gi, '');        // control words
  s = s.replace(/[{}]/g, '');
  return s.split('\n').map((l) => l.replace(/\\/g, '').trim());
};

// Every section heading used in these files (values like "India" or "5 kg" are not headings)
const HEADINGS = new Set([
  'Product Details', 'Customer Care Details', 'Unit', 'Disclaimer', 'Country Of Origin', 'Return Policy', 'Seller',
  'Shelf Life', 'Type', 'Manufacturer Details', 'Key Features', 'Seller FSSAI', 'FSSAI License', 'Description',
  'Marketed By', 'Expiry Date', 'Packaging Type', 'Ingredients', 'Flavour', 'Nutrition Information', 'Storage Tips',
  'Colour', 'Material', 'Offer', 'Size', 'Box Contents', 'Pack Size', 'Usage', 'Model', 'Fragrance', 'Age Group',
  'Nutrient Value & Benefits', 'Speciality', 'Food Type', 'Storage Temperature (DegC)', 'Brand Warranty',
  'Service Centre Details', 'Wattage', 'Capacity', 'Power Source', 'Fabric Composition', 'Gender', 'Dimensions',
  'Voltage', 'Weight', 'Quantity', 'Variant', 'Benefits', 'How to Use', 'Contents', 'Importer Details', 'Warranty',
  'Skin Type', 'Hair Type', 'Concern', 'Formulation', 'Key Ingredients', 'Directions For Use', 'Safety Information',
  'Dietary Preference', 'Allergen Information', 'Breed', 'Life Stage', 'Number Of Pieces', 'Product Type',
]);

// Turn "Heading / blank / value lines" into { Heading: [values] }
export const parseSections = (lines) => {
  const out = {};
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const nextBlank = i + 1 < lines.length && lines[i + 1] === '';
    if (HEADINGS.has(line) && (nextBlank || line === 'Product Details')) {
      current = line;
      out[current] = out[current] || [];
    } else if (current) {
      out[current].push(line);
    }
  }
  return out;
};

const titleCase = (s) => s.replace(/\s+/g, ' ').trim();

export const readProductFolder = (root) => {
  const products = [];
  for (const cat of fs.readdirSync(root)) {
    const catDir = path.join(root, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const sub of fs.readdirSync(catDir)) {
      const subDir = path.join(catDir, sub);
      if (!fs.statSync(subDir).isDirectory()) continue;
      for (const name of fs.readdirSync(subDir)) {
        const dir = path.join(subDir, name);
        if (!fs.statSync(dir).isDirectory()) continue;
        const files = fs.readdirSync(dir);
        // Main image (named after the product) first, then the rest
        const images = files.filter((f) => IMAGE_EXT.test(f) && fs.statSync(path.join(dir, f)).size > 0)
          .sort((a, b) => Number(b.startsWith(name)) - Number(a.startsWith(name)) || a.localeCompare(b))
          .map((f) => path.join(dir, f));

        let sections = {};
        const rtf = files.find((f) => /\.rtf$/i.test(f));
        if (rtf) sections = parseSections(rtfToText(fs.readFileSync(path.join(dir, rtf), 'latin1')));

        const weight = (sections.Unit || sections.Weight || sections['Pack Size'] || sections.Quantity || [])[0] || '';
        const points = [];
        for (const key of ['Key Features', 'Description', 'Nutrient Value & Benefits', 'Benefits', 'Type', 'Shelf Life', 'Country Of Origin']) {
          if (!sections[key]) continue;
          const vals = sections[key].filter((v) => !BLOCKED.test(v));
          if (['Key Features', 'Description', 'Nutrient Value & Benefits', 'Benefits'].includes(key)) points.push(...vals);
          else if (vals[0]) points.push(`${key}: ${vals[0]}`);
        }
        const description = [...new Set(points.map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p && p.length < 300))].slice(0, 6);

        products.push({
          folder: path.relative(root, dir),
          name: titleCase(name),
          category: CATEGORY_MAP[cat] || cat,
          subCategory: sub,
          weight: weight.length < 40 ? weight : '',
          description: description.length ? description : [titleCase(name)],
          images,
          allSections: Object.keys(sections),
        });
      }
    }
  }
  return products;
};
