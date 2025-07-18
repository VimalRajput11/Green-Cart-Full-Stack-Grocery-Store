import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const SellerLayout = () => {
  const { navigate, axios } = useAppContext();

  const sidebarLinks = [
    {
      name: "Add Product",
      path: "/seller",
      icon: assets.add_icon,
    },
    {
      name: "Product List",
      path: "/seller/product-list",
      icon: assets.product_list_icon,
    },
    {
      name: "Orders",
      path: "/seller/orders",
      icon: assets.order_icon,
     
    },
   
     {
      name: "Agents",
      path: "/seller/agents",
      icon: assets.agent_icon,
    },
  ];

  const logout = async () => {
    try {
      const { data } = await axios.get('/api/seller/logout');
      if (data.success) {
        toast.success(data.message);
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white">
        <Link to="/">
          <img
            src={assets.logo}
            alt="logo"
            className="cursor-pointer w-28 md:w-36"
          />
        </Link>
        <div className="flex items-center gap-5 text-gray-500">
          <p>Hi! Admin</p>
          <button
            onClick={logout}
            className="border rounded-full text-sm px-4 py-1 cursor-pointer hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="md:w-64 w-16 border-r h-[95vh] text-base border-gray-300 pt-4 flex flex-col">
          {sidebarLinks.map((item) => (
            <NavLink
              to={item.path}
              key={item.path}
              end={item.path === '/seller'}
              className={({ isActive }) =>
                `flex items-center py-3 px-4 gap-3 transition-colors duration-200 ${
                  isActive
                    ? "border-r-4 md:border-r-[6px] bg-primary/10 border-primary text-primary"
                    : "hover:bg-gray-100/90 border-white text-gray-700"
                }`
              }
            >
              <img src={item.icon} alt={item.name} className="w-6 h-6" />
              <span className="hidden md:block">{item.name}</span>
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default SellerLayout;
