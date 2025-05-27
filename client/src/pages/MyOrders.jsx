import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    Delivered: 'bg-green-100 text-green-700',
    Shipped: 'bg-yellow-100 text-yellow-700',
    Pending: 'bg-gray-100 text-gray-700',
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        statusStyles[status] || 'bg-gray-200 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
};

const getStatusStep = (status) => {
  switch (status) {
    case 'Pending':
      return 1;
    case 'Shipped':
      return 2;
    case 'Delivered':
      return 3;
    default:
      return 0;
  }
};

const ProgressBar = ({ status }) => {
  const step = getStatusStep(status);
  const steps = ['Pending', 'Shipped', 'Delivered'];

  return (
    <div className="relative mt-4 w-full px-2">
      {/* Background Line */}
      <div className="absolute top-2 left-0 right-0 h-0.5 bg-gray-300 z-0" />

      {/* Active Progress Line */}
      <div
        className="absolute top-2 left-0 h-0.5 bg-primary z-10 transition-all duration-300"
        style={{
          width: `${(step - 1) / (steps.length - 1) * 100}%`,
        }}
      />

      {/* Step Dots and Labels */}
      <div className="flex justify-between relative z-20">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-col items-center">
            <div
              className={`w-4 h-4 rounded-full mb-1 ${
                step >= index + 1 ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const { currency, axios, user } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get('/api/order/user');
      if (data.success) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  return (
    <div className="mt-16 pb-16 px-4">
      <div className="flex flex-col items-start mb-8">
        <p className="text-2xl font-semibold uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full mt-1" />
      </div>

      {myOrders.map((order, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl w-full mx-auto"
        >
          {/* Order Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-gray-600 text-sm font-medium mb-2">
            <div className="flex flex-col md:flex-row md:items-center md:gap-8">
              <span>Order ID: {order._id}</span>
              <span>Payment: {order.paymentType}</span>
              <span>
                Total: {currency}
                {order.amount}
              </span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress Bar */}
          <ProgressBar status={order.status} />

          {/* Ordered Items */}
          {order.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className={`relative bg-white text-gray-600 ${
                order.items.length !== itemIndex + 1 ? 'border-b' : ''
              } 
              border-gray-300 flex flex-col md:flex-row md:items-center justify-between 
              p-4 py-5 gap-4`}
            >
              {/* Product Info */}
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <img
                    src={item.product.image[0]}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {item.product.name}
                  </h2>
                  <p className="text-sm">Category: {item.product.category}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="text-sm text-gray-500">
                <p>Quantity: {item.quantity || '1'}</p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Price */}
              <div className="text-primary text-base font-semibold">
                ₹{item.product.offerPrice * item.quantity}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MyOrders;
