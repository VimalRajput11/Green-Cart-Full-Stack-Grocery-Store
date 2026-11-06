// Fills ESTIMATED mrp / price / stock into product-import.csv for rows with import=yes
// that don't have prices yet. Estimates use typical Indian retail rates by product type
// and pack size. They are approximate: review them in Seller > Product List.
//
//   node scripts/estimate-prices.mjs            (preview a sample)
//   node scripts/estimate-prices.mjs --write    (fill the sheet)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(here, '../../product-import.csv');
const DEFAULT_STOCK = 20;

// --- quantity parsing --------------------------------------------------------
// Returns { kg, l, pieces } for the PAID quantity of a pack string.
export const parseQty = (raw = '') => {
  let s = raw.toLowerCase().replace(/×/g, 'x');
  s = s.replace(/\+\s*[\d.]+\s*(g|kg|ml|l)\s*free/g, '');        // "+ 90 g Free" is not paid for
  s = s.replace(/\([^)]*\)/g, (m) => (/^\(\s*\d+\s*x/.test(m) ? '' : m)); // "120 g (3 x 40 g)" -> keep the total
  let kg = 0, l = 0, pieces = 0;
  for (const part of s.split('+')) {
    const p = part.trim();
    const mult = p.match(/^(\d+)\s*x\s*/);
    const after = p.match(/[\d.]+\s*(kg|g|ml|l)\s*x\s*(\d+)/); // "500 ml x 6"
    const n = (mult ? Number(mult[1]) : 1) * (after ? Number(after[2]) : 1);
    const rest = mult ? p.slice(mult[0].length) : p;
    let m;
    if ((m = rest.match(/([\d.]+)\s*kg\b/))) kg += n * Number(m[1]);
    else if ((m = rest.match(/([\d.]+)\s*g\b/))) kg += n * Number(m[1]) / 1000;
    else if ((m = rest.match(/([\d.]+)\s*(l|ltr|litre)\b/))) l += n * Number(m[1]);
    else if ((m = rest.match(/([\d.]+)\s*ml\b/))) l += n * Number(m[1]) / 1000;
    const pc = part.match(/(\d+)\s*(pieces|piece|pcs|units|unit|sheets|wipes|bags|tablets|capsules|sachets|rolls|pairs)\b/);
    if (pc) pieces += (mult && !/\(/.test(part) ? n : 1) * Number(pc[1]);
  }
  return { kg, l, pieces };
};

// --- price table -------------------------------------------------------------
// First matching rule wins. kg/l: ₹ per kg or litre. pc: ₹ per piece. flat: ₹ per pack.
const RULES = [
  // Specific items that would otherwise match a broader word (e.g. "vegetable chopper", "nipple cream")
  [/induction|cooktop|mixer grinder|juicer|blender|toaster|sandwich maker|electric kettle|\biron\b/, { flat: 1999 }],
  [/chopper|peeler|grater|knife|spatula|ladle|tongs|strainer/, { flat: 299 }],
  [/frozen (green |sweet )?(peas|corn)|frozen (mixed )?veg/, { kg: 220 }],
  [/\bpork\b|\bham\b|bacon/, { kg: 900 }],
  [/tempeh|tempayy|tofu/, { kg: 650 }],
  [/nipple|roll on/, { kg: 12000, l: 6000 }],
  [/ear cleaner|tick|flea|pet (shampoo|wipes|spray)|grooming/, { flat: 349 }],
  [/belt|knee cap|brace|support\b|posture/, { flat: 499 }],
  [/gripe water/, { l: 300 }],
  [/inhaler|balm|rub\b/, { flat: 99 }],
  [/whey|protein powder|mass gainer/, { kg: 2400 }],
  [/peanut butter/, { kg: 600 }],
  [/fabric (conditioner|softener)|comfort fabric/, { l: 250 }],
  [/baby.*(cleanser|detergent|laundry)/, { l: 450 }],
  [/condensed milk|milkmaid/, { kg: 300 }],
  [/flavou?red milk|\bkool\b|milkshake|cold coffee|\blassi\b|buttermilk|chaas/, { l: 150 }],
  [/disinfectant|sanitizer|sanitiser|seat spray/, { flat: 199 }],
  [/greek yogurt|skyr|flavou?red yogurt/, { kg: 500 }],
  [/diya|batti|wicks|agarbatti|dhoop|camphor|kapur/, { flat: 60 }],
  [/\bpudin hara\b|drops\b/, { flat: 45 }],
  [/muesli|granola|corn ?flakes|chocos|\boats\b/, { kg: 450 }],
  [/biscuit|cookie|rusk|cracker/, { kg: 320 }],
  [/bread|pav\b|\bbun\b/, { kg: 130 }],
  [/pasta|noodles|macaroni|penne/, { kg: 260 }],
  [/(green )?cardamom|whole elaichi|elaichi whole/, { kg: 3000 }],
  [/saffron/, { kg: 200000 }],
  [/(rice|biryani|curry|chicken|meat|chole|pav bhaji|sambar|rasam|kitchen king|chaat|fried rice|noodle) masala|oregano|chilli flakes|seasoning|ajwain|mixed herbs|chutney powder/, { kg: 900 }],
  [/knorr|instant mix|gravy mix|soup/, { kg: 900 }],
  [/\bnuts\b|trail mix|\bseeds?\b|magaj/, { kg: 900 }],
  [/makhana|fox nut/, { kg: 1200 }],
  [/papad/, { kg: 400 }],
  [/mulberr|malberry|shahtoot|berries|berry\b/, { kg: 1200 }],
  [/\blemon\b/, { pc: 6 }],
  [/garlic|ginger/, { kg: 240 }],
  [/lokwan|sharbati|\bgehu\b|wheat \(whole grain\)|\bwheat$/, { kg: 45 }],
  [/(mineral|drinking|packaged|alkaline|spring) water|bisleri|kinley|aquafina/, { l: 30, pc: 25 }],
  // Electronics & home items (flat)
  [/airdopes|earbuds|earphone|headphone|neckband/, { flat: 1299 }],
  [/speaker/, { flat: 1999 }],
  [/trimmer|shaver|shaving/, { flat: 1199 }],
  [/hair dryer|dryer|straightener/, { flat: 999 }],
  [/power bank/, { flat: 1299 }],
  [/charger|adapter/, { flat: 499 }],
  [/cable|usb/, { flat: 299 }],
  [/mouse|keyboard/, { flat: 499 }],
  [/bulb|led/, { flat: 129 }],
  [/battery|batteries|cell\b/, { pc: 25, flat: 60 }],
  [/extension|plug|socket/, { flat: 399 }],
  [/bottle|flask|tumbler|sipper/, { flat: 349 }],
  [/lunch box|container|tiffin|jar set/, { flat: 399 }],
  [/candle/, { flat: 149 }],
  [/umbrella/, { flat: 399 }],
  [/notebook|register|diary/, { flat: 80 }],
  [/pen\b|pens\b|pencil|marker|highlighter/, { pc: 10, flat: 50 }],
  [/glue|tape|stapler|scissor/, { flat: 60 }],
  [/garbage|trash bag|dustbin bag/, { flat: 120 }],
  [/foil|cling|wrap/, { flat: 130 }],
  [/tissue|napkin/, { flat: 90 }],
  [/mop|broom|jhadu|scrubber|sponge|brush/, { flat: 149 }],
  [/car shampoo|car wash|car polish/, { l: 900, flat: 299 }],
  [/freshener|air care|odonil|fragrance/, { flat: 199 }],
  [/mosquito|repellent|all out|good knight/, { flat: 99 }],
  // Baby
  [/diaper|pants\b/, { pc: 12, flat: 399 }],
  [/baby wipe|wipes/, { flat: 179 }],
  [/cerelac|baby food|infant formula|lactogen|nan pro/, { kg: 1100 }],
  [/baby (oil|lotion|shampoo|wash|cream|powder|soap)/, { l: 900, kg: 900, flat: 249 }],
  [/feeding bottle|teether|bib|baby (bed|walker)/, { flat: 599 }],
  // Personal care
  [/shampoo|conditioner/, { l: 700, flat: 199 }],
  [/face ?wash|cleanser/, { l: 2000, kg: 2000, flat: 199 }],
  [/soap|bathing bar/, { pc: 40, kg: 400 }],
  [/body ?wash|shower gel/, { l: 600 }],
  [/toothpaste/, { kg: 900 }],
  [/toothbrush/, { pc: 40 }],
  [/deo|perfume|body spray/, { flat: 249 }],
  [/sanitary|pads|napkins/, { pc: 10, flat: 199 }],
  [/lotion|face cream|cold cream|body cream|hand cream|moisturi/, { l: 1500, kg: 1500, flat: 249 }],
  // Pharma
  [/syrup|tonic/, { l: 500 }],
  [/chyawanprash/, { kg: 500 }],
  [/tablet|capsule|strip|pain relief|vicks|balm|ors|electral/, { pc: 6, flat: 99 }],
  [/mask|bandage|band-aid|thermometer/, { flat: 149 }],
  [/condom|pregnancy|test kit/, { flat: 199 }],
  // Pet
  [/cat food|dog food|pedigree|whiskas|drools|meo\b/, { kg: 400 }],
  [/wet food|(cat|dog|kitten|puppy).*(gravy|pouch)|(gravy|pouch).*(cat|dog|kitten|puppy)/, { kg: 650 }],
  [/\bpet\b|collar|leash|litter|chew/, { kg: 150, l: 1500, flat: 299 }],
  // Cleaning
  [/detergent powder|washing powder|surf excel easy|wheel|ghadi|tide/, { kg: 140 }],
  [/liquid detergent|matic liquid|detergent liquid/, { l: 260 }],
  [/dishwash|vim|pril|dish wash/, { l: 230, kg: 160, pc: 30 }],
  [/floor cleaner|lizol|surface cleaner/, { l: 200 }],
  [/toilet cleaner|harpic|bathroom cleaner/, { l: 220 }],
  [/glass cleaner|colin/, { l: 220 }],
  [/fabric (conditioner|softener)|comfort/, { l: 250 }],
  [/whitener|ujala|bleach|phenyl/, { l: 150 }],
  [/detergent bar|washing bar/, { pc: 30, kg: 150 }],
  // Snacks & sweets
  [/chocolate|dairy milk|kitkat|5 star|munch|perk|silk|bournville|ferrero/, { kg: 1100 }],
  [/ice cream|kulfi|cone|frozen dessert/, { l: 320, kg: 320, pc: 40 }],
  [/candy|toffee|lollipop|gum|mints/, { kg: 700, pc: 2 }],
  [/rasgulla|gulab jamun|soan papdi|mithai|laddu|barfi|sweet/, { kg: 350 }],
  [/biscuit|cookie|cracker|rusk|wafer|marie|oreo|bourbon|digestive/, { kg: 320 }],
  [/popcorn/, { kg: 500 }],
  [/chips|crisps|nachos|wafers|lays|kurkure|bingo|pringles/, { kg: 420 }],
  [/bhujia|namkeen|mixture|sev\b|chivda|mathri|khakhra|peanuts|makhana|bhel|chakli/, { kg: 340 }],
  [/peanut butter/, { kg: 520 }],
  [/\bjam\b|spread/, { kg: 360 }],
  [/honey/, { kg: 600 }],
  // Drinks
  [/energy drink|red bull|monster|sting/, { l: 400 }],
  [/coconut water/, { l: 220 }],
  [/water\b|mineral/, { l: 20 }],
  [/juice|nectar|real |tropicana|paper boat|frooti|maaza|slice/, { l: 130 }],
  [/soda|tonic water/, { l: 80 }],
  [/\b(cola|coke|coca|pepsi|sprite|fanta|thums|7up|mirinda|limca)\b|mountain dew|soft drink/, { l: 75 }],
  // Tea, coffee
  [/green tea|herbal tea|tea bag/, { kg: 1800, pc: 5 }],
  [/instant coffee|nescafe|bru|coffee/, { kg: 2400 }],
  [/tea|chai/, { kg: 520 }],
  [/horlicks|bournvita|boost|complan|health drink|protinex/, { kg: 520 }],
  // Dairy, bread, eggs
  [/\beggs?\b(?!.*(pasta|noodle))/, { pc: 7.5 }],
  [/ghee/, { kg: 650, l: 650 }],
  [/paneer/, { kg: 440 }],
  [/milk powder|dairy whitener/, { kg: 480 }],
  [/\bmilk\b/, { l: 66 }],
  [/butter\b/, { kg: 560 }],
  [/cheese/, { kg: 750 }],
  [/cream\b/, { kg: 280, l: 280 }],
  [/greek yogurt|skyr/, { kg: 450 }],
  [/curd|dahi|yogurt|yoghurt|raita/, { kg: 140 }],
  [/bread|pav|bun\b/, { kg: 130 }],
  [/croissant|muffin|cake|brownie/, { kg: 550, pc: 40 }],
  [/oats|muesli|granola|cornflakes|corn flakes|chocos|cereal/, { kg: 380 }],
  // Breakfast & instant
  [/noodles|maggi|yippee|pasta|macaroni|vermicelli/, { kg: 260 }],
  [/soup/, { kg: 900 }],
  [/poha|daliya|upma|idli|dosa|mix\b/, { kg: 260 }],
  // Staples
  [/basmati/, { kg: 160 }],
  [/rice/, { kg: 90 }],
  [/atta|wheat flour/, { kg: 56 }],
  [/millet|ragi|jowar|bajra|sattu|thalipeeth/, { kg: 150 }],
  [/besan|gram flour/, { kg: 120 }],
  [/sooji|rava|maida/, { kg: 60 }],
  [/dal|lentil|moong|masoor|toor|urad|chana|rajma|chole/, { kg: 170 }],
  [/sugar|jaggery|gud/, { kg: 60 }],
  [/\bsalt\b/, { kg: 30 }],
  [/oil\b/, { l: 190, kg: 190 }],
  [/almond|cashew|kaju|pista|walnut|raisin|kishmish|dry fruit|dates/, { kg: 1100 }],
  [/masala|powder|chilli|haldi|turmeric|jeera|cumin|coriander|garam|hing|spice/, { kg: 650 }],
  [/pickle|achar/, { kg: 320 }],
  [/ketchup|sauce/, { kg: 170, l: 170 }],
  [/mayonnaise|mayo|dip/, { kg: 380 }],
  [/vinegar/, { l: 120 }],
  // Meat & frozen
  [/sausage|salami|nugget|kebab|momos|frozen/, { kg: 650 }],
  [/chicken|mutton|fish|prawn|meat/, { kg: 480 }],
  // Paan corner
  [/mukhwas|mouth freshener|saunf|supari|paan/, { kg: 450 }],
  [/lighter|matchbox|ashtray|rolling paper|filter/, { flat: 60 }],
  // Fruits & vegetables
  [/combo/, { flat: 249 }],
  [/flower|leaves|betel/, { flat: 49 }],
  [/spinach|methi|coriander|mint|leafy|lettuce|microgreen|basil/, { kg: 220 }],
  [/apple|kiwi|avocado|blueberr|strawberr|dragon|exotic/, { kg: 280, pc: 40 }],
  [/banana/, { pc: 6, kg: 70 }],
  [/mango|orange|grape|pomegranate|papaya|guava|pear|watermelon|melon|pineapple|fruit/, { kg: 140, pc: 30 }],
  [/organic/, { kg: 140 }],
  [/onion|potato|tomato|carrot|cabbage|beetroot|ginger|garlic|lemon|chilli|capsicum|cucumber|vegetable|beans|peas|cauliflower|brinjal|okra|bhindi|gourd/, { kg: 70, pc: 8 }],
];

// Fallbacks when no rule matches
const CATEGORY_RATE = {
  'Atta, Rice & Dal': { kg: 100 }, 'Baby Care': { flat: 299, kg: 700 }, 'Bakery & Biscuits': { kg: 320 },
  'Breakfast & Instant Food': { kg: 300 }, 'Chicken, Meat & Fish': { kg: 500 }, 'Cleaning Essentials': { kg: 180, l: 220, flat: 149 },
  'Cold Drinks & Juices': { l: 110 }, 'Dairy, Bread & Eggs': { kg: 250, l: 90 }, 'Fruits & Vegetables': { kg: 90, pc: 20 },
  'Home & Office': { flat: 249 }, 'Masala, Oil & More': { kg: 400, l: 190 }, 'Organic & Healthy Living': { kg: 700 },
  'paan corner': { kg: 450, flat: 79 }, 'Personal Care': { flat: 199 }, 'Pet Care': { kg: 400, flat: 299 },
  'Pharma & Wellness': { flat: 199, l: 500, kg: 1500 }, 'Sauces & Spreads': { kg: 300, l: 200 }, 'Snacks & Munchies': { kg: 380 },
  'Sweet Tooth': { kg: 700 }, 'Tea, Coffe & Health Drink': { kg: 600, l: 160 },
};

const niceMrp = (v) => {
  if (v < 10) return Math.max(5, Math.round(v));
  if (v < 50) return Math.round(v);
  if (v < 200) return Math.round(v / 5) * 5;
  if (v < 1000) return Math.round(v / 10) * 10 - 1 + 1; // multiples of 10
  return Math.round(v / 50) * 50 - 1;                   // e.g. 1299
};

// Deterministic 5–20% discount per product so re-runs give the same numbers
const discountFor = (name) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return [0.05, 0.08, 0.1, 0.12, 0.15, 0.18, 0.2][h % 7];
};

