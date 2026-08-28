import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import API_URL from "../Api";
import { MarketHeader } from "./MarketHeader";
import { MarketFooter } from "./MarketFooter";

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("market_cart")) || [];
    } catch {
      return [];
    }
  });

  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem("market_cart", JSON.stringify(cart));
  }, [cart]);

  const updateQty = (id, newQty) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item;

        const stock = item.stock ?? item.quantity ?? 1;
        const qty = Math.max(1, Math.min(Number(newQty), stock));

        return { ...item, cartQty: qty };
      })
    );
  };

  const increaseQty = (item) => {
    const stock = item.stock ?? item.quantity ?? 1;

    if ((item.cartQty || 1) >= stock) {
      toast.info(`Only ${stock} left in stock`);
      return;
    }

    updateQty(item._id, (item.cartQty || 1) + 1);
  };

  const decreaseQty = (item) => {
    if ((item.cartQty || 1) <= 1) {
      removeItem(item._id);
      return;
    }

    updateQty(item._id, (item.cartQty || 1) - 1);
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
    toast.success("Removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.cartQty || 1),
    0
  );

  const totalItems = cart.reduce(
    (sum, item) => sum + (item.cartQty || 1),
    0
  );

  // Checkout using your buy API
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setLoadingCheckout(true);

      for (const item of cart) {
        await axios.post(
          `${API_URL}/api/market/buy/${item._id}`,
          { quantity: item.cartQty || 1 },
          { withCredentials: true }
        );
      }

      setCart([]);
      localStorage.removeItem("market_cart");
      toast.success("Purchase successful 🎉");
      navigate("/market");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Checkout failed. Try again."
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader cartCount={totalItems} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/market")}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                My Cart
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Empty state */}
        {cart.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="text-indigo-500" size={34} />
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              Your cart is empty
            </h3>

            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
              Browse the market and add items you want to buy.
            </p>

            <button
              onClick={() => navigate("/market")}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
            >
              <ShoppingCart size={18} />
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-sm flex gap-4"
                >
                  {/* Image */}
                  <div
                    onClick={() => navigate(`/market/item/${item._id}`)}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="text-gray-300" size={28} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          onClick={() => navigate(`/market/item/${item._id}`)}
                          className="font-bold text-gray-900 line-clamp-2 cursor-pointer hover:text-indigo-600 transition"
                        >
                          {item.title}
                        </h3>

                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          {item.category || "Item"}
                        </p>

                        <p className="text-sm font-bold text-indigo-600 mt-2">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Quantity controls */}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                        <button
                          onClick={() => decreaseQty(item)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-8 text-center text-sm font-bold text-gray-800">
                          {item.cartQty || 1}
                        </span>

                        <button
                          onClick={() => increaseQty(item)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-gray-900">
                        ₦
                        {(
                          Number(item.price || 0) * (item.cartQty || 1)
                        ).toLocaleString()}
                      </p>
                    </div>

                    {(item.stock ?? 1) <= 3 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-2">
                        Only {item.stock} left in stock
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-5">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({totalItems})</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Service fee</span>
                    <span>₦0</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-60"
                >
                  {loadingCheckout ? "Processing..." : "Checkout"}
                </button>

                <button
                  onClick={() => navigate("/market")}
                  className="mt-3 w-full py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketFooter cartCount={totalItems} />
    </div>
  );
}