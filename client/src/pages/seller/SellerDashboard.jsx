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

    const StatCard = ({ title, value, icon, color, iconColor }) => (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100/50 flex items-center justify-between hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
                    <img src={icon} alt="" className={`w-7 h-7 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-gray-400 text-[13px] font-semibold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 bg-[#fcfcfc] min-h-full">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-400 font-semibold text-sm mt-1">Welcome back, here's what's happening in your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <StatCard
                    title="Total Revenue"
                    value={`${currency}${stats.totalSales.toLocaleString()}`}
                    icon={assets.coin_icon}
                    color="bg-green-50"
                    iconColor="brightness-0 saturate-100 invert-[58%] sepia-[48%] saturate-[412%] hue-rotate-[98deg] brightness-[91%] contrast-[86%]"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={assets.order_icon}
                    color="bg-blue-50"
                />
                <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon={assets.delivery_truck_icon}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Total Products"
                    value={stats.productsCount}
                    icon={assets.product_list_icon}
                    color="bg-emerald-50"
                />
            </div>

            {/* Stock Alert */}
            {products.some(p => p.stock <= 0) && (
                <div className="mb-10 bg-red-50/50 border border-red-100 rounded-[1.5rem] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-red-500">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-base">Attention Needed</h3>
                            <p className="text-sm font-semibold text-red-600/80">You have {products.filter(p => p.stock <= 0).length} products out of stock. Restock them to avoid losing sales.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/seller/product-list')}
                        className="bg-[#e40000] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                    >
                        View Products
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100/60 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                        <button onClick={() => navigate('/seller/orders')} className="text-green-600 font-semibold text-sm hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-4 py-4">Order ID</th>
                                    <th className="px-4 py-4">Customer</th>
                                    <th className="px-4 py-4">Amount</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-4 py-5 font-bold text-gray-900">#{order._id.slice(-6)}</td>
                                        <td className="px-4 py-5 font-semibold text-gray-600">{order.address?.firstName}</td>
                                        <td className="px-4 py-5 font-bold text-gray-800">{currency}{order.amount}</td>
                                        <td className="px-4 py-5">
                                            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider 
                                                ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-orange-700'}`}>
                                                {order.status === 'Order Placed' ? 'Order Placed' : order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 font-semibold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-12 text-center">
                                            <p className="font-bold text-sm text-gray-300 uppercase tracking-widest">No recent orders found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/60 p-8 flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h3>

                    <button onClick={() => navigate('/seller/add-product')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                        <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all text-green-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Add New Product</span>
                    </button>

                    <button onClick={() => navigate('/seller/add-category')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group">
                        <div className="bg-purple-50 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all text-purple-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Add New Category</span>
                    </button>

                    <button onClick={() => navigate('/seller/agents')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                        <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Manage Agents</span>
                    </button>

                    <div className="mt-auto bg-green-50/60 p-5 rounded-2xl border border-green-100/50">
                        <p className="text-[10px] text-green-800 font-bold uppercase tracking-widest mb-1 opacity-60">Pro Tip</p>
                        <p className="text-xs font-semibold text-green-700 leading-relaxed">Keep your inventory updated to avoid order cancellations!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
