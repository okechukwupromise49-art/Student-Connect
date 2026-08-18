import { Search, Menu, X, Bell, User } from "lucide-react";
import { useState } from "react";
import studySpher from "../assets/studySpher.jpeg";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_URL from "../Api";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
      const checkUser = async () => {
        try {
          const res = await axios.get(
            `${API_URL}/api/register/details`,
            {
              withCredentials: true,
            }
          );
  
          setUser(res.data);
          console.log(res.data);
        } catch (error) {
          console.log(error.response?.data || error.message);
        } 
      };
  
      checkUser();
    }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={studySpher} 
              alt="StudySphere" 
              className="w-10 h-10 rounded-xl object-cover" 
            />
            <div className="flex items-baseline">
              <span className="font-bold text-2xl tracking-tight">Student</span>
              <span className="font-bold text-2xl tracking-tight text-indigo-600">Connect</span>
            </div>
          </div>

          

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, topics..."
                className="w-full bg-gray-100 border border-gray-300 focus:border-indigo-500 focus:bg-white pl-10 py-2.5 rounded-2xl text-sm outline-none transition-all"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-indigo-500" size={20} />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3">
            

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-medium text-white rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 pl-3 border-l border-gray-200">
              
              <div
              onClick={() => user?._id && navigate(`/profile/${user._id}`)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer"
            >
              <img
                src={ user?.profileImage
                ? `${user.profileImage}?t=${Date.now()}`
                : studySpher}
                alt={user?.full_name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            </button>

           
          </div>
        </div>
      </div>

     
    </header>
  );
}