import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Plus,
  Star,
  Filter,
  BookOpen,
  FileText,
  Video,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import { MarketHeader } from "./MarketHeader";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "./Loader";
import { MarketFooter } from "./MarketFooter";

export default function MarketHome() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const categories = [
    { id: "all", label: "All", icon: ShoppingBag },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "pdf", label: "PDFs", icon: BookOpen },
    { id: "video", label: "Videos", icon: Video },
    { id: "course", label: "Courses", icon: BookOpen },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/market/items`, {
          withCredentials: true,
        });
        setItems(res.data || []);
      } catch (error) {
        console.error(error);
        // keep empty for now if API not ready
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.subject?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "all" || item.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "price-low") return (a.price || 0) - (b.price || 0);
      if (sort === "price-high") return (b.price || 0) - (a.price || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-28">
      <MarketHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* Hero / Seller CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 sm:p-8 mb-8 shadow-xl shadow-indigo-200">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Educational Marketplace
              </h1>
              <p className="text-indigo-100 mt-2 max-w-xl">
                Buy and sell notes, PDFs, past questions, and video courses from
                students like you.
              </p>
            </div>

            <button
              onClick={() => navigate("/market/sell")}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-indigo-700 font-semibold rounded-2xl hover:bg-indigo-50 transition-all shadow-lg"
            >
              <Plus size={20} />
              Start Selling
            </button>
          </div>

          {/* soft decoration */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes, courses, subjects..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    category === cat.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {category === "all" ? "All Items" : categories.find(c => c.id === category)?.label}
          </h2>
          <p className="text-sm text-gray-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <PageLoader/>
        ) : filteredItems.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="text-indigo-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No items found
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Be the first to list study materials, notes, or courses.
            </p>
            <button
              onClick={() => navigate("/market/sell")}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
            >
              Sell an Item
            </button>
          </div>
        ) : (
          /* Items grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/market/item/${item._id}`)}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
                  {item.thumbnail || item.files?.[0]?.url ? (
                    <img
                      src={item.thumbnail || item.files[0].url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="text-indigo-300" size={48} />
                    </div>
                  )}

                  {/* Price badge */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-sm font-bold text-indigo-700 shadow-sm">
                    {item.price === 0 || item.isFree
                      ? "Free"
                      : `₦${Number(item.price).toLocaleString()}`}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                    {item.category || "Material"}
                  </p>

                  <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Seller */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    <img
                      src={item.seller?.profileImage || studySpher}
                      alt={item.seller?.full_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs text-gray-500 truncate">
                      {item.seller?.full_name || "Student"}
                    </span>

                    {item.rating > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-xs text-amber-500">
                        <Star size={12} fill="currentColor" />
                        {item.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MarketFooter/>
    </div>
  );
}