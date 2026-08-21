import React from "react";
import {
  Home,
  ShoppingBag,
  Package,
  User,
  ArrowLeftCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function MarketFooter() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Home", path: "/market" },
    { icon: Package, label: "Orders", path: "/market/orders" },
    { icon: ShoppingBag, label: "Cart", path: "/market/cart" },
    { icon: User, label: "You", path: "/market/you" },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {/* Back to Connect */}
          <button
            onClick={() => navigate("/homepage")}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-gray-400 hover:text-indigo-600 transition-all"
          >
            <ArrowLeftCircle size={22} className="mb-1" />
            <span className="text-[10px] font-medium">Connect</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? "text-indigo-600"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}