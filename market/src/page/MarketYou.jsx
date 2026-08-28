import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Edit3,
  Package,
  ShoppingBag,
  TrendingUp,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
  Plus,
  Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { MarketHeader } from "../component/MarketHeader";
import { MarketFooter } from "../component/MarketFooter";
import { PageLoader } from "../component/Loader";

export default function MarketYou() {
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [stats, setStats] = useState({
    listings: 0,
    active: 0,
    sold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Seller profile
        const sellerRes = await axios.get(
          `${API_URL}/api/market/marketUser`,
          { withCredentials: true }
        );
        setSeller(sellerRes.data);

        // My listings
        const itemsRes = await axios.get(
          `${API_URL}/api/market/my-items`,
          { withCredentials: true }
        );
        const list = itemsRes.data || [];
        setMyItems(list);

        setStats({
          listings: list.length,
          active: list.filter((i) => (i.quantity ?? 0) > 0).length,
          sold: list.filter((i) => (i.quantity ?? 0) === 0).length,
        });

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
      } catch (err) {
        // Not registered as seller
        if (err.response?.status === 404) {
          setSeller(null);
        } else {
          console.error(err);
          toast.error("Failed to load seller profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  // Not a seller yet
  if (!seller) {
    return (
      <div className="min-h-screen bg-slate-50 pb-28">
        <MarketHeader cartCount={cartCount} />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-100 flex items-center justify-center">
            <Store size={36} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Become a Seller
          </h1>
          <p className="text-gray-500 mb-8">
            Register to list study materials, gadgets, clothes, and more.
          </p>
          <button
            onClick={() => navigate("/market/reg")}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200"
          >
            Register as Seller
          </button>
          <button
            onClick={() => navigate("/market")}
            className="w-full mt-3 py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl"
          >
            Back to Market
          </button>
        </main>
        <MarketFooter cartCount={cartCount} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader cartCount={cartCount} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <img
                src={seller.profileImage || studySpher}
                alt={seller.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
              />

              <div className="flex-1 sm:pb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {seller.full_name}
                </h1>
                <p className="text-sm text-gray-500">
                  {seller.department} · {seller.university || seller.institution}
                </p>
              </div>

              <button
                onClick={() => navigate("/market/reg")}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Edit3 size={16} />
                Edit Seller Profile
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-xl font-bold text-gray-900">
                  {stats.listings}
                </p>
                <p className="text-xs text-gray-500 mt-1">Listings</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Active</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-xl font-bold text-gray-900">{stats.sold}</p>
                <p className="text-xs text-gray-500 mt-1">Sold out</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm mb-6 space-y-3">
          <h2 className="font-semibold text-gray-900 mb-1">Seller info</h2>

          {seller.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              {seller.email}
            </div>
          )}
          {seller.phone_number && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} className="text-gray-400" />
              {seller.phone_number}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap size={16} className="text-gray-400" />
            {seller.department} · {seller.university}
          </div>
          {seller.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              {seller.address}
            </div>
          )}
        </div>

        {/* My listings */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Listings</h2>
          <button
            onClick={() => navigate("/market/sell")}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600"
          >
            <Plus size={16} />
            Add new
          </button>
        </div>

        {myItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <p className="text-gray-500">No listings yet</p>
            <button
              onClick={() => navigate("/market/sell")}
              className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              Create your first listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <div className="h-36 bg-gray-50">
                  {item.files?.[0]?.url ? (
                    <img
                      src={item.files[0].url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="text-gray-300" size={36} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <span className="text-sm font-bold text-indigo-600 shrink-0">
                      ₦{Number(item.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {item.category} · Stock: {item.quantity ?? 0}
                  </p>
                  <button
                    onClick={() => navigate(`/market/item/${item._id}`)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MarketFooter cartCount={cartCount} />
    </div>
  );
}