// Removes duplicate products created by overlapping import runs.
// Only touches products created in the last --hours (default 12) that share an exact name
// with an older product. Keeps the oldest copy. Never deletes a product that is in an order
// or in a customer's cart.
//
//   node scripts/remove-import-duplicates.mjs            (preview)
//   node scripts/remove-import-duplicates.mjs --commit   (delete products + their Cloudinary photos)
import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const commit = process.argv.includes('--commit');
const hoursArg = process.argv.find((a) => a.startsWith('--hours='));
const hours = hoursArg ? Number(hoursArg.split('=')[1]) : 12;
const since = new Date(Date.now() - hours * 3600e3);

const publicIdFromUrl = (url) => {
  const m = String(url).match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(green-cart\/[^.]+)\.[a-z0-9]+$/i);
  return m ? m[1] : null;
};

await mongoose.connect(`${process.env.MONGODB_URI}/GreenCart`);
try {
  const all = await Product.find({}, 'name image createdAt').sort({ createdAt: 1, _id: 1 }).lean();
  const byName = new Map();
  for (const p of all) {
    if (!byName.has(p.name)) byName.set(p.name, []);
    byName.get(p.name).push(p);
  }

  // Products referenced anywhere a customer could be relying on them
  const inOrders = new Set((await Order.distinct('items.product')).map(String));
  const inCarts = new Set();
  for (const u of await User.find({}, 'cartItems').lean()) for (const id of Object.keys(u.cartItems || {})) inCarts.add(id);

  const toDelete = []; const protectedCopies = [];
  for (const [, copies] of byName) {
    if (copies.length < 2) continue;
    const [keep, ...rest] = copies; // oldest first
    for (const c of rest) {
      if (c.createdAt < since) continue; // pre-existing duplicate: leave it alone
      const id = String(c._id);
      if (inOrders.has(id) || inCarts.has(id)) { protectedCopies.push(c.name); continue; }
      // Never delete photos the kept copy also uses
      const keepImgs = new Set(keep.image);
      toDelete.push({ ...c, ownImages: c.image.filter((u) => !keepImgs.has(u)) });
    }
  }

  console.log(`Products: ${all.length} | unique names: ${byName.size}`);
  console.log(`Duplicate copies from the last ${hours}h to remove: ${toDelete.length}`);
  console.log(`Copies kept because they are in an order/cart: ${protectedCopies.length}${protectedCopies.length ? ' (' + protectedCopies.slice(0, 5).join(', ') + ')' : ''}`);
  console.log(`Photos to delete from Cloudinary: ${toDelete.reduce((a, d) => a + d.ownImages.length, 0)}`);
  toDelete.slice(0, 5).forEach((d) => console.log(`  e.g. ${d.name} (${String(d._id)})`));

  if (!commit) {
    console.log('\nPreview only. Nothing was deleted. Add --commit to remove them.');
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const ids = toDelete.map((d) => d._id);
    const res = await Product.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${res.deletedCount} duplicate products.`);

    const publicIds = toDelete.flatMap((d) => d.ownImages.map(publicIdFromUrl)).filter(Boolean);
    let removed = 0;
    for (let i = 0; i < publicIds.length; i += 100) {
      const chunk = publicIds.slice(i, i + 100);
      try {
        const r = await cloudinary.api.delete_resources(chunk);
        removed += Object.values(r.deleted || {}).filter((v) => v === 'deleted').length;
      } catch (e) {
        console.log('  Cloudinary cleanup error (products are already removed):', e.message);
      }
    }
    console.log(`Deleted ${removed} of ${publicIds.length} duplicate photos from Cloudinary.`);
    console.log(`Products now: ${await Product.countDocuments()}`);
  }
} finally {
  await mongoose.disconnect();
}
