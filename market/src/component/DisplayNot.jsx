import React from "react";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DisplayNot() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        {/* Close button */}
        <button
          onClick={() => navigate("/homepage")}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 mb-5">
            <Sparkles className="text-white" size={28} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Complete Your Bio
          </h2>

          {/* Message */}
          <p className="text-gray-500 leading-relaxed mb-8">
            Please complete your bio so we can recommend you to people, books,
            and groups related to your passion.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/homepage")}
              className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Later
            </button>

            <button
              onClick={() => {
                navigate("/editProfile");
              }}
              className="flex-1 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
            >
              Complete Bio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}