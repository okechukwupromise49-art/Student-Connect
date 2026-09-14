
import React, { useEffect, useState } from "react";
import {
  Home,
  Users,
  Users2,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import API_URL from "../Api";
import socket from "../socket";

export function Footer() {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================
  // GET CURRENT USER
  // ==========================================
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
      } catch (error) {
        console.log(
          error.response?.data || error.message
        );
      }
    };

    checkUser();
  }, []);

  // ==========================================
  // GET INITIAL UNREAD COUNT
  // ==========================================
  useEffect(() => {
    if (!user?._id) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/chat`,
          {
            withCredentials: true,
          }
        );

        const conversations = Array.isArray(res.data)
          ? res.data
          : [];

        const totalUnread = conversations.reduce(
          (total, conversation) =>
            total + (conversation.unread || 0),
          0
        );

        setUnreadCount(totalUnread);
      } catch (error) {
        console.log(
          "Failed to get unread messages:",
          error.response?.data || error.message
        );
      }
    };

    fetchUnreadCount();
  }, [user?._id, location.pathname]);

  // ==========================================
  // SOCKET.IO - REAL-TIME UNREAD MESSAGES
  // ==========================================
  useEffect(() => {
    if (!user?._id) return;

    socket.connect();

    // Join current user's personal room
    socket.emit("join", user._id);

    // ==========================================
    // NEW MESSAGE
    // ==========================================
    const handleNewMessage = (message) => {
      const senderId =
        message.sender?._id?.toString() ||
        message.sender?.toString();

      const myId = user._id.toString();

      // Only count messages sent by someone else
      if (senderId !== myId) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on(
      "newMessage",
      handleNewMessage
    );

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.disconnect();
    };
  }, [user?._id]);

  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================
  const navItems = [
    {
      icon: Home,
      label: "Campus",
      path: "/homepage",
    },
    {
      icon: Users,
      label: "Connect",
      path: "/find",
    },
    {
      icon: MessageCircle,
      label: "Message",
      path: "/messages",
    },
    {
      icon: Users2,
      label: "Groups",
      path: "/groups",
    },
    {
      icon: ShoppingBag,
      label: "Market",
      path: "/market",
    },
  ];

  // ==========================================
  // MARK MESSAGES AS READ WHEN OPENING MESSAGES
  // ==========================================
  useEffect(() => {
    if (location.pathname === "/messages") {
      const markAsRead = async () => {
        try {
          const res = await axios.get(
            `${API_URL}/api/chat`,
            {
              withCredentials: true,
            }
          );

          const conversations = Array.isArray(
            res.data
          )
            ? res.data
            : [];

          const totalUnread =
            conversations.reduce(
              (total, conversation) =>
                total +
                (conversation.unread || 0),
              0
            );

          setUnreadCount(totalUnread);
        } catch (error) {
          console.log(
            "Unread refresh error:",
            error.response?.data ||
              error.message
          );
        }
      };

      markAsRead();
    }
  }, [location.pathname]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-around py-2 px-4">

          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.path;

            const isMessage =
              item.path === "/messages";

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-teal-400 scale-110"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >

                {/* ICON */}
                <div className="relative">

                  <Icon
                    size={24}
                    strokeWidth={
                      isActive ? 2.5 : 2
                    }
                    className="mb-1"
                  />

                  {/* UNREAD BADGE */}
                  {isMessage &&
                    unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-gray-900">
                        {unreadCount > 99
                          ? "99+"
                          : unreadCount}
                      </span>
                    )}

                </div>

                {/* LABEL */}
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
