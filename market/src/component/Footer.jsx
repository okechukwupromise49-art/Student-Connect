import React, { useEffect, useState } from "react";
import { 
  Home, 
  Users, 
  Users2, 
  ShoppingBag, 
  User 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export function Footer() {
  const location = useLocation();
  const [user, setUser] = useState("")

  const navItems = [
    { 
      icon: Home, 
      label: "Home", 
      path: "/homepage" 
    },
    { 
      icon: Users, 
      label: "Connect", 
      path: "/connect" 
    },
    { 
      icon: Users2, 
      label: "Groups", 
      path: "/groups" 
    },
    { 
      icon: ShoppingBag, 
      label: "Market", 
      path: "/market" 
    },
    { 
      icon: User, 
      label: "Profile", 
      path: `/profile/${user._id}` 
    },
  ];

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
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-teal-400 scale-110" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className="mb-1" 
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}