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
  Image as ImageIcon,
  Trash2,
  Flag,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";
import { UpdateFooter } from "../component/UpdateFooter";

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

const REPORT_REASONS = [
  { value: "incorrect", label: "Incorrect information" },
  { value: "outdated", label: "Outdated information" },
  { value: "spam", label: "Spam" },
  { value: "misleading", label: "Misleading information" },
  { value: "other", label: "Other" },
];

export default function Updates() {
  const navigate = useNavigate();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [reportingUpdate, setReportingUpdate] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  // ===============================
  // CURRENT USER (API first)
  // ===============================
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/register/details`, {
          withCredentials: true,
        });
        setCurrentUser(res.data);
      } catch (error) {
        try {
          const stored = localStorage.getItem("user");
          if (stored) setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      }
    };

    fetchMe();
  }, []);

  // ===============================
  // FETCH UPDATES
  // ===============================
  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/updates`, {
        withCredentials: true,
      });
      setUpdates(res.data || []);
    } catch (error) {
      console.error("Fetch updates error:", error);
      setUpdates([]);
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // ===============================
  // IS OWNER?
  // ===============================
  const isOwner = (item) => {
    if (!currentUser || !item?.author) return false;

    const myId = (
      currentUser._id ||
      currentUser.id ||
      currentUser.userId
    )?.toString();

    const authorId = (
      item.author._id ||
      item.author.id ||
      item.author
    )?.toString();

    return Boolean(myId && authorId && myId === authorId);
  };

  // ===============================
  // DELETE YOUR POST
  // ===============================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete your post? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await axios.delete(`${API_URL}/api/updates/${id}`, {
        withCredentials: true,
      });

      setUpdates((prev) => prev.filter((item) => item._id !== id));
      toast.success("Your post was deleted");
    } catch (error) {
      console.error("Delete update error:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete post"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===============================
  // REPORT
  // ===============================
  const openReportModal = (item) => {
    setReportingUpdate(item);
    setReportReason("");
    setReportDescription("");
  };

  const closeReportModal = () => {
    if (reportLoading) return;
    setReportingUpdate(null);
    setReportReason("");
    setReportDescription("");
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    if (!reportingUpdate?._id) return;

    try {
      setReportLoading(true);

      await axios.post(
        `${API_URL}/api/update-reports/${reportingUpdate._id}`,
        {
          reason: reportReason,
          description: reportDescription.trim(),
        },
        { withCredentials: true }
      );

      toast.success("Report submitted. An admin will review it.");
      closeReportModal();
    } catch (error) {
      console.error("Report update error:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit report"
      );
    } finally {
      setReportLoading(false);
    }
  };

  // ===============================
  // FILTER
  // ===============================
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

  const getImageUrl = (item) =>
    item.image || item.imageUrl || item.files?.[0]?.url || null;

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      {/* HEADER */}
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
        {/* SEARCH */}
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

        {/* CATEGORIES */}
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

        {/* LIST */}
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
            {filtered.map((item) => {
              const imageUrl = getImageUrl(item);
              const owner = isOwner(item);

              console.log({
              myId: currentUser?._id || currentUser?.id,
              author: item.author,
              authorId: item.author?._id || item.author,
              owner: isOwner(item),
            });

              return (
                <article
                  key={item._id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(imageUrl)}
                      className="block w-full"
                    >
                      <div className="relative w-full aspect-[16/10] bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                          categoryStyle[item.category] ||
                          categoryStyle.general
                        }`}
                      >
                        {item.category}
                      </span>

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {imageUrl && (
                          <span className="text-gray-300 p-1">
                            <ImageIcon size={14} />
                          </span>
                        )}

                        {item.pinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 px-1">
                            <Pin size={12} />
                            Pinned
                          </span>
                        )}

                        {/* DELETE YOUR POST */}
                        {owner && (
                          <button
                            type="button"
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {deletingId === item._id
                              ? "Deleting..."
                              : "Delete your post"}
                          </button>
                        )}

                        {/* REPORT */}
                        {!owner && (
                          <button
                            type="button"
                            onClick={() => openReportModal(item)}
                            className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition"
                            title="Report update"
                          >
                            <Flag size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 leading-snug">
                      {item.title}
                    </h2>

                    {item.body && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>
                    )}

                    {/* Extra delete row for owners */}
                    {owner && (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={deletingId === item._id}
                          onClick={() => handleDelete(item._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-100 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {deletingId === item._id
                            ? "Deleting..."
                            : "Delete your post"}
                        </button>
                      </div>
                    )}

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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <img
            src={previewImage}
            alt="Update"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* REPORT MODAL */}
      {reportingUpdate && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeReportModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Report Update
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Help us review incorrect information.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportLoading}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Why are you reporting this?
              </p>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      reportReason === reason.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.value}
                      checked={reportReason === reason.value}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Tell us more (optional)..."
                maxLength={500}
                rows={4}
                className="w-full mt-4 p-3 rounded-xl border border-gray-200 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportLoading}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReport}
                disabled={reportLoading || !reportReason}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <UpdateFooter />
    </div>
  );
}