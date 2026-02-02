import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductSlider from '../components/ProductSlider';
import { assets } from '../assets/assets';

const AllProducts = () => {
  const { products, searchQuery, categories } = useAppContext();
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [sortType, setSortType] = useState('relevant');

  // Sync with dynamic categories from database
  const categoriesList = categories && categories.length > 0
    ? categories.map(cat => cat.name)
    : [];

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value))
    }
    else {
      setCategory(prev => [...prev, e.target.value])
    }
  }

  const applyFilter = () => {
    let productsCopy = products.slice();

    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    setFilterProducts(productsCopy)
  }

  const sortProduct = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => (a.offerPrice - b.offerPrice)));
        break;

      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => (b.offerPrice - a.offerPrice)));
        break;

      default:
        applyFilter();
        break;
    }
  }

  useEffect(() => {
    applyFilter();
  }, [category, searchQuery, products])

  useEffect(() => {
    sortProduct();
  }, [sortType])

  // Group products by category for the slider view
  const groupedProducts = categoriesList.reduce((acc, catName) => {
    const productsInCat = products.filter(p => p.category === catName);
    if (productsInCat.length > 0) {
      acc[catName] = productsInCat;
    }
    return acc;
  }, {});

  const isFiltering = (searchQuery && searchQuery.trim() !== '') || category.length > 0;

  return (
    <div className='flex flex-col gap-1 pt-4 border-t border-gray-100 mb-20'>

      {/* Page Header */}
      <div className='mb-4 text-center md:text-left'>
        <h1 className='text-3xl font-bold text-gray-800 tracking-wide font-serif'>All Products</h1>
        <p className='text-gray-500 mt-2 font-light'>Browse products by category</p>
      </div>

      <div className='flex flex-col sm:flex-row gap-8 sm:gap-10 pt-2'>

        {/* Filter Options */}
        <div className='min-w-60'>
          <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2 font-medium text-gray-700'>
            Filters
            <img className={`h-3 sm:hidden transition-transform ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
          </p>

          {/* Category Filter */}
          <div className={`border border-gray-200 pl-5 py-5 mt-6 rounded-lg bg-white shadow-sm ${showFilter ? '' : 'hidden'} sm:block`}>
            <p className='mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900'>Categories</p>
            <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
              {categoriesList.map((cat) => (
                <label key={cat} className='flex items-center gap-2 cursor-pointer hover:text-green-600 transition'>
                  <input className='w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded' type="checkbox" value={cat} onChange={toggleCategory} />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className='flex-1 min-w-0'>

          {/* Sort & Title */}
          <div className='flex justify-between items-center text-base sm:text-lg mb-6'>
            <p className='text-gray-600 font-light'>
              {isFiltering ? (
                <>Showing <span className='font-semibold text-gray-900'>{filterProducts.length}</span> products</>
              ) : (
                <>All categories</>
              )}
            </p>
            {isFiltering && (
              <select onChange={(e) => setSortType(e.target.value)} className='border border-gray-300 text-sm px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-700 cursor-pointer'>
                <option value="relevant">Sort by: Relevant</option>
                <option value="low-high">Sort by: Low to High</option>
                <option value="high-low">Sort by: High to Low</option>
              </select>
            )}
          </div>

          {/* Conditional Rendering: Sliders or Grid */}
          {isFiltering ? (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6'>
              {filterProducts.map((product, index) => (
                <div key={index} className="transform transition duration-500 hover:scale-[1.02]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.keys(groupedProducts).map((catName) => (
                <ProductSlider
                  key={catName}
                  title={catName}
                  categoryName={catName}
                  products={groupedProducts[catName]}
                />
              ))}
            </div>
          )}

          {filterProducts.length === 0 && isFiltering && (
            <div className='flex flex-col items-center justify-center py-20 text-gray-500'>
              <p className='text-lg'>No products found matching your filters.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AllProducts

