import React from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext.jsx'

import Home from './pages/Home.jsx'
import Login from './components/Login.jsx'
import AllProducts from './pages/AllProducts.jsx'
import ProductCategory from './pages/ProductCategory.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Cart from './pages/Cart.jsx'
import AddAddress from './pages/AddAddress.jsx'
import MyOrders from './pages/MyOrders.jsx'

import SellerLogin from './components/Seller/SellerLogin.jsx'
import SellerLayout from './pages/seller/SellerLayout.jsx'
import AddProduct from './pages/seller/AddProduct.jsx'
import ProductList from './pages/seller/ProductList.jsx'
import Orders from './pages/seller/Orders.jsx'
import SellerAgents from './pages/seller/SellerAgents.jsx'

import AgentLogin from './pages/Agents/AgentLogin.jsx'
import AgentLayout from './pages/Agents/AgentLayout.jsx'
import DeliveryAgentPage from './pages/Agents/DeliveryAgentPage.jsx'
import DeliveredOrders from './pages/Agents/DeliveredOrders.jsx'

const App = () => {
  const location = useLocation();
  const isSellerPath = location.pathname.startsWith('/seller');
  const isAgentPath = location.pathname.startsWith('/agents');
  const { showUserLogin, isSeller, isAgent } = useAppContext();

  return (
    <div className="text-default min-h-screen text-gray-700 bg-white">
      {!isSellerPath && !isAgentPath && <Navbar />}
      {showUserLogin && <Login />}
      <Toaster />

      <div className={`${isSellerPath || isAgentPath ? '' : 'px-6 md:px-16 lg:px-24 xl:px-32'}`}>
        <Routes>
          {/* Public User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/my-orders" element={<MyOrders />} />

          {/* Seller Auth and Layout Routes */}
          <Route path="/seller" element={isSeller ? <SellerLayout /> : <SellerLogin />}>
            <Route index element={isSeller ? <AddProduct /> : null} />
            <Route path="product-list" element={<ProductList />} />
            <Route path="orders" element={<Orders />} />
            <Route path="agents" element={<SellerAgents />} />
          </Route>

          {/* Agent Auth and Layout Routes */}
          <Route path="/agents" element={isAgent ? <AgentLayout /> : <AgentLogin />}>
            <Route index element={isAgent ? <DeliveryAgentPage /> : null} />
            <Route path="delivered" element={<DeliveredOrders />} />
          </Route>
          <Route path="*" element={<NotFound />} /> {/* Catch-all route */}
        </Routes>
      </div>

      {!isSellerPath && !isAgentPath && <Footer />}
    </div>
  );
};

export default App;
