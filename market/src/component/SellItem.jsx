
import React, { useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Tag,
  DollarSign,
  FileText,
  BookOpen,
  Video,
  X,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SellItem() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Backend connection will go here

      console.log("FORM DATA:", formData);
      console.log("IMAGE:", image);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">

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

            <span className="font-bold text-gray-900">
              Sell on Market
            </span>
          </div>

          <div className="w-20 sm:w-28" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Page heading */}
        <div className="max-w-2xl mb-8">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold mb-4">
            <CheckCircle2 size={14} />
            Seller Dashboard
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            List a new item
          </h1>

          <p className="text-gray-500 mt-2 leading-relaxed">
            Share your study materials, notes, PDFs, courses, gadgets,
            and other useful resources with students.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* =========================
                LEFT — FORM
            ========================== */}
            <div className="lg:col-span-2 space-y-6">

              {/* Image Upload */}
              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-7">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    Item image
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Add a clear image so students know what they're buying.
                  </p>
                </div>

                {preview ? (

                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">

                    <img
                      src={preview}
                      alt="Item preview"
                      className="w-full h-64 sm:h-80 object-cover"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
                    >
                      <X size={18} />
                    </button>

                  </div>

                ) : (

                  <label
                    htmlFor="item-image"
                    className="group flex flex-col items-center justify-center min-h-64 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer"
                  >

                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Upload size={25} />
                    </div>

                    <p className="font-semibold text-gray-800">
                      Upload item image
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                      PNG, JPG or WEBP
                    </p>

                    <span className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm">
                      Choose image
                    </span>

                    <input
                      id="item-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                  </label>
                )}
              </section>

              {/* Basic Information */}
              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-7">

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Item information
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Tell students what you're offering.
                  </p>
                </div>

                <div className="space-y-5">

                  {/* Title */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Item title
                    </label>

                    <div className="relative">
                      <FileText
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. PHY 301 Complete Lecture Notes"
                        required
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>

                  {/* Category + Price */}
                  <div className="grid sm:grid-cols-2 gap-5">

                    {/* Category */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Category
                      </label>

                      <div className="relative">
                        <BookOpen
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />

                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="w-full appearance-none pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                        >
                          <option value="">
                            Select category
                          </option>
                          <option value="notes">
                            Notes
                          </option>
                          <option value="pdf">
                            PDF
                          </option>
                          <option value="video">
                            Video
                          </option>
                          <option value="course">
                            Course
                          </option>
                          <option value="gadget">
                            Gadget
                          </option>
                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Price
                      </label>

                      <div className="relative">
                        <DollarSign
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                        />
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Enter 0 if the item is free.
                      </p>
                    </div>

                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe what students will receive..."
                      rows={6}
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none resize-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />

                    <p className="text-xs text-gray-400 mt-2">
                      Give students enough information to understand the item.
                    </p>
                  </div>

                </div>
              </section>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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

            {/* =========================
                RIGHT — PREVIEW
            ========================== */}
            <div className="lg:col-span-1">

              <div className="lg:sticky lg:top-24">

                <div className="mb-3">
                  <h2 className="font-bold text-gray-900">
                    Preview
                  </h2>

                  <p className="text-sm text-gray-500">
                    This is how your item may appear.
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">

                  {/* Preview image */}
                  <div className="h-48 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 flex items-center justify-center relative">

                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={48}
                        className="text-indigo-200"
                      />
                    )}

                    {formData.category && (
                      <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold uppercase text-indigo-700">
                        {formData.category}
                      </span>
                    )}

                    {formData.price && (
                      <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 text-sm font-bold text-indigo-700 shadow-sm">
                        {Number(formData.price) === 0
                          ? "Free"
                          : `₦${Number(
                              formData.price
                            ).toLocaleString()}`}
                      </span>
                    )}

                  </div>

                  {/* Preview content */}
                  <div className="p-5">

                    <h3 className="font-bold text-gray-900 line-clamp-2">
                      {formData.title ||
                        "Your item title"}
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                      {formData.description ||
                        "Your item description will appear here..."}
                    </p>

                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">

                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Tag
                          size={15}
                          className="text-indigo-600"
                        />
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-400">
                          Seller
                        </p>

                        <p className="text-xs font-semibold text-gray-700">
                          You
                        </p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-5 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">

                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                    <SparklesIcon />
                    Tips for sellers
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-indigo-600 leading-relaxed">
                    <li>• Use a clear item title.</li>
                    <li>• Add a useful description.</li>
                    <li>• Upload a quality image.</li>
                    <li>• Set a fair price.</li>
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

function SparklesIcon() {
  return (
    <span className="inline-flex">
      <Video size={16} />
    </span>
  );
}
