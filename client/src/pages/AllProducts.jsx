// import React, { useEffect, useState } from 'react'
// import { useAppContext } from '../context/AppContext'
// import ProductCard from '../components/ProductCard';

// const AllProducts = () => {

//     const {products, searchQuery} = useAppContext();
//     const [filteredProducts, setFilteredProducts] = useState([]);

//     useEffect(()=>{
//         if(searchQuery.length > 0){
//             setFilteredProducts(products.filter(
//                 product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
//             ))}
//             else{
//                 setFilteredProducts(products)
//             }
//     }, [products, searchQuery]);

//   return (
//     <div className='mt-16 flex flex-col'>
//         <div className='flex flex-col items-end w-max'>
//             <p className='text-2xl font-medium uppercase'>All products</p>
//             <div className='w-16 h-0.5 bg-primary rounded-full'></div>
//         </div>
//         <div className='grid grid-cols-2 sm:grid-cols-3 md:grid:cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6'>
//             {filteredProducts.filter((product) => product.inStock).map((product, index) =>(
//                 <ProductCard key={index} product={product}/>
//             ))} 
//         </div>
//     </div>
//   )
// }

// export default AllProducts



import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const AllProducts = () => {
  const { products, searchQuery } = useAppContext();
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      setFilteredProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchQuery]);

  // Group products by category
  const getProductsByCategory = () => {
    const categories = {};

    filteredProducts.forEach(product => {
      if (product.inStock) {
        if (!categories[product.category]) {
          categories[product.category] = [];
        }
        categories[product.category].push(product);
      }
    });

    return categories;
  };

  const productsByCategory = getProductsByCategory();

  return (
    <div className="mt-16 flex flex-col gap-10">
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium uppercase">All products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {/* Render products grouped by category */}
      {Object.keys(productsByCategory).map(category => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {productsByCategory[category].map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllProducts;
