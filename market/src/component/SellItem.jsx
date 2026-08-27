import React, { useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Tag,
  FileText,
  BookOpen,
  Smartphone,
  Shirt,
  Sparkles,
  Package,
  X,
  ArrowLeft,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";

export function SellItem() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    quantity: "1",
    description: "",
  });

  const [files, setFiles] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // preview urls
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: "study", label: "Study Materials", icon: BookOpen },
    { value: "electronics", label: "Electronics", icon: Smartphone },
    { value: "fashion", label: "Fashion", icon: Shirt },
    { value: "beauty", label: "Beauty", icon: Sparkles },
    { value: "other", label: "Other", icon: Package },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [
      ...prev,
      ...selected.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (formData.price === "" || Number(formData.price) < 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("category", formData.category);
      data.append("price", formData.price);
      data.append("quantity", formData.quantity);
      data.append("description", formData.description.trim());

      files.forEach((file) => {
        data.append("files", file);
      });

      await axios.post(`${API_URL}/api/market/item`, data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Item listed successfully");
      navigate("/market");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to publish item"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/market")}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft size={19} />
            <span className="hidden sm:block">Back to Market</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Tag size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Sell on Market</span>
          </div>

          <div className="w-20 sm:w-28" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Heading */}
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold mb-4">
            <CheckCircle2 size={14} />
            Seller Dashboard
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            List a new item
          </h1>

          <p className="text-gray-500 mt-2 leading-relaxed">
            Sell notes, power banks, phones, clothes, perfume, or anything
            useful to students on campus.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT — FORM */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-7">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    Item images
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add clear photos so buyers know exactly what they’re getting.
                  </p>
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {previews.map((src, index) => (
                      <div
                        key={index}
                        className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-32"
                      >
                        <img
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  htmlFor="item-image"
                  className="group flex flex-col items-center justify-center min-h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload size={22} />
                  </div>
                  <p className="font-semibold text-gray-800">Upload images</p>
                  <p className="text-sm text-gray-400 mt-1">
                    PNG, JPG, WEBP (multiple allowed)
                  </p>
                  <input
                    id="item-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </section>

              {/* Item info */}
              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Item information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tell buyers what you’re selling.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Item title
                    </label>
                    <div className="relative">
                      <FileText
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Oraimo Power Bank 20,000mAh"
                        required
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>

                  {/* Category + Price + Quantity */}
                  <div className="grid sm:grid-cols-3 gap-5">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <BookOpen
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="w-full appearance-none pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price (₦)
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0"
                        required
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Enter 0 if free
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="relative">
                        <Hash
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="1"
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Auto-removed when sold out
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Condition, features, what buyers should know..."
                      rows={6}
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none resize-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  "Publishing..."
                ) : (
                  <>
                    <Upload size={19} />
                    Publish Item
                  </>
                )}
              </button>
            </div>

            {/* RIGHT — PREVIEW */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="mb-3">
                  <h2 className="font-bold text-gray-900">Preview</h2>
                  <p className="text-sm text-gray-500">
                    How your item may appear in the market
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="h-48 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 flex items-center justify-center relative">
                    {previews[0] ? (
                      <img
                        src={previews[0]}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={48} className="text-indigo-200" />
                    )}

                    {formData.category && (
                      <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/90 text-[11px] font-bold uppercase text-indigo-700">
                        {formData.category}
                      </span>
                    )}

                    {formData.price !== "" && (
                      <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 text-sm font-bold text-indigo-700 shadow-sm">
                        {Number(formData.price) === 0
                          ? "Free"
                          : `₦${Number(formData.price).toLocaleString()}`}
                      </span>
                    )}

                    {Number(formData.quantity) > 0 &&
                      Number(formData.quantity) <= 3 && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold">
                          Only {formData.quantity} left
                        </span>
                      )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 line-clamp-2">
                      {formData.title || "Your item title"}
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                      {formData.description ||
                        "Your item description will appear here..."}
                    </p>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Tag size={15} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400">Seller</p>
                          <p className="text-xs font-semibold text-gray-700">
                            You
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">Stock</p>
                        <p className="text-xs font-bold text-gray-700">
                          {formData.quantity || 1}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-5 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                    <Sparkles size={16} />
                    Tips for sellers
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-indigo-600 leading-relaxed">
                    <li>• Use a clear, honest title</li>
                    <li>• Add real photos of the item</li>
                    <li>• Set quantity correctly</li>
                    <li>• Item auto-removes when sold out</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}