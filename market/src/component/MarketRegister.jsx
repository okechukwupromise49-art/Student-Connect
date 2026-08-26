import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  Home,
  ArrowRight,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";

export default function MarketRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    state_of_origin: "",
    university: "",
    department: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    for (const key in formData) {
      if (!formData[key].trim()) {
        toast.error("Please fill in all fields");
        return;
      }
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/api/market/marketRegister`,
        formData,
        { withCredentials: true }
      );

      toast.success("Seller account created successfully");
      navigate("/market/sell");
    } catch (error) {
  console.error("❌ MARKET REGISTER ERROR:", {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  });

  toast.error(
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Failed to register as seller"
  );
} finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "full_name",
      label: "Full Name",
      type: "text",
      placeholder: "Your full name",
      icon: User,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "example@gmail.com",
      icon: Mail,
    },
    {
      name: "phone_number",
      label: "Phone Number",
      type: "tel",
      placeholder: "e.g. 08012345678",
      icon: Phone,
    },
    {
      name: "state_of_origin",
      label: "State of Origin",
      type: "text",
      placeholder: "e.g. Lagos",
      icon: MapPin,
    },
    {
      name: "university",
      label: "University",
      type: "text",
      placeholder: "e.g. University of Abuja",
      icon: Building2,
    },
    {
      name: "department",
      label: "Department",
      type: "text",
      placeholder: "e.g. Computer Science",
      icon: GraduationCap,
    },
    {
      name: "address",
      label: "Home Address",
      type: "text",
      placeholder: "Your residential address",
      icon: Home,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4 pb-28">
      <div className="max-w-lg mx-auto">

        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 mb-4">
            <Store className="text-white" size={28} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Seller Account
          </h1>

          <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Register correctly to start selling notes, items, gadget, PDFs, and courses on
            Student Market.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {fields.map((field) => {
              const Icon = field.icon;

              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                  </label>

                  <div className="relative">
                    <Icon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    />
                  </div>
                </div>
              );
            })}

            {/* Terms note */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By submitting, you agree to follow Student Market seller guidelines
              and provide accurate information.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 disabled:opacity-60"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  Become a Seller
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Not ready yet?{" "}
          <button
            onClick={() => navigate("/market")}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Back to Market
          </button>
        </p>
      </div>
    </div>
  );
}