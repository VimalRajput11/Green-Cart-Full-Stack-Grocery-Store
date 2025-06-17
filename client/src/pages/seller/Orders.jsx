import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';

const Orders = () => {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/order/seller');
      if (data.success) setOrders(data.orders);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) setAgents(data.agents);
      else toast.error(data.message);
    } catch (error) {
      toast.error("Failed to load agents");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAgents();
  }, []);

  return (
    <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'>
      <div className="md:p-10 p-4 space-y-4">
        <h2 className="text-lg font-medium">Orders List</h2>

        {orders.map((order) => (
          <div
            key={order._id}
            className="flex flex-col md:items-center md:flex-row justify-between gap-5 p-5 max-w-4xl rounded-md border border-gray-300"
          >
            {/* Product Info */}
            <div className="flex gap-5 max-w-80">
              <img className="w-12 h-12 object-cover" src={assets.box_icon} alt="boxIcon" />
              <div>
                {order.items.map((item) => (
                  <div key={item._id || item.product._id} className="flex flex-col">
                    <p className="font-medium">
                      {item.product.name}{' '}
                      <span className='text-primary'>x {item.quantity}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="text-sm md:text-base text-black/60">
              <p className='text-black/80'>
                {order.address?.firstName} {order.address?.lastName}
              </p>
              <p>{order.address?.street}, {order.address?.city}</p>
              <p>{order.address?.state}, {order.address?.zipcode}, {order.address?.country}</p>
              <p>{order.address?.phone}</p>
            </div>

            {/* Amount */}
            <p className="font-medium text-lg my-auto">{currency}{order.amount}</p>

            {/* Status & Agent Control */}
            <div className="flex flex-col text-sm md:text-base text-black/60">
              <p>Status: <strong>{order.status}</strong></p>
              <p>Method: {order.paymentType}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Payment: {order.isPaid ? "Paid" : "Pending"}</p>

              {/* Assigned Agent Info */}
              {order.assignedTo && (() => {
                const agentId = typeof order.assignedTo === 'string' ? order.assignedTo : order.assignedTo._id;
                const agent = agents.find(a => a._id === agentId) || {};
                return (
                  <div className="mt-1 text-xs text-green-800 font-semibold  tracking-wide bg-green-100 px-2 py-1 rounded">
                    <p>Assigned to: {agent.name || 'Unknown Agent'}</p>
                    <p>Phone: {agent.phone || 'N/A'}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
