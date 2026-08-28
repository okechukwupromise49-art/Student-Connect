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
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/market/cart`, {
        withCredentials: true,
      });
      setCart(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (productId, quantity) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/market/cart/update/${productId}`,
        { quantity },
        { withCredentials: true }
      );
      setCart(res.data.cart);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const removeItem = async (productId) => {
    try {
      const res = await axios.delete(
        `${API_URL}/api/market/cart/remove/${productId}`,
        { withCredentials: true }
      );
      setCart(res.data.cart);
      toast.success("Removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/market/cart/clear`, {
        withCredentials: true,
      });
      setCart(res.data.cart);
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setLoadingCheckout(true);

      for (const item of cart.items) {
        await axios.post(
          `${API_URL}/api/market/buy/${item.product._id}`,
          { quantity: item.quantity },
          { withCredentials: true }
        );
      }

      await axios.delete(`${API_URL}/api/market/cart/clear`, {
        withCredentials: true,
      });

      toast.success("Purchase successful 🎉");
      navigate("/market");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Checkout failed"
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  const items = cart?.items || [];

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product?.price || 0) * item.quantity;
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader cartCount={totalItems} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/market")}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                My Cart
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="text-indigo-500" size={34} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mt-2 text-sm">
              Browse the market and add items you want to buy.
            </p>
            <button
              onClick={() => navigate("/market")}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
            >
              <ShoppingCart size={18} />
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-sm flex gap-4"
                  >
                    <div
                      onClick={() =>
                        navigate(`/market/item/${product._id}`)
                      }
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
                    >
                      {product.files?.[0]?.url ? (
                        <img
                          src={product.files[0].url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag
                            className="text-gray-300"
                            size={28}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 capitalize">
                            {product.category}
                          </p>
                          <p className="text-sm font-bold text-indigo-600 mt-2">
                            ₦{Number(product.price || 0).toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(product._id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                          <button
                            onClick={() =>
                              updateQty(
                                product._id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="w-8 text-center text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQty(product._id, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-gray-900">
                          ₦
                          {(
                            Number(product.price || 0) * item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
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
                  className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-60"
                >
                  {loadingCheckout ? "Processing..." : "Checkout"}
                </button>

                <button
                  onClick={() => navigate("/market")}
                  className="mt-3 w-full py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold"
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