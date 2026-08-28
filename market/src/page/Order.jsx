import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { MarketHeader } from "../component/MarketHeader";
import { MarketFooter } from "../component/MarketFooter";
import { PageLoader } from "../component/Loader";

export default function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buying"); // buying | selling
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/market/orders?type=${tab}`,
        { withCredentials: true }
      );
      setOrders(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const res = await axios.patch(
        `${API_URL}/api/market/orders/${orderId}`,
        { status },
        { withCredentials: true }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data.order : o))
      );

      toast.success(
        status === "completed"
          ? "Order completed"
          : status === "cancelled"
          ? "Order cancelled"
          : "Order updated"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const openChat = (order) => {
    // Opens Student Connect chat with the other person
    const otherUserId =
      tab === "buying" ? order.seller?._id : order.buyer?._id;

    if (!otherUserId) {
      toast.error("Unable to open chat");
      return;
    }

    navigate(`/chat/${otherUserId}?orderId=${order._id}`);
  };

  const statusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const statusIcon = (status) => {
    if (status === "completed") return <CheckCircle2 size={14} />;
    if (status === "cancelled") return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/market")}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Orders
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Payment on delivery • Chat with the other student
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab("buying")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "buying"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Buying
          </button>
          <button
            onClick={() => setTab("selling")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "selling"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Selling
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Package className="text-indigo-500" size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              {tab === "buying"
                ? "When you place an order, it will show up here."
                : "When someone orders your item, it will show up here."}
            </p>
            <button
              onClick={() => navigate("/market")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              <ShoppingBag size={16} />
              Go to Market
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const product = order.product;
              const otherPerson =
                tab === "buying" ? order.seller : order.buyer;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div
                      onClick={() =>
                        product?._id &&
                        navigate(`/market/item/${product._id}`)
                      }
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
                    >
                      {product?.files?.[0]?.url ? (
                        <img
                          src={product.files[0].url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="text-gray-300" size={28} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 line-clamp-1">
                            {product?.title || "Item"}
                          </h3>

                          <p className="text-sm text-indigo-600 font-semibold mt-1">
                            ₦
                            {Number(
                              order.totalPrice ||
                                product?.price ||
                                0
                            ).toLocaleString()}
                            {order.quantity > 1 && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                · Qty {order.quantity}
                              </span>
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${statusStyle(
                            order.status
                          )}`}
                        >
                          {statusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>

                      {/* Other person */}
                      <div className="flex items-center gap-2 mt-3">
                        <img
                          src={otherPerson?.profileImage || studySpher}
                          alt={otherPerson?.full_name || "User"}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <p className="text-xs text-gray-500">
                          {tab === "buying" ? "Seller" : "Buyer"}:{" "}
                          <span className="font-semibold text-gray-700">
                            {otherPerson?.full_name || "Student"}
                          </span>
                        </p>
                      </div>

                      {order.meetupNote && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <MapPin size={12} />
                          {order.meetupNote}
                        </p>
                      )}

                      <p className="text-[11px] text-gray-400 mt-2">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : ""}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {/* Chat - always available for pending/completed */}
                        {order.status !== "cancelled" && (
                          <button
                            onClick={() => openChat(order)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                          >
                            <MessageCircle size={16} />
                            Chat
                          </button>
                        )}

                        {/* Seller actions */}
                        {tab === "selling" && order.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateOrderStatus(order._id, "completed")
                              }
                              disabled={updatingId === order._id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition disabled:opacity-60"
                            >
                              <CheckCircle2 size={16} />
                              Mark Completed
                            </button>

                            <button
                              onClick={() =>
                                updateOrderStatus(order._id, "cancelled")
                              }
                              disabled={updatingId === order._id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-60"
                            >
                              <XCircle size={16} />
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Buyer can cancel pending */}
                        {tab === "buying" && order.status === "pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "cancelled")
                            }
                            disabled={updatingId === order._id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <MarketFooter />
    </div>
  );
}