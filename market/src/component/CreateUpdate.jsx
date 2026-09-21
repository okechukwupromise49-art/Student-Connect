import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Send,
  GraduationCap,
  Award,
  Briefcase,
  Newspaper,
  Megaphone,
  Pin,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";

const CATEGORIES = [
  { id: "school", label: "School", icon: GraduationCap },
  { id: "scholarship", label: "Scholarship", icon: Award },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "news", label: "News", icon: Newspaper },
  { id: "general", label: "General", icon: Megaphone },
];

export default function CreateUpdate() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [pinned, setPinned] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!body.trim() && !image) {
      toast.error("Add some text or an image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      formData.append("category", category);
      formData.append("pinned", pinned);

      if (image) {
        formData.append("image", image);
      }

      await axios.post(`${API_URL}/api/updates`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Update posted successfully");
      navigate("/updates");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to post update"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/updates")}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-lg font-bold text-gray-900">Create Update</h1>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            <Send size={16} />
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
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

          {/* Title */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scholarship portal now open"
              required
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
            />
          </section>

          {/* Body text */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Details
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full update here..."
              rows={6}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
            />
            <p className="text-xs text-gray-400 mt-2">
              You can post text only, image only, or both.
            </p>
          </section>

          {/* Image upload */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Image (optional)
            </label>

            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-72 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="group flex flex-col items-center justify-center min-h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="font-semibold text-gray-800">Upload image</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG or WEBP</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </section>

          {/* Pin */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-600"
              />
              <div className="flex items-center gap-2">
                <Pin size={18} className="text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Pin this update
                  </p>
                  <p className="text-xs text-gray-400">
                    Show at the top of the list
                  </p>
                </div>
              </div>
            </label>
          </section>

          {/* Preview card */}
          {(title || body || preview) && (
            <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Preview
                </p>
              </div>

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full aspect-[16/10] object-cover"
                />
              )}

              <div className="p-5">
                <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase mb-2">
                  {category}
                </span>
                <h3 className="font-bold text-gray-900">
                  {title || "Your title"}
                </h3>
                {body && (
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                    {body}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Submit mobile */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 disabled:opacity-60"
          >
            {loading ? (
              "Posting..."
            ) : (
              <>
                <Send size={18} />
                Publish Update
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}