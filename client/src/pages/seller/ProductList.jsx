import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { optimizeImg } from '../../utils/image';
import { Page, PageHeader, StatCard, Badge, Button, EmptyState, SearchInput, Segmented, Icon, inputCls } from '../../components/Seller/ui';

const ProductList = () => {
  const { products, currency, axios, fetchProducts, confirmAction, categories: allCategories } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStock, setFilterStock] = useState('All');
  const navigate = useNavigate();

  // Use database categories for filter to stay synced with Category Management
  const filterCategories = ['All', ...allCategories.map(c => c.name)];

  const updateProductCategory = async (id, category) => {
    try {
      const { data } = await axios.post('/api/product/update', { id, category });
      if (data.success) {
        fetchProducts();
        toast.success("Category updated");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateStockValue = async (id, stock) => {
    try {
      const { data } = await axios.post('/api/product/stock', { id, stock: Number(stock) });
      if (data.success) {
        fetchProducts();
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteProduct = async (id) => {
    confirmAction(
      "Delete product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const { data } = await axios.delete(`/api/product/remove/${id}`);
          if (data.success) {
            toast.success("Product deleted");
            fetchProducts();
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Delete failed");
        }
      },
      'danger'
    );
  };

  const lowStock = (p) => p.stock > 0 && p.stock < 5;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    const matchesStock = filterStock === 'All'
      ? true
      : filterStock === 'In stock'
        ? product.stock > 0
        : filterStock === 'Low'
          ? lowStock(product)
          : product.stock <= 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const inStockCount = products.filter(p => p.stock > 0).length;
  const lowCount = products.filter(lowStock).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <Page>
      <PageHeader
        title="Products"
        subtitle="Manage prices, stock levels and categories for your catalogue."
        actions={<Button icon="plus" onClick={() => navigate('/seller/add-product')}>Add product</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total products" value={products.length} icon="box" tone="slate" hint={`${allCategories.length} categories`} />
        <StatCard label="In stock" value={inStockCount} icon="check" tone="green" hint="Available to customers" />
        <StatCard label="Low stock" value={lowCount} icon="alert" tone="amber" hint="Fewer than 5 left" valueClass={lowCount ? 'text-amber-600' : 'text-slate-900'} />
        <StatCard label="Out of stock" value={outOfStockCount} icon="ban" tone="red" hint="Hidden from sale" valueClass={outOfStockCount ? 'text-red-600' : 'text-slate-900'} />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="min-w-0">
            <Segmented
              value={filterStock}
              onChange={setFilterStock}
              options={[
                { key: 'All', count: products.length },
                { key: 'In stock', count: inStockCount },
                { key: 'Low', label: 'Low stock', count: lowCount },
                { key: 'Out', label: 'Out of stock', count: outOfStockCount },
              ]}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <SearchInput className="w-full sm:w-64" placeholder="Search products" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${inputCls} sm:w-48 cursor-pointer`} aria-label="Filter by category">
              {filterCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70 text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const out = product.stock <= 0;
                const low = lowStock(product);
                const discount = product.price > product.offerPrice ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
                return (
                  <tr key={product._id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5 min-w-[220px]">
                        <div className="w-12 h-12 rounded-xl ring-1 ring-slate-200/70 p-1.5 bg-white shrink-0 flex items-center justify-center">
                          <img src={optimizeImg(product.image?.[0], 120)} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 leading-snug line-clamp-2">{product.name}</p>
                          {product.weight && <p className="text-xs text-slate-500 mt-0.5">{product.weight}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <select
                        value={product.category}
                        onChange={(e) => updateProductCategory(product._id, e.target.value)}
                        className="h-8 rounded-lg border border-slate-200 bg-white hover:border-slate-300 px-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                        aria-label="Category"
                      >
                        {/* Ensure current category is always an option even if not in allCategories */}
                        {[...new Set([...allCategories.map(c => c.name), product.category])].filter(Boolean).map((catName, idx) => (
                          <option key={idx} value={catName}>{catName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 tabular-nums">{currency}{product.offerPrice}</p>
                      {discount > 0 && (
                        <p className="text-xs text-slate-400 tabular-nums">
                          <span className="line-through">{currency}{product.price}</span>
                          <span className="ml-1.5 text-green-700 font-medium">{discount}% off</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateStockValue(product._id, e.target.value)}
                          aria-label="Stock"
                          className={`w-20 h-8 text-center rounded-lg border text-sm font-semibold outline-none tabular-nums transition focus:ring-4 ${out ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500/10' : low ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500/10' : 'bg-white border-slate-200 text-slate-900 focus:border-green-500 focus:ring-green-500/10'}`}
                        />
                        {out ? <Badge tone="red" dot>Sold out</Badge> : low ? <Badge tone="amber" dot>Low</Badge> : <Badge tone="green" dot>In stock</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete product"
                        aria-label="Delete product"
                      >
                        <Icon name="trash" className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <EmptyState
              icon="box"
              title={products.length ? 'No matching products' : 'No products yet'}
              text={products.length ? 'Try a different search or filter.' : 'Add your first product to start selling.'}
              action={!products.length && <Button icon="plus" size="sm" onClick={() => navigate('/seller/add-product')}>Add product</Button>}
            />
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> of {products.length} products
        </div>
      </section>
    </Page>
  );
};

export default ProductList;
