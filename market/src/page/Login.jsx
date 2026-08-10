import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom"
import { Register } from "../component/Register";
import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";


export  function Login() {
    const navigate = useNavigate()
    const [active, setActive] = useState(true)
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try{

      const response = await axios.post(
        `${API_URL}/api/register/login`,
        formData,
      {
        withCredentials: true,
      }

      )


    toast.success("Login successful!");

    navigate("/homepage");

    }catch(error){

      toast.error(error.response.data);

    toast.error(
      error.response?.data?.message || error
    );

    }
    
      
  }


  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/register/details`, {
          credentials: "include"
        });
  
        if (res.ok) {
          navigate("/homepage"); // ✅ auto redirect
        }
  
      } catch (err) {
        console.log("User not logged in");
      }
    };
  
    checkUser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-4">
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Study<span className="text-indigo-400">Connect</span>
          </h1>
          <p className="text-slate-400 mt-2">
            Welcome back! Please login to continue
          </p>
        </div>

        {/* Form */}
        {active && <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded accent-indigo-500" />
              Remember me
            </label>
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/30"
            
          >
            Login
            <ArrowRight size={20} />
          </button>
        </form>
        }

        { !active &&  <Register/>   }

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-slate-500 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Sign Up Link */}
            {active && <p className="text-center text-slate-400"
            onClick={() => setActive(false)}>
          Don't have an account?{" "}
          <span className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up
          </span>
        </p>}

        {!active && <p className="text-center text-slate-400"
            onClick={() => setActive(true)}>
          Continue With Account?{" "}
          <span  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Login
          </span>
        </p>}
    
        
      </div>
    </div>
  );
}