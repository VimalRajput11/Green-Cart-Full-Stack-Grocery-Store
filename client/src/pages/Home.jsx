import React, { useMemo } from 'react'
import MainBanner from '../components/MainBanner'
import Categories from '../components/Categories'
import ProductSlider from '../components/ProductSlider'
import Contact from '../components/Contact'
import NewsLetter from '../components/NewsLetter'
import { useAppContext } from '../context/AppContext'
import { DELIVERY_ETA } from '../utils/orderStatus'

const PROMISES = [
  { title: `Delivery in ${DELIVERY_ETA}`, text: 'From our store to your door, fast.' },
  { title: 'Best prices & offers', text: 'Lower prices than your local market.' },
  { title: 'Wide assortment', text: 'Everything from atta to ice cream.' },
  { title: 'Safe & contactless', text: 'OTP-verified delivery for every order.' },
];

const Home = () => {
  const { products, categories } = useAppContext();

  // One shelf per category that has products in stock, in category order
  const shelves = useMemo(() => {
    const inStock = products.filter((p) => p.stock > 0 || (p.stock === undefined && p.inStock));
    const byCat = new Map();
    for (const p of inStock) {
      const key = p.category;
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key).push(p);
    }
    const order = (categories || []).map((c) => c.name);
    return [...byCat.entries()]
      .sort((a, b) => {
        const ia = order.indexOf(a[0]); const ib = order.indexOf(b[0]);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
      .slice(0, 8);
  }, [products, categories]);

  const deals = useMemo(
    () => products
      .filter((p) => p.stock > 0 && p.price > p.offerPrice)
      .sort((a, b) => (b.price - b.offerPrice) / b.price - (a.price - a.offerPrice) / a.price)
      .slice(0, 12),
    [products]
  );

  return (
    <div className="flex flex-col gap-10 pb-10">
      <MainBanner />
      <Categories />

      {deals.length > 0 && <ProductSlider title="Top deals" categoryName="" products={deals} />}
      {shelves.map(([cat, items]) => (
        <ProductSlider key={cat} title={cat} categoryName={cat} products={items} />
      ))}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PROMISES.map((p) => (
          <div key={p.title} className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="font-bold text-gray-900 text-sm">{p.title}</p>
            <p className="text-xs text-gray-500 mt-1">{p.text}</p>
          </div>
        ))}
      </section>

      <Contact />
      <NewsLetter />
    </div>
  )
}

export default Home