export const estimate = ({ name, category, weight }) => {
  const text = `${name} ${weight}`.toLowerCase();
  const rule = (RULES.find(([re]) => re.test(text)) || [null, CATEGORY_RATE[category] || { flat: 149 }])[1];
  const q = parseQty(weight);
  let mrp;
  if (rule.flat && !q.kg && !q.l && !(rule.pc && q.pieces)) mrp = rule.flat;
  else if (rule.kg && q.kg) mrp = rule.kg * q.kg;
  else if (rule.l && q.l) mrp = rule.l * q.l;
  else if (rule.kg && q.l) mrp = rule.kg * q.l;   // liquids sold by "kg" rate (e.g. ghee 1 l)
  else if (rule.l && q.kg) mrp = rule.l * q.kg;
  else if (rule.pc && q.pieces) mrp = rule.pc * q.pieces;
  else if (rule.pc) mrp = rule.pc * 6;
  else mrp = rule.flat || (CATEGORY_RATE[category]?.flat) || 149;

  // Small packs still have a floor price, and per-unit rates soften for big packs
  if (q.kg > 2 || q.l > 2) mrp *= 0.9;
  mrp = Math.max(mrp, 10);
  const finalMrp = niceMrp(mrp);
  const price = Math.max(1, Math.round(finalMrp * (1 - discountFor(name))));
  return { mrp: finalMrp, price };
};

