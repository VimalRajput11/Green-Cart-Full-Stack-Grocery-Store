import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { assets } from '../assets/assets';
import { optimizeImg } from '../utils/image';

const SORTS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'discount', label: 'Biggest discount' },
  { key: 'name', label: 'Name (A–Z)' },
];

const SECTION_PREVIEW = 10;

const isAvailable = (p) => p.stock > 0 && p.offerPrice >= 0;
const discountOf = (p) => (p.price > 0 && p.offerPrice >= 0 ? (p.price - p.offerPrice) / p.price : 0);

const sortProducts = (list, sort) => {
  const arr = list.slice();
  switch (sort) {
    case 'price-asc': arr.sort((a, b) => a.offerPrice - b.offerPrice); break;
    case 'price-desc': arr.sort((a, b) => b.offerPrice - a.offerPrice); break;
    case 'discount': arr.sort((a, b) => discountOf(b) - discountOf(a)); break;
    case 'name': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break;
  }
  // Available items first, sold-out items last
  return arr.sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)));
};

const ProductGrid = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
    {items.map((p) => <ProductCard key={p._id} product={p} />)}
  </div>
);

const AllProducts = () => {
  const { products, searchQuery, setSearchQuery, categories } = useAppContext();
  const [active, setActive] = useState('All');
  const [sort, setSort] = useState('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);
  const topRef = useRef(null);

  const query = (searchQuery || '').trim().toLowerCase();

  // Categories that actually have products, in the store's category order
  const cats = useMemo(() => {
    const counts = products.reduce((m, p) => m.set(p.category, (m.get(p.category) || 0) + 1), new Map());
    const known = (categories || []).filter((c) => counts.has(c.name)).map((c) => ({ name: c.name, image: c.image, count: counts.get(c.name) }));
    const extra = [...counts.keys()].filter((n) => !known.some((k) => k.name === n)).map((n) => ({ name: n, image: '', count: counts.get(n) }));
    return [...known, ...extra];
  }, [products, categories]);

  const filtered = useMemo(() => {
    let list = products;
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    if (active !== 'All') list = list.filter((p) => p.category === active);
    if (inStockOnly) list = list.filter(isAvailable);
    return sortProducts(list, sort);
  }, [products, query, active, inStockOnly, sort]);

  // Searching always searches everything
  useEffect(() => { if (query) setActive('All'); }, [query]);

  const choose = (name) => {
    setActive(name);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showSections = active === 'All' && !query;
  const sections = useMemo(() => {
    if (!showSections) return [];
    return cats
      .map((c) => ({ ...c, items: filtered.filter((p) => p.category === c.name) }))
      .filter((s) => s.items.length > 0);
  }, [showSections, cats, filtered]);

  const title = query ? `Results for "${searchQuery.trim()}"` : active === 'All' ? 'All products' : active;

  const CategoryIcon = ({ c, size = 'w-10 h-10' }) => (
    <span className={`${size} shrink-0 rounded-xl bg-[#EEF7F1] flex items-center justify-center overflow-hidden`}>
      {c.image
        ? <img src={optimizeImg(c.image, 96)} alt="" className="w-full h-full object-contain p-1" loading="lazy" onError={(e) => { e.currentTarget.src = assets.box_icon; }} />
        : <img src={assets.box_icon} alt="" className="w-1/2 opacity-60" />}
    </span>
  );

  return (
    <div className="pt-4 md:pt-6 pb-24">
      <div className="flex gap-6 lg:gap-8">
        {/* Category rail (desktop) */}
        <aside className="hidden md:block w-56 lg:w-60 shrink-0">
          <nav aria-label="Categories" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar bg-white border border-gray-100 rounded-2xl py-2">
            {[{ name: 'All', count: products.length, image: null }, ...cats].map((c) => {
              const on = active === c.name && !query;
              return (
                <button
                  key={c.name}
                  onClick={() => { if (query) setSearchQuery(''); choose(c.name); }}
                  aria-current={on ? 'true' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left border-l-4 transition ${on ? 'border-green-600 bg-green-50' : 'border-transparent hover:bg-gray-50'}`}
                >
                  {c.name === 'All' ? (
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-green-600 text-white flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v4H4zM14 16h6v4h-6z" /></svg>
                    </span>
                  ) : <CategoryIcon c={c} />}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm leading-tight capitalize truncate ${on ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{c.name === 'All' ? 'All products' : c.name}</span>
                    <span className="block text-[11px] text-gray-400">{c.count} items</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0" ref={topRef} style={{ scrollMarginTop: '7rem' }}>
          {/* Category chips (mobile) */}
          <div className="md:hidden -mx-4 px-4 mb-4 flex gap-3 overflow-x-auto no-scrollbar">
            {[{ name: 'All', image: null }, ...cats].map((c) => {
              const on = active === c.name && !query;
              return (
                <button key={c.name} onClick={() => { if (query) setSearchQuery(''); choose(c.name); }} className="shrink-0 w-16 flex flex-col items-center gap-1">
                  <span className={`rounded-2xl p-0.5 ${on ? 'ring-2 ring-green-600' : ''}`}>
                    {c.name === 'All' ? (
                      <span className="w-14 h-14 rounded-xl bg-green-600 text-white flex items-center justify-center text-xs font-bold">ALL</span>
                    ) : <CategoryIcon c={c} size="w-14 h-14" />}
                  </span>
                  <span className={`text-[10px] leading-tight text-center line-clamp-2 capitalize ${on ? 'font-bold text-green-700' : 'text-gray-600'}`}>{c.name === 'All' ? 'All' : c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Header + controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">{title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{filtered.length} item{filtered.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInStockOnly((v) => !v)}
                aria-pressed={inStockOnly}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition ${inStockOnly ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                In stock only
              </button>
              <label className="relative">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-9 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:border-green-600 cursor-pointer"
                >
                  {SORTS.map((s) => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
                </select>
                <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </label>
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <img src={assets.search_icon} alt="" className="w-8 h-8 mx-auto opacity-30 mb-3" />
              <p className="font-semibold text-gray-800">No products found</p>
              <p className="text-sm text-gray-500 mt-1">Try a different search or category.</p>
              {(query || inStockOnly || active !== 'All') && (
                <button onClick={() => { setSearchQuery(''); setInStockOnly(false); setActive('All'); }} className="mt-5 px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold">
                  Clear filters
                </button>
              )}
            </div>
          ) : showSections ? (
            <div className="space-y-10">
              {sections.map((s) => (
                <section key={s.name}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 capitalize">{s.name}</h2>
                    {s.items.length > SECTION_PREVIEW && (
                      <button onClick={() => choose(s.name)} className="text-sm font-semibold text-green-700 hover:text-green-800">
                        See all {s.items.length}
                      </button>
                    )}
                  </div>
                  <ProductGrid items={s.items.slice(0, SECTION_PREVIEW)} />
                </section>
              ))}
            </div>
          ) : (
            <ProductGrid items={filtered} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
