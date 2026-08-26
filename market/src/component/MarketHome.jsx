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
  ArrowRight,
  Store,
  Sparkles,
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
  const [marketUser, setMarketUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const categories = [
    {
      id: "all",
      label: "All",
      icon: ShoppingBag,
    },
    {
      id: "notes",
      label: "Notes",
      icon: FileText,
    },
    {
      id: "pdf",
      label: "PDFs",
      icon: BookOpen,
    },
    {
      id: "video",
      label: "Videos",
      icon: Video,
    },
    {
      id: "course",
      label: "Courses",
      icon: BookOpen,
    },
  ];

  // =========================
  // FETCH MARKET DATA
  // =========================
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        const [itemsResponse, userResponse] = await Promise.all([
          axios.get(`${API_URL}/api/market/items`, {
            withCredentials: true,
          }),

          axios.get(`${API_URL}/api/market/marketUser`, {
            withCredentials: true,
          }),
        ]);

        setItems(itemsResponse.data || []);
        setMarketUser(userResponse.data || null);
      } catch (error) {
        console.error("❌ MARKET HOME ERROR:", error);

        // If seller profile doesn't exist, that's okay.
        if (error.response?.status === 404) {
          setMarketUser(null);
        }

        // Still try to load items if seller profile is missing
        try {
          const itemsResponse = await axios.get(
            `${API_URL}/api/market/items`,
            {
              withCredentials: true,
            }
          );

          setItems(itemsResponse.data || []);
        } catch (itemsError) {
          console.error("❌ ITEMS ERROR:", itemsError);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // =========================
  // FILTER + SORT
  // =========================
  const filteredItems = items
    .filter((item) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.subject?.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || item.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "price-low") {
        return (a.price || 0) - (b.price || 0);
      }

      if (sort === "price-high") {
        return (b.price || 0) - (a.price || 0);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <MarketHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* =========================
            HERO
        ========================== */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 lg:p-10 mb-8 shadow-xl shadow-indigo-200/50">

          {/* Background decorations */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Hero content */}
            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-100 text-xs sm:text-sm font-medium mb-4">
                <Sparkles size={14} />
                Student Marketplace
              </div>

              {marketUser ? (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    Welcome back,
                    <span className="block text-indigo-100">
                      {marketUser.full_name?.split(" ")[0] || "Seller"} 👋
                    </span>
                  </h1>

                  <p className="text-indigo-100 mt-4 text-sm sm:text-base leading-relaxed max-w-xl">
                    You're officially a Student Market seller. Start listing
                    your notes, PDFs, gadgets, courses and other useful
                    resources for students.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    Learn.
                    <span className="text-indigo-100"> Share.</span>
                    <span className="block">Earn.</span>
                  </h1>

                  <p className="text-indigo-100 mt-4 text-sm sm:text-base leading-relaxed max-w-xl">
                    Discover notes, PDFs, past questions, gadgets, courses and
                    other useful resources from students like you.
                  </p>
                </>
              )}
            </div>

            {/* Hero action */}
            <div className="shrink-0">

              {marketUser ? (
                <button
                  onClick={() => navigate("/market/sell")}
                  className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Store size={20} />

                  <span>Sell an Item</span>

                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/market/reg")}
                  className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Plus size={20} />

                  <span>Become a Seller</span>

                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =========================
            SEARCH + FILTERS
        ========================== */}
        <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-5 mb-8">

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
                placeholder="Search notes, PDFs, courses, subjects..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter
                size={18}
                className="text-gray-400 shrink-0"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full lg:w-auto px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              >
                <option value="newest">Newest</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;

              const active = category === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
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
        </section>

        {/* =========================
            RESULTS HEADER
        ========================== */}
        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {category === "all"
                ? "Explore Marketplace"
                : categories.find((c) => c.id === category)?.label}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Discover useful resources from students
            </p>
          </div>

          <div className="px-3 py-1.5 bg-gray-100 rounded-full">
            <p className="text-xs sm:text-sm font-semibold text-gray-600">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* =========================
            CONTENT
        ========================== */}
        {loading ? (
          <PageLoader />
        ) : filteredItems.length === 0 ? (

          /* Empty State */
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 sm:p-16 text-center shadow-sm">

            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-50 flex items-center justify-center">
              <ShoppingBag
                className="text-indigo-500"
                size={34}
              />
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              No items found
            </h3>

            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
              We couldn't find anything matching your search.
              Try another keyword or category.
            </p>

            {marketUser && (
              <button
                onClick={() => navigate("/market/sell")}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                Sell an Item
              </button>
            )}
          </div>

        ) : (

          /* Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {filteredItems.map((item) => (

              <article
                key={item._id}
                onClick={() =>
                  navigate(`/market/item/${item._id}`)
                }
                className="group bg-white rounded-[1.75rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >

                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 overflow-hidden">

                  {item.thumbnail || item.files?.[0]?.url ? (
                    <img
                      src={
                        item.thumbnail ||
                        item.files[0].url
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText
                        className="text-indigo-300"
                        size={52}
                      />
                    </div>
                  )}

                  {/* Category */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold text-indigo-700 uppercase tracking-wide shadow-sm">
                      {item.category || "Material"}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-sm font-bold text-indigo-700 shadow-sm">
                      {item.price === 0 || item.isFree
                        ? "Free"
                        : `₦${Number(
                            item.price
                          ).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">

                  <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Seller */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">

                    <img
                      src={
                        item.seller?.profileImage ||
                        studySpher
                      }
                      alt={
                        item.seller?.full_name ||
                        "Student"
                      }
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                    />

                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">
                        Seller
                      </p>

                      <p className="text-xs font-semibold text-gray-600 truncate">
                        {item.seller?.full_name ||
                          "Student"}
                      </p>
                    </div>

                    {item.rating > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <Star
                          size={13}
                          fill="currentColor"
                        />
                        {Number(item.rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <MarketFooter />
    </div>
  );
}