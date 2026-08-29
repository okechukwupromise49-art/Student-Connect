import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Minus,
  Plus,
  MapPin,
  GraduationCap,
  MessageCircle,
  Store,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { MarketHeader } from "./MarketHeader";
import { MarketFooter } from "./MarketFooter";
import { PageLoader } from "./Loader";

export default function MarketItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Item
        const itemRes = await axios.get(
          `${API_URL}/api/market/item/${id}`,
          { withCredentials: true }
        );
        setItem(itemRes.data);

        // Current user (to hide buy on own item)
        try {
          const userRes = await axios.get(
            `${API_URL}/api/register/details`,
            { withCredentials: true }
          );
          setCurrentUser(userRes.data);
        } catch {
          setCurrentUser(null);
        }

        // Cart count
        try {
          const cartRes = await axios.get(`${API_URL}/api/market/cart`, {
            withCredentials: true,
          });
          const count = (cartRes.data?.items || []).reduce(
            (s, i) => s + (i.quantity || 0),
            0
          );
          setCartCount(count);
        } catch {
          setCartCount(0);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Item not found");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  const stock = item?.quantity ?? 0;
  const isOwner =
    currentUser &&
    item?.author &&
    currentUser._id?.toString() === item.author._id?.toString();

  const increaseQty = () => {
    if (qty >= stock) {
      toast.info(`Only ${stock} left`);
      return;
    }
    setQty((q) => q + 1);
  };

  const decreaseQty = () => {
    if (qty <= 1) return;
    setQty((q) => q - 1);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!item) return;

    try {
      setAdding(true);
      const res = await axios.post(
        `${API_URL}/api/market/cart/add`,
        { productId: item._id, quantity: qty },
        { withCredentials: true }
      );

      const count = (res.data.cart?.items || []).reduce(
        (s, i) => s + (i.quantity || 0),
        0
      );
      setCartCount(count);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  // Buy now → create order (POD)
  const handleBuyNow = async () => {
    if (!item) return;

    try {
      setBuying(true);
      await axios.post(
        `${API_URL}/api/market/orders/buy-now`,
        {
          productId: item._id,
          quantity: qty,
          paymentMethod: "pod",
          meetupNote: "",
        },
        { withCredentials: true }
      );

      toast.success("Order placed. You can chat with the seller.");
      navigate("/market/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!item) return null;

  const images = item.files?.length
    ? item.files
    : [{ url: null, type: "image" }];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader cartCount={cartCount} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/market")}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to Market
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ================= IMAGES ================= */}
          <div>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="aspect-square bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                {images[activeImage]?.url ? (
                  <img
                    src={images[activeImage].url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="text-indigo-200" size={80} />
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                      activeImage === index
                        ? "border-indigo-600"
                        : "border-gray-100"
                    }`}
                  >
                    {file.url ? (
                      <img
                        src={file.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= DETAILS ================= */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-3">
              {item.category || "Other"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {item.title}
            </h1>

            <p className="text-3xl font-bold text-indigo-600 mt-4">
              {Number(item.price) === 0
                ? "Free"
                : `₦${Number(item.price).toLocaleString()}`}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <span
                className={`text-sm font-semibold ${
                  stock <= 3 ? "text-amber-600" : "text-gray-600"
                }`}
              >
                {stock > 0 ? `${stock} in stock` : "Sold out"}
              </span>
              {stock > 0 && stock <= 3 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                  Low stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {item.description || "No description provided."}
              </p>
            </div>

            {/* Seller */}
            <div
              onClick={() =>
                item.author?._id &&
                navigate(`/profile/${item.author._id}`)
              }
              className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition"
            >
              <img
                src={item.author?.profileImage || studySpher}
                alt={item.author?.full_name || "Seller"}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">Seller</p>
                <p className="font-semibold text-gray-900 truncate">
                  {item.author?.full_name || "Student"}
                </p>
                {(item.author?.department || item.author?.institution) && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <GraduationCap size={12} />
                    {item.author?.department}
                    {item.author?.institution
                      ? ` · ${item.author.institution}`
                      : ""}
                  </p>
                )}
              </div>
              <Store size={18} className="text-gray-400" />
            </div>

            {/* Qty + Actions (only if not owner and in stock) */}
            {!isOwner && stock > 0 && (
              <div className="mt-8 space-y-4">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Quantity
                  </span>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                    <button
                      onClick={decreaseQty}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900">
                      {qty}
                    </span>
                    <button
                      onClick={increaseQty}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition disabled:opacity-60"
                  >
                    <ShoppingCart size={18} />
                    {adding ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={buying}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition disabled:opacity-60"
                  >
                    <MessageCircle size={18} />
                    {buying ? "Placing order..." : "Buy now (Pay on delivery)"}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Payment on delivery · Chat opens after you place the order
                </p>
              </div>
            )}

            {isOwner && (
              <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                This is your listing. You can’t buy your own item.
              </div>
            )}

            {stock <= 0 && !isOwner && (
              <div className="mt-8 p-4 rounded-2xl bg-gray-100 text-sm text-gray-600 text-center font-medium">
                This item is sold out
              </div>
            )}
          </div>
        </div>
      </main>

      <MarketFooter cartCount={cartCount} />
    </div>
  );
}