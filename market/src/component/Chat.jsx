// pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";
import socket from "../socket";



export default function ChatPage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId"); // from market orders
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChat = async () => {
    try {
      const [chatRes, meRes] = await Promise.all([
        axios.get(`${API_URL}/api/chat/${userId}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/register/details`, {
          withCredentials: true,
        }),
      ]);

      setOtherUser(chatRes.data.user);
      setMessages(chatRes.data.messages || []);
      setMe(meRes.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to load chat");
      navigate("/messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetchChat();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

// ===============================
// SOCKET.IO - CHAT + ACTIVE STATUS
// ===============================
useEffect(() => {
  if (!userId || !me?._id) return;

  socket.connect();

  // Join my personal room
  socket.emit("join", me._id);

  // ===============================
  // NEW MESSAGE
  // ===============================
  const handleNewMessage = (message) => {
    const senderId =
      message.sender?._id?.toString() ||
      message.sender?.toString();

    const receiverId =
      message.receiver?._id?.toString() ||
      message.receiver?.toString();

    const currentUserId = me._id.toString();
    const chatUserId = userId.toString();

    const belongsToThisChat =
      (senderId === currentUserId && receiverId === chatUserId) ||
      (senderId === chatUserId && receiverId === currentUserId);

    if (!belongsToThisChat) return;

    setMessages((prev) => {
      const alreadyExists = prev.some(
        (msg) => msg._id === message._id
      );

      if (alreadyExists) return prev;

      return [...prev, message];
    });
  };

  // ===============================
  // USER ONLINE
  // ===============================
  const handleUserOnline = (onlineUserId) => {
    if (onlineUserId.toString() === userId.toString()) {
      setIsOnline(true);
    }
  };

  // ===============================
  // USER OFFLINE
  // ===============================
  const handleUserOffline = (offlineUserId) => {
    if (offlineUserId.toString() === userId.toString()) {
      setIsOnline(false);
    }
  };

  socket.on("newMessage", handleNewMessage);
  socket.on("userOnline", handleUserOnline);
  socket.on("userOffline", handleUserOffline);

  return () => {
    socket.off("newMessage", handleNewMessage);
    socket.off("userOnline", handleUserOnline);
    socket.off("userOffline", handleUserOffline);

    socket.disconnect();
  };
}, [userId, me?._id]);

//handle send btn

  const handleSend = async (e) => {
    e?.preventDefault();

    const value = text.trim();
    if (!value || sending) return;

    try {
      setSending(true);

      const res = await axios.post(
        `${API_URL}/api/chat/${userId}`,
        {
          text: value,
          orderId: orderId || undefined,
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, res.data.data]);
      setText("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={() => navigate(`/profile/${otherUser?._id}`)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
          >
            <img
              src={otherUser?.profileImage || studySpher}
              alt={otherUser?.full_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {otherUser?.full_name || "Student"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {otherUser?.department || "Student Connect"}
              </p>
              <p className="text-xs truncate">
              {isOnline ? (
                <span className="text-green-500">🟢 Active now</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
            </div>
          </button>
        </div>

        {orderId && (
          <div className="max-w-2xl mx-auto px-4 pb-2">
            <p className="text-[11px] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl inline-block">
              Chat linked to market order
            </p>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">
                No messages yet. Say hello 👋
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine =
              msg.sender?._id?.toString() === me?._id?.toString() ||
              msg.sender?.toString() === me?._id?.toString();

            return (
              <div
                key={msg._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? "text-indigo-200" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100">
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}