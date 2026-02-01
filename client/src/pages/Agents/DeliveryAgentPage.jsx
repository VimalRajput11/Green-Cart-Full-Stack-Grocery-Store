import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const DeliveryAgentPage = () => {
  const { axios, user } = useAppContext();
  const navigate = useNavigate();

  const [agent, setAgent] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentDropdowns, setPaymentDropdowns] = useState({});
  const [loadingOrderIds, setLoadingOrderIds] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get("/api/agents/is-auth");
        if (res.data.success) {
          const agentData = res.data.agent || {};
          setAgent(agentData);
          await fetchOrders(agentData._id);
        } else {
          toast.error("Authentication failed");
          setAgent(null);
        }
      } catch (error) {
        toast.error("Please login as agent");
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!agent?._id) return;

    const interval = setInterval(() => {
      fetchOrders(agent._id);
    }, 15000); // Polling every 15s

    return () => clearInterval(interval);
  }, [agent]);

  const fetchOrders = async (agentId) => {
    setRefreshing(true);
    try {
      setLoadingOrderIds([]); // Clear any loading states
      const { data } = await axios.get("/api/agents/orders/visible");
      if (data.success) {
        // Filter orders
        const visibleOrders = data.orders.filter(
          (order) =>
            (!order.assignedTo || order.assignedTo === agentId) &&
            order.status !== "Delivered"
        );
        setOrders(visibleOrders);
        toast.success('Orders refreshed!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to refresh orders');
    } finally {
      setRefreshing(false);
    }
  };

  const setOrderLoading = (orderId, isLoading) => {
    setLoadingOrderIds((prev) => {
      if (isLoading) return [...prev, orderId];
      return prev.filter((id) => id !== orderId);
    });
  };

  const acceptOrder = async (orderId) => {
    setOrderLoading(orderId, true);
    try {
      const { data } = await axios.post("/api/agents/accept", { orderId });
      if (data.success) {
        toast.success("Order accepted 🚀");
        await fetchOrders(agent._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Accept failed");
    } finally {
      setOrderLoading(orderId, false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrderLoading(orderId, true);
    try {
      const { data } = await axios.put(`/api/agents/status/${orderId}`, { status: newStatus });
      if (data.success) {
        toast.success(`Status updated: ${newStatus}`);
        await fetchOrders(agent._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Status update failed");
    } finally {
      setOrderLoading(orderId, false);
    }
  };

  const toggleDropdown = (orderId) => {
    setPaymentDropdowns((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handlePaymentSelection = async (orderId, method) => {
    setPaymentDropdowns((prev) => ({ ...prev, [orderId]: false }));

    if (method === "cash") {
      setOrderLoading(orderId, true);
      try {
        const { data } = await axios.put(`/api/agents/mark-paid/${orderId}`);
        if (data.success) {
          toast.success("Cash Collected 💵");
          await fetchOrders(agent._id);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error("Payment failed");
      } finally {
        setOrderLoading(orderId, false);
      }
    } else if (method === "online") {
      // ... (Razorpay logic same as before, simplified for brevity here, assumed working)
      const order = orders.find((o) => o._id === orderId);
      if (!order) return toast.error("Order not found");

      try {
        const orderData = {
          amount: order.amount * 100,
          currency: "INR",
          receipt: order._id,
        };

        const { data } = await axios.post("/api/agents/order/razorpay", orderData);
        if (!data.success) return toast.error("Failed to create Razorpay order");

        const { order: razorpayOrder, orderId: receiptId } = data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Green Cart Agent",
          description: "Payment Collection",
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post("/api/agents/order/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: receiptId,
              });

              if (verifyRes.data.success) {
                toast.success("Payment successful!");
                await updateOrderStatus(receiptId, "Delivered");
                await fetchOrders(agent._id);
              } else {
                toast.error("Payment verification failed.");
              }
            } catch (error) {
              toast.error("Error during payment verification.");
            }
          },
          prefill: {
            name: "Customer",
            contact: order.address?.phone || "",
          },
          theme: {
            color: "#4fbf86",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        toast.error("Order failed: " + (error.message || error));
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/agents/change-password', passwordData);
      if (data.success) {
        toast.success('Password updated successfully!');
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading orders...</div>;
  if (!agent) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Current Tasks
          <span className="ml-2 text-sm font-normal text-white bg-primary px-2 py-0.5 rounded-full">{orders.length}</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition"
            title="Change Password"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </button>
          <button
            onClick={() => fetchOrders(agent._id)}
            className="text-primary p-2 hover:bg-primary/10 rounded-full transition"
            title="Refresh Orders"
            disabled={refreshing}
          >
            <svg
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>

      {
        showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Current Password</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-green-600 transition">Update</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <img src={assets.box_icon} className="w-12 h-12 opacity-30 grayscale" alt="" />
            </div>
            <p className="text-gray-500 font-medium">No active tasks nearby.</p>
            <p className="text-sm text-gray-400">Enjoy your break! ☕</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const isAssignedToMe = order.assignedTo === agent._id;
              const isLoading = loadingOrderIds.includes(order._id);

              return (
                <div
                  key={order._id}
                  className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md
                ${isAssignedToMe ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'}
              `}
                >
                  {/* Status Banner */}
                  <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wide flex justify-between items-center
                ${isAssignedToMe ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}
              `}>
                    <span>{isAssignedToMe ? '● Active Task' : '○ New Request'}</span>
                    <span>Order #{order._id.slice(-4)}</span>
                  </div>

                  <div className="p-5">
                    {/* Customer Info */}
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                        <img src={assets.profile_icon} className="w-6 opacity-60" alt="" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{order.address?.firstName} {order.address?.lastName}</h3>
                        <p className="text-gray-500 text-sm leading-tight">{order.address?.street}, {order.address?.city}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a href={`tel:${order.address?.phone}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-medium flex items-center gap-1">
                            Call {order.address?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-100 my-3" />

                    {/* Order Info */}
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold">Order Details</p>
                        <p className="text-sm text-gray-700 font-medium mt-1">{order.items.length} Items • ₹{order.amount}</p>
                        <p className="text-xs text-gray-500">{order.paymentType} • {order.isPaid ? <span className="text-green-600 font-bold">PAID</span> : <span className="text-orange-500 font-bold">PENDING</span>}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 capitalize">Current Status</p>
                        <p className="text-sm font-bold text-gray-800">{order.status}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      {!isAssignedToMe ? (
                        <button
                          onClick={() => acceptOrder(order._id)}
                          disabled={isLoading}
                          className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg shadow-blue-200
                                ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
                            `}
                        >
                          {isLoading ? 'Processing...' : 'Accept Order'}
                        </button>
                      ) : (
                        <>
                          {/* Status Progression */}
                          {/* Status Progression */}
                          {order.status === "Order Placed" && (
                            <button onClick={() => updateOrderStatus(order._id, "Picked")} disabled={isLoading} className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-yellow-200 transition active:scale-95">
                              {isLoading ? 'Updating...' : '📦 Mark as Picked'}
                            </button>
                          )}

                          {order.status === "Picked" && (
                            <button onClick={() => updateOrderStatus(order._id, "Out for Delivery")} disabled={isLoading} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition active:scale-95">
                              {isLoading ? 'Updating...' : '🚚 Out for Delivery'}
                            </button>
                          )}

                          {order.status === "Out for Delivery" && (
                            <button onClick={() => updateOrderStatus(order._id, "Arriving")} disabled={isLoading} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition active:scale-95">
                              {isLoading ? 'Updating...' : '📍 Arriving Soon'}
                            </button>
                          )}

                          {order.status === "Arriving" && (
                            <button onClick={() => updateOrderStatus(order._id, "Reached Location")} disabled={isLoading} className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition active:scale-95">
                              {isLoading ? 'Updating...' : '🏠 Reached Location'}
                            </button>
                          )}

                          {order.status === "Reached Location" && (
                            <button onClick={() => updateOrderStatus(order._id, "Delivered")} disabled={isLoading} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition active:scale-95">
                              {isLoading ? 'Updating...' : '✅ Mark as Delivered'}
                            </button>
                          )}

                          {/* Payment Collection Logic */}
                          {!order.isPaid && order.paymentType === "COD" && order.status !== 'Delivered' && (
                            <div className="relative mt-2">
                              <button
                                onClick={() => toggleDropdown(order._id)}
                                className="w-full py-2.5 border-2 border-green-600 text-green-700 font-bold rounded-xl hover:bg-green-50 transition"
                              >
                                Collect Payment 💵
                              </button>

                              {paymentDropdowns[order._id] && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-10 flex flex-col gap-1">
                                  <p className="text-xs text-center text-gray-400 font-medium mb-1">Select Method</p>
                                  <button onClick={() => handlePaymentSelection(order._id, 'cash')} className="py-2 hover:bg-gray-100 rounded-lg font-medium text-gray-700">Cash Received</button>
                                  <button onClick={() => handlePaymentSelection(order._id, 'online')} className="py-2 hover:bg-gray-100 rounded-lg font-medium text-gray-700">Online QR</button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div >
  );
};

export default DeliveryAgentPage;
