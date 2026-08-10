import React from 'react';
import Education from "../assets/Education.png";
import { Plus, Users } from "lucide-react";
import { useEffect } from 'react';
import axios from "axios";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Welcome() {

  const navigate = useNavigate()
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


    useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get(
          "http://localhost:7000/api/register/details",
          {
            withCredentials: true,
          }
        );

        setUser(res.data);
        console.log(res.data);
      } catch (error) {
        console.log(error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      <div className="px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Content */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-400/30 animate-pulse"></div>
            <span className="text-white/90 text-sm font-medium">2,459 students online right now</span>
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              Welcome back,{" "}
            <span className="text-indigo-400">
              {loading ? "Loading..." : user?.full_name}
            </span>{" "}
            👋
            </h1>
            <p className="mt-3 text-lg text-slate-300 max-w-md">
              Connect with peers, share knowledge, and grow together in your academic journey.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <button className="flex items-center gap-3 bg-white text-slate-900 font-semibold px-7 py-4 rounded-2xl hover:bg-white/95 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-indigo-500/30"
              onClick={() => navigate("/create")}>
              <Plus size={24} />
              Create Post
            </button>

            <button className="flex items-center gap-3 border border-white/30 hover:border-white/50 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/10 active:scale-[0.97] transition-all duration-200 backdrop-blur-sm">
              <Users size={24} />
              Find Friends
            </button>
          </div>
        </div>

        {/* Image - Hidden on mobile */}
        <div className="hidden md:flex flex-1 justify-end">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-10 bg-indigo-500/20 blur-3xl rounded-full"></div>
            
            <img 
              src={Education} 
              alt="Education illustration" 
              className="relative w-[380px] drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Subtle bottom accent */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400"></div>
    </div>
  );
}