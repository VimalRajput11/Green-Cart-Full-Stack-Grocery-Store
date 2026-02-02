import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

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
        toast.success("Category updated successfully");
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
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const { data } = await axios.delete(`/api/product/remove/${id}`);
          if (data.success) {
            toast.success("Product Deleted");
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

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    const matchesStock = filterStock === 'All'
      ? true
      : filterStock === 'Active Stock'
        ? product.stock > 0
        : product.stock <= 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const inStockCount = products.filter(p => p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="p-8 bg-[#fcfcfc] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight tracking-[-0.04em]">Inventory Management</h1>
          <p className="text-gray-400 font-semibold mt-1 text-sm">Maintain and monitor your digital storefront.</p>
        </div>
        <button
          onClick={() => navigate('/seller/add-product')}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-[1.25rem] font-bold transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 text-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Product
        </button>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100/50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Catalog</p>
          <h3 className="text-4xl font-bold text-gray-900">{products.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100/50">
          <p className="text-[11px] font-bold text-green-500 uppercase tracking-widest mb-2">Active Stock</p>
          <h3 className="text-4xl font-bold text-gray-900">{inStockCount}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100/50">
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-2">Zero Stock</p>
          <h3 className="text-4xl font-bold text-gray-900">{outOfStockCount}</h3>
        </div>
      </div>

      {/* Filters and Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100/60 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-gray-50/20">
          <div className="relative w-full md:w-[400px]">
            <img src={assets.search_icon} className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" alt="" />
            <input
              type="text"
              placeholder="Filter by product name..."
              className="w-full bg-white pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500/30 text-sm font-semibold transition-all placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full md:w-44 bg-white px-5 py-3.5 rounded-2xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-green-500/5 transition-all cursor-pointer shadow-sm"
              >
                {filterCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Inventory:</span>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="w-full md:w-44 bg-white px-5 py-3.5 rounded-2xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-green-500/5 transition-all cursor-pointer shadow-sm"
              >
                <option value="All">All Stock</option>
                <option value="Active Stock">Active Stock</option>
                <option value="Zero Stock">Zero Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/20 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-10 py-6">Product Information</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6">Price</th>
                <th className="px-8 py-6 text-center">In Stock</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <img src={assets.box_icon} className="w-16 h-16 mb-4 grayscale" alt="" />
                      <h4 className="text-gray-900 font-bold text-xl uppercase tracking-widest">Storefront Empty</h4>
                      <p className="text-gray-500 font-semibold text-sm">No items found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl border border-gray-100 p-3 bg-white shrink-0 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                          <img src={product.image[0]} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-gray-900 text-lg leading-tight group-hover:text-green-600 transition-colors">{product.name}</p>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{product.weight || 'Default Unit'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <select
                        value={product.category}
                        onChange={(e) => updateProductCategory(product._id, e.target.value)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border border-gray-100 transition-all shadow-sm focus:ring-4 focus:ring-green-500/5 focus:border-green-200"
                      >
                        {/* Ensure current category is always an option even if not in allCategories */}
                        {[...new Set([...allCategories.map(c => c.name), product.category])].filter(Boolean).map((catName, idx) => (
                          <option key={idx} value={catName}>{catName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">{currency}{product.offerPrice}</span>
                        {product.price > product.offerPrice && (
                          <span className="text-[10px] text-gray-300 line-through font-bold uppercase">MRP {currency}{product.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-3">
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateStockValue(product._id, e.target.value)}
                          className={`w-20 text-center py-2 rounded-[1.25rem] border-2 font-bold text-sm outline-none transition-all shadow-sm ${product.stock <= 0 ? 'bg-red-50 border-red-100 text-red-600' : product.stock < 5 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-green-50 border-green-100 text-green-700 focus:ring-4 focus:ring-green-500/5'}`}
                        />
                        {product.stock <= 0 ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-red-500/80 bg-red-50 px-2.5 py-1 rounded-md">Sold Out</span>
                        ) : product.stock < 5 ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/80 bg-orange-50 px-2.5 py-1 rounded-md">Low Inventory</span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-green-600/80 bg-green-50 px-2.5 py-1 rounded-md">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="w-12 h-12 rounded-2xl bg-red-50/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group/btn"
                        title="Permanently Delete"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-10 bg-gray-50/20 border-t border-gray-50 flex justify-between items-center mt-4">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">End of Storage Index</p>
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-bold text-gray-900 bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
              {filteredProducts.length} ARTICLES ACTIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
