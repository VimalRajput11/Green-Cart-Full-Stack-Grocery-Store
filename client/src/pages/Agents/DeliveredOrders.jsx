// src/pages/agent/DeliveredOrders.jsx

import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const DeliveredOrders = () => {
  const { axios } = useAppContext();
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
                <img src={assets.box_icon} alt="box" className="w-10 h-10 mt-1" />
                <div className="text-sm">
                  {items.map((item, i) => (
                    <p key={i}>
                      {item.product.name} x {item.quantity}
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

              <div className="text-green-700 font-semibold mt-2 md:mt-0 w-full md:w-1/3 text-right">
                Delivered Successfully
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveredOrders;
