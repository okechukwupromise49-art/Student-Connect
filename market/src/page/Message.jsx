import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Users,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";
import socket from "../socket";

export default function Messages() {
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Current user
        const meRes = await axios.get(`${API_URL}/api/register/details`, {
          withCredentials: true,
        });
        setCurrentUser(meRes.data);

        // Followers list
        // Option A: dedicated endpoint
        try {
          const res = await axios.get(
            `${API_URL}/api/register/followers`,
            { withCredentials: true }
          );
          setFollowers(res.data || []);
        } catch {
          // Option B: from profile using my id
          const profileRes = await axios.get(
            `${API_URL}/api/register/profile/${meRes.data._id}`,
            { withCredentials: true }
          );
          console.log(profileRes)
          const list = profileRes.data?.followers || [];
          console.log(list)
          // If followers are only IDs, you may need a populate endpoint
          setFollowers(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = followers.filter((user) => {
    const name = user.full_name || user.name || "";
    return name.toLowerCase().includes(search.toLowerCase().trim());
  });

  const openChat = (user) => {
    if (!user?._id) {
      toast.error("Cannot open chat");
      return;
    }
    // Adjust path to match your chat route
    navigate(`/chat/${user._id}`);
  };

 // ===============================
// ACTIVE / ONLINE SYSTEM
// ===============================
useEffect(() => {
  if (!currentUser?._id) return;

  socket.connect();

  // Join my personal room
  socket.emit("join", currentUser._id);

  const handleUserOnline = (onlineUserId) => {
    const id = onlineUserId.toString();

    setFollowers((prev) =>
      prev.map((user) =>
        user._id?.toString() === id
          ? { ...user, isOnline: true }
          : user
      )
    );
  };

  const handleUserOffline = (offlineUserId) => {
    const id = offlineUserId.toString();

    setFollowers((prev) =>
      prev.map((user) =>
        user._id?.toString() === id
          ? { ...user, isOnline: false }
          : user
      )
    );
  };

  socket.on("userOnline", handleUserOnline);
  socket.on("userOffline", handleUserOffline);  


  const handleNewMessage = (message) => {
  const senderId =
    message.sender?._id?.toString() ||
    message.sender?.toString();

  const myId = currentUser._id.toString();

  // Only count messages sent TO me
  if (senderId !== myId) {
    setUnreadCount((prev) => prev + 1);
  }
};

socket.on("newMessage", handleNewMessage);
socket.off("newMessage", handleNewMessage);
  return () => {
    socket.off("userOnline", handleUserOnline);
    socket.off("userOffline", handleUserOffline);
    socket.disconnect();
  };
}, [currentUser?._id]);
  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-xs text-gray-500">
              Chat with people who follow you
            </p>
          </div>

         <div className="relative w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <MessageCircle size={20} className="text-indigo-600" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Search */}
        <div className="relative mb-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search followers..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        {/* Count */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Users size={16} />
          <span>
            {filtered.length} follower{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <MessageCircle className="text-indigo-400" size={28} />
            </div>
            <h3 className="font-bold text-gray-900">No followers yet</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              When students follow you, they’ll appear here so you can start a
              chat.
            </p>
            <button
              onClick={() => navigate("/find")}
              className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Find friends
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filtered.map((user) => (
              <button
                key={user._id}
                onClick={() => openChat(user)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
              >
                <img
                  src={user.profileImage || studySpher}
                  alt={user.full_name || "User"}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {user.full_name || "Student"}
                  </p>
                  <div className="flex items-center gap-1.5">
  {user.isOnline && (
    <span className="w-2 h-2 bg-green-500 rounded-full" />
  )}

                <p
                  className={`text-xs truncate ${
                    user.isOnline ? "text-green-500" : "text-gray-500"
                  }`}
                >
                  {user.isOnline
                    ? "Active now"
                    : user.department
                    ? `${user.department}${
                        user.institution ? ` · ${user.institution}` : ""
                      }`
                    : "Tap to chat"}
                </p>
              </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <MessageCircle size={16} className="text-indigo-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}