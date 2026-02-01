// src/pages/agent/DeliveredOrders.jsx

import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const DeliveredOrders = () => {
  const { axios, confirmAction } = useAppContext();
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        const res = await axios.get("/api/agents/is-auth");
        if (res.data.success) {
          const agentData = res.data.agent || {};
          setAgent(agentData);

          const { data } = await axios.get("/api/agents/orders/visible");
          if (data.success) {
            const delivered = data.orders.filter(
              (order) => order.status === "Delivered" && order.assignedTo === agentData._id
            );
            setDeliveredOrders(delivered);
          } else {
            toast.error("Failed to load delivered orders");
          }
        } else {
          toast.error("Authentication failed");
        }
      } catch (error) {
        toast.error("Please login as agent");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, []);

  const deleteOrder = async (orderId) => {
    confirmAction(
      "Remove Order",
      "Are you sure you want to remove this order from your delivery history?",
      async () => {
        try {
          const { data } = await axios.delete(`/api/agents/order/${orderId}`);
          if (data.success) {
            toast.success("Order deleted successfully");
            setDeliveredOrders(deliveredOrders.filter(order => order._id !== orderId));
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete order");
        }
      },
      'danger'
    );
  };

  if (loading) return <div className="p-6">Loading delivered orders...</div>;

  if (!agent) return <div className="p-6 text-center text-gray-500">Unauthorized access</div>;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Delivered Orders</h2>

      {deliveredOrders.length === 0 ? (
        <p>No delivered orders yet</p>
      ) : (
        <div className="space-y-6">
          {deliveredOrders.map(({ _id, items, address, amount }) => (
            <div
              key={_id}
              className="border rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between bg-white"
            >
              <div className="flex gap-3 w-full md:w-1/3">
                <div className="w-16 h-16 bg-gray-50 rounded-lg p-2 border border-gray-200 shrink-0">
                  <img
                    src={items[0]?.product?.image?.[0] || assets.box_icon}
                    alt="product"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-sm">
                  {items.map((item, i) => (
                    <p key={i} className="text-gray-700">
                      {item.product?.name || 'Product'} x {item.quantity}
                    </p>
                  ))}
                  <p className="mt-1 font-medium">Amount: ₹{amount}</p>
                </div>
              </div>

              <div className="text-sm text-gray-700 w-full md:w-1/3">
                <p className="font-medium">
                  {address.firstName} {address.lastName}
                </p>
                <p>
                  {address.street}, {address.city}
                </p>
                <p>
                  {address.state} - {address.zipcode}
                </p>
                <p>{address.phone}</p>
              </div>

              <div className="flex items-center justify-between w-full md:w-1/3 mt-2 md:mt-0">
                <span className="text-green-700 font-semibold">Delivered Successfully</span>
                <button
                  onClick={() => deleteOrder(_id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                  title="Delete Order"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveredOrders;
