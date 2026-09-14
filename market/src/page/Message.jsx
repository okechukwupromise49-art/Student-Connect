
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
import studySpher from "../asse6ts/studySpher.jpeg";
import { PageLoader } from "../component/Loader";
import socket from "../socket";

export default function Messages() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================
  // FETCH CURRENT USER + CONVERSATIONS
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Current user
        const meRes = await axios.get(
          `${API_URL}/api/register/details`,
          {
            withCredentials: true,
          }
        );

        const me = meRes.data;
        setCurrentUser(me);

        // Get conversations
        const chatRes = await axios.get(
          `${API_URL}/api/chat`,
          {
            withCredentials: true,
          }
        );

        const list = Array.isArray(chatRes.data)
          ? chatRes.data
          : [];

        setConversations(list);

        // Calculate total unread messages
        const totalUnread = list.reduce(
          (total, conversation) =>
            total + (conversation.unread || 0),
          0
        );

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Messages fetch error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load messages"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================
  const filtered = conversations.filter((conversation) => {
    const user = conversation.user || {};

    const name =
      user.full_name ||
      user.name ||
      "";

    return name
      .toLowerCase()
      .includes(search.toLowerCase().trim());
  });

  // ==========================================
  // OPEN CHAT
  // ==========================================
  const openChat = (conversation) => {
    const user = conversation?.user;

    if (!user?._id) {
      toast.error("Cannot open chat");
      return;
    }

    navigate(`/chat/${user._id}`);
  };

  // ==========================================
  // SOCKET.IO
  // ==========================================
  useEffect(() => {
    if (!currentUser?._id) return;

    socket.connect();

    // Join my personal room
    socket.emit("join", currentUser._id);

    // ==========================================
    // INITIAL ONLINE USERS
    // ==========================================
    const handleOnlineUsers = (onlineUserIds) => {
      setConversations((prev) =>
        prev.map((conversation) => {
          const userId =
            conversation.user?._id?.toString();

          return {
            ...conversation,
            user: {
              ...conversation.user,
              isOnline:
                onlineUserIds.includes(userId),
            },
          };
        })
      );
    };

    // ==========================================
    // USER COMES ONLINE
    // ==========================================
    const handleUserOnline = (onlineUserId) => {
      const id = onlineUserId.toString();

      setConversations((prev) =>
        prev.map((conversation) => {
          const userId =
            conversation.user?._id?.toString();

          if (userId !== id) {
            return conversation;
          }

          return {
            ...conversation,
            user: {
              ...conversation.user,
              isOnline: true,
            },
          };
        })
      );
    };

    // ==========================================
    // USER GOES OFFLINE
    // ==========================================
    const handleUserOffline = (offlineUserId) => {
      const id = offlineUserId.toString();

      setConversations((prev) =>
        prev.map((conversation) => {
          const userId =
            conversation.user?._id?.toString();

          if (userId !== id) {
            return conversation;
          }

          return {
            ...conversation,
            user: {
              ...conversation.user,
              isOnline: false,
            },
          };
        })
      );
    };

    // ==========================================
    // NEW MESSAGE
    // ==========================================
    const handleNewMessage = (message) => {
      const senderId =
        message.sender?._id?.toString() ||
        message.sender?.toString();

      const receiverId =
        message.receiver?._id?.toString() ||
        message.receiver?.toString();

      const myId = currentUser._id.toString();

      // Find the other person
      const otherUserId =
        senderId === myId
          ? receiverId
          : senderId;

      setConversations((prev) => {
        const index = prev.findIndex(
          (conversation) =>
            conversation.user?._id?.toString() ===
            otherUserId
        );

        // ==========================================
        // PERSON HAS NEVER HAD A CONVERSATION
        // ==========================================
        if (index === -1) {
          return prev;
        }

        const existingConversation = prev[index];

        const isIncoming = senderId !== myId;

        const updatedConversation = {
          ...existingConversation,

          // Update latest message
          lastMessage: message.text,
          lastMessageAt: message.createdAt,

          // Increase unread only for incoming messages
          unread: isIncoming
            ? (existingConversation.unread || 0) + 1
            : existingConversation.unread || 0,
        };

        // Remove from old position
        const newList = [...prev];
        newList.splice(index, 1);

        // Put conversation at the TOP
        newList.unshift(updatedConversation);

        return newList;
      });

      // Update total unread count
      if (senderId !== myId) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // ==========================================
    // REGISTER SOCKET LISTENERS
    // ==========================================
    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "userOnline",
      handleUserOnline
    );

    socket.on(
      "userOffline",
      handleUserOffline
    );

    socket.on(
      "newMessage",
      handleNewMessage
    );

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "userOnline",
        handleUserOnline
      );

      socket.off(
        "userOffline",
        handleUserOffline
      );

      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.disconnect();
    };
  }, [currentUser?._id]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return <PageLoader />;
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Messages
            </h1>

            <p className="text-xs text-gray-500">
              Your recent conversations
            </p>
          </div>

          {/* Message icon + total unread */}
          <div className="relative w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <MessageCircle
              size={20}
              className="text-indigo-600"
            />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </div>

        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-2xl mx-auto px-4 py-5">

        {/* ================= SEARCH ================= */}
        <div className="relative mb-5">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search conversations..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />

        </div>

        {/* ================= COUNT ================= */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">

          <Users size={16} />

          <span>
            {filtered.length} conversation
            {filtered.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {/* ================= EMPTY STATE ================= */}
        {filtered.length === 0 ? (

          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">

              <MessageCircle
                className="text-indigo-400"
                size={28}
              />

            </div>

            <h3 className="font-bold text-gray-900">
              No conversations yet
            </h3>

            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Start a conversation with
              another student and your
              messages will appear here.
            </p>

            <button
              onClick={() => navigate("/find")}
              className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Find friends
            </button>

          </div>

        ) : (

          /* ================= CONVERSATION LIST ================= */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">

            {filtered.map((conversation) => {

              const user =
                conversation.user || {};

              const unread =
                conversation.unread || 0;

              return (
                <button
                  key={user._id}
                  onClick={() =>
                    openChat(conversation)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
                >

                  {/* ================= PROFILE IMAGE ================= */}
                  <div className="relative shrink-0">

                    <img
                      src={
                        user.profileImage ||
                        studySpher
                      }
                      alt={
                        user.full_name ||
                        "User"
                      }
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                    />

                    {/* Online dot */}
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}

                  </div>

                  {/* ================= USER INFO ================= */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-2">

                      <p className="font-semibold text-gray-900 truncate">
                        {user.full_name ||
                          "Student"}
                      </p>

                      {/* Message time */}
                      {conversation.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(
                            conversation.lastMessageAt
                          ).toLocaleDateString(
                            [],
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )}
                        </span>
                      )}

                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">

                      {/* Online status */}
                      {user.isOnline ? (
                        <span className="text-xs text-green-500 font-medium truncate">
                          Active now
                        </span>
                      ) : (

                        <p
                          className={`text-xs truncate ${
                            unread > 0
                              ? "text-gray-800 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          {conversation.lastMessage ||
                            "Tap to chat"}
                        </p>

                      )}

                    </div>

                  </div>

                  {/* ================= CHAT BUTTON + UNREAD ================= */}
                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unread > 0
                        ? "bg-green-100"
                        : "bg-indigo-50"
                    }`}
                  >

                    <MessageCircle
                      size={20}
                      className={
                        unread > 0
                          ? "text-green-600"
                          : "text-indigo-600"
                      }
                    />

                    {/* Individual unread count */}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 99
                          ? "99+"
                          : unread}
                      </span>
                    )}

                  </div>

                </button>
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}
