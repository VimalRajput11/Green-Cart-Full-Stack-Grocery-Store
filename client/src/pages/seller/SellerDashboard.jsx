import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
    const { currency, axios, products } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        pendingOrders: 0,
        productsCount: 0
    });
    const navigate = useNavigate();

    // Fetch orders to calculate stats
    const fetchDashboardData = async () => {
        try {
            const { data } = await axios.get('/api/order/seller');
            if (data.success) {
                const allOrders = data.orders;
                setOrders(allOrders);

                // Use robust backend calculation for stats (includes hidden orders)
                if (data.stats) {
                    setStats({
                        ...data.stats,
                        productsCount: products.length
                    });
                } else {
                    // Fallback to client-side if stats are missing
                    const totalSales = allOrders.reduce((acc, order) => acc + (order.isPaid ? order.amount : 0), 0);
                    const pending = allOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
                    setStats({
                        totalSales,
                        totalOrders: allOrders.length,
                        pendingOrders: pending,
                        productsCount: products.length
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [products]);

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-4 rounded-full ${color}`}>
                <img src={icon} alt="" className="w-8 h-8 opacity-80" />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, here's what's happening in your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value={`${currency}${stats.totalSales.toLocaleString()}`}
                    icon={assets.coin_icon}
                    color="bg-yellow-100"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={assets.order_icon}
                    color="bg-blue-100"
                />
                <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon={assets.delivery_truck_icon}
                    color="bg-orange-100"
                />
                <StatCard
                    title="Total Products"
                    value={stats.productsCount}
                    icon={assets.product_list_icon}
                    color="bg-green-100"
                />
            </div>

            {/* Stock Alert */}
            {products.some(p => !p.inStock) && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800">Attention Needed</h3>
                            <p className="text-sm text-red-700">You have {products.filter(p => !p.inStock).length} products out of stock. Restock them to avoid losing sales.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/seller/product-list')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                    >
                        View Products
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
                        <button onClick={() => navigate('/seller/orders')} className="text-primary text-sm font-medium hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Order ID</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-800">#{order._id.slice(-6)}</td>
                                        <td className="px-4 py-3">{order.address?.firstName}</td>
                                        <td className="px-4 py-3 font-semibold">{currency}{order.amount}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold 
                                                ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-400">No recent orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Quick Actions</h3>

                    <button onClick={() => navigate('/seller/add-product')} className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 hover:border-primary transition group">
                        <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition text-primary">
                            <img src={assets.add_icon} className="w-5 h-5" alt="" />
                        </div>
                        <span className="font-medium text-gray-700">Add New Product</span>
                    </button>

                    <button onClick={() => navigate('/seller/add-category')} className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 hover:border-primary transition group">
                        <div className="bg-purple-100 p-2 rounded-full group-hover:bg-purple-500 group-hover:text-white transition text-purple-600">
                            {/* reusing add icon or maybe a different one if available, but add_icon is safe */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </div>
                        <span className="font-medium text-gray-700">Add New Category</span>
                    </button>

                    <button onClick={() => navigate('/seller/agents')} className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 hover:border-primary transition group">
                        <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-500 group-hover:text-white transition text-blue-600">
                            <img src={assets.agent_icon} className="w-5 h-5" alt="" />
                        </div>
                        <span className="font-medium text-gray-700">Manage Agents</span>
                    </button>

                    <div className="mt-auto bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-xs text-green-800 font-semibold mb-1">Pro Tip</p>
                        <p className="text-xs text-green-700">Keep your inventory updated to avoid cancellations!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
