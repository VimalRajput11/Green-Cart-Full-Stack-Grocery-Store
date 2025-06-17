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
    }, 30000);

    return () => clearInterval(interval);
  }, [agent]);

  const fetchOrders = async (agentId) => {
    try {
      const { data } = await axios.get("/api/agents/orders/visible");
      if (data.success) {
        // Filter orders: only orders assigned to this agent or unassigned and NOT delivered
        const visibleOrders = data.orders.filter(
          (order) =>
            (!order.assignedTo || order.assignedTo === agentId) &&
            order.status !== "Delivered"
        );
        setOrders(visibleOrders);
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (error) {
      toast.error("Error fetching orders");
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
        toast.success("Order accepted");
        await fetchOrders(agent._id);
      } else {
        toast.error(data.message || "Failed to accept order");
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
        toast.success(`Order status updated to ${newStatus}`);
        await fetchOrders(agent._id);
      } else {
        toast.error(data.message || "Failed to update status");
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
          toast.success("Payment collected in cash");
          await fetchOrders(agent._id);
        } else {
          toast.error(data.message || "Failed to mark as paid");
        }
      } catch (error) {
        toast.error("Payment failed");
      } finally {
        setOrderLoading(orderId, false);
      }
    } else if (method === "online") {
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
          name: "Green Cart",
          description: "Purchase from Green Cart",
          image: "https://i.postimg.cc/PqKVQsSG/favicon.png",
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
            name: user?.name || "",
            email: user?.email || "",
            contact: order.address?.phone || "9999999999",
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

  if (loading) return <div className="p-6">Loading...</div>;

  if (!agent) return <div className="p-6 text-center text-gray-500">Unauthorized access</div>;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Welcome, {agent.name}</h2>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-2xl font-semibold text-gray-500">No active orders</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(({ _id, items, address, status, isPaid, paymentType, assignedTo, amount }) => (
            <div
              key={_id}
              className="border rounded-xl shadow-sm p-4 flex flex-col gap-4 md:flex-row md:justify-between md:items-start bg-white"
            >
              <div className="flex items-start gap-3 w-full md:w-1/3">
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

              <div className="text-sm text-gray-600 w-full md:w-1/3 flex flex-col items-start md:items-end gap-1">
                <p>
                  <strong>Status:</strong> {status}
                </p>
                <p>
                  <strong>Payment:</strong> {isPaid ? "Paid" : "Pending"}
                </p>
                <p>
                  <strong>Method:</strong> {paymentType}
                </p>

                {assignedTo ? (
                  assignedTo === agent._id ? (
                    <>
                      <p className="text-green-600 font-medium">You accepted this order</p>

                      {!isPaid && paymentType === "COD" && (
                        <div className="mt-2 relative">
                          <button
                            onClick={() => toggleDropdown(_id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                          >
                            Mark Payment
                          </button>
                          {paymentDropdowns[_id] && (
                            <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
                              <button
                                onClick={() => handlePaymentSelection(_id, "cash")}
                                className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                Cash
                              </button>
                              <button
                                onClick={() => handlePaymentSelection(_id, "online")}
                                className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                Online
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {status === "Order Placed" && (
                        <button
                          onClick={() => updateOrderStatus(_id, "Picked")}
                          className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                          disabled={loadingOrderIds.includes(_id)}
                        >
                          {loadingOrderIds.includes(_id) ? "Updating..." : "Mark as Picked"}
                        </button>
                      )}

                      {status === "Picked" && (
                        <button
                          onClick={() => updateOrderStatus(_id, "Delivered")}
                          className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          disabled={loadingOrderIds.includes(_id)}
                        >
                          {loadingOrderIds.includes(_id) ? "Updating..." : "Mark as Delivered"}
                        </button>
                      )}

                      {status === "Delivered" && (
                        <p className="text-green-700 font-semibold mt-2">Order Delivered</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 mt-2">Assigned to another agent</p>
                  )
                ) : (
                  <button
                    onClick={() => acceptOrder(_id)}
                    disabled={loadingOrderIds.includes(_id)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    {loadingOrderIds.includes(_id) ? "Accepting..." : "Accept Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryAgentPage;