// --- CSV (same format as import-products.mjs) --------------------------------
const COLUMNS = ['import', 'name', 'category', 'weight', 'mrp', 'price', 'stock', 'possible_duplicate', 'images', 'folder', 'description'];
const toCsv = (rows) => [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => {
  const v = String(r[c] ?? '');
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}).join(','))].join('\r\n');
const fromCsv = (text) => {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const [header, ...data] = rows.filter((r) => r.some((c) => c.trim()));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const rows = fromCsv(fs.readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, ''));
  let filled = 0;
  for (const r of rows) {
    if ((r.import || '').toLowerCase() !== 'yes' || (r.mrp && r.price)) continue;
    const { mrp, price } = estimate(r);
    r.mrp = String(mrp); r.price = String(price);
    if (!r.stock) r.stock = String(DEFAULT_STOCK);
    filled++;
  }
  if (process.argv.includes('--write')) {
    fs.writeFileSync(CSV_PATH, '﻿' + toCsv(rows), 'utf8');
    console.log(`Filled estimated prices for ${filled} rows in ${CSV_PATH}`);
  } else {
    console.log(`Would fill ${filled} rows. Sample:`);
    const step = Math.max(1, Math.floor(rows.length / 60));
    rows.filter((_, i) => i % step === 0).forEach((r) => console.log(`  ${r.category.padEnd(26)} ${r.name.slice(0, 48).padEnd(48)} ${r.weight.padEnd(22)} MRP ${r.mrp} → ${r.price}`));
    console.log('\nPreview only. Run with --write to fill the sheet.');
  }
}
