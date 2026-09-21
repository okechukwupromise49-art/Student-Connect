import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  GraduationCap,
  Award,
  Briefcase,
  Newspaper,
  Megaphone,
  Plus,
  Clock,
  Pin,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "./Loader";

const CATEGORIES = [
  { id: "all", label: "All", icon: Megaphone },
  { id: "school", label: "School", icon: GraduationCap },
  { id: "scholarship", label: "Scholarship", icon: Award },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "news", label: "News", icon: Newspaper },
  { id: "general", label: "General", icon: Megaphone },
];

const categoryStyle = {
  school: "bg-blue-50 text-blue-700",
  scholarship: "bg-amber-50 text-amber-700",
  career: "bg-emerald-50 text-emerald-700",
  news: "bg-violet-50 text-violet-700",
  general: "bg-gray-100 text-gray-700",
};

export default function Updates() {
  const navigate = useNavigate();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/updates`, {
          withCredentials: true,
        });
        setUpdates(res.data || []);
      } catch (error) {
        console.error(error);
        // Demo data if API not ready
        setUpdates([
          {
            _id: "1",
            title: "UniAbuja Scholarship Portal Now Open",
            body: "Applications for the 2026 merit scholarship are open. Deadline is October 15.",
            category: "scholarship",
            pinned: true,
            author: { full_name: "Admin", profileImage: null },
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            title: "Faculty of Science Mid-Semester Break",
            body: "Classes resume on Monday. Submit all practical reports before Friday.",
            category: "school",
            pinned: false,
            author: { full_name: "Dean Office", profileImage: null },
            createdAt: new Date().toISOString(),
          },
          {
            _id: "3",
            title: "Internship Opportunities – MTN & Andela",
            body: "Campus career office is collecting CVs for tech internships. Drop yours at the career center.",
            category: "career",
            pinned: false,
            author: { full_name: "Career Unit", profileImage: null },
            createdAt: new Date().toISOString(),
          },
          {
            _id: "4",
            title: "Student Union Election Results",
            body: "Official results will be posted on the notice board and here tomorrow.",
            category: "news",
            pinned: false,
            author: { full_name: "SUG", profileImage: null },
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  const filtered = updates
    .filter((u) => {
      const matchCat = category === "all" || u.category === category;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.title?.toLowerCase().includes(q) ||
        u.body?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Campus Updates</h1>
            <p className="text-xs text-gray-500">
              School · Scholarships · Career · News
            </p>
          </div>

          {/* Optional: only for admin later */}
          <button
            onClick={() => navigate("/updates/create")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Post</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search updates..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Megaphone className="text-indigo-400" size={28} />
            </div>
            <h3 className="font-bold text-gray-900">No updates yet</h3>
            <p className="text-sm text-gray-500 mt-2">
              Check back for school, scholarship, and career news.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <article
                key={item._id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                      categoryStyle[item.category] || categoryStyle.general
                    }`}
                  >
                    {item.category}
                  </span>

                  {item.pinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <Pin size={12} />
                      Pinned
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  {item.title}
                </h2>

                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">
                  {item.body}
                </p>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                  <img
                    src={item.author?.profileImage || studySpher}
                    alt={item.author?.full_name || "Admin"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {item.author?.full_name || "Campus Admin"}
                    </p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}