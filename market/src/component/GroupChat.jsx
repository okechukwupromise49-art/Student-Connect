
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Users, Check, CheckCheck } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import { PageLoader } from "../component/Loader";

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);

  const bottomRef = useRef(null);
  const myId = String(me?._id || me?.id || "");

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mark messages as read on the server.
  const markMessagesRead = useCallback(async () => {
    if (!id) return;

    try {
      await axios.post(
        `${API_URL}/api/groups/${id}/read`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Could not mark group messages as read:", error);
    }
  }, [id]);

  const fetchChat = useCallback(async (markRead = false) => {
    try {
      const [chatRes, meRes] = await Promise.all([
        axios.get(`${API_URL}/api/groups/${id}/messages`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/register/details`, {
          withCredentials: true,
        }),
      ]);

      setGroup(chatRes.data.group);
      setMessages(chatRes.data.messages || []);
      setMe(meRes.data);

      if (markRead) {
        await markMessagesRead();

        // Fetch again so updated readBy information is displayed.
        const updatedChat = await axios.get(
          `${API_URL}/api/groups/${id}/messages`,
          { withCredentials: true }
        );

        setGroup(updatedChat.data.group);
        setMessages(updatedChat.data.messages || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chat");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  }, [id, markMessagesRead, navigate]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchChat(true);
  }, [id, fetchChat]);

  // Poll for new messages and updated read receipts.
  useEffect(() => {
    if (!id) return;

    const timer = setInterval(async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/groups/${id}/messages`,
          { withCredentials: true }
        );

        setGroup(res.data.group);
        setMessages(res.data.messages || []);

        // Reading the chat marks newly arrived messages as read.
        await markMessagesRead();
      } catch (error) {
        console.error("Could not refresh group messages:", error);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [id, markMessagesRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();

    const value = text.trim();
    if (!value || sending) return;

    try {
      setSending(true);

      const res = await axios.post(
        `${API_URL}/api/groups/${id}/messages`,
        { text: value },
        { withCredentials: true }
      );

      const newMessage = res.data.data;

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      setText("");
      await markMessagesRead();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  // Counts readers other than the person who sent the message.
  const getOtherReaderCount = (msg) => {
    const readers = (msg.readBy || []).map((reader) =>
      String(reader?._id || reader)
    );

    return new Set(readers.filter((readerId) => readerId !== String(
      msg.sender?._id || msg.sender || ""
    ))).size;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/groups")}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
            aria-label="Back to groups"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Users className="text-indigo-600" size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">
              {group?.name || "Group"}
            </p>
            <p className="text-xs text-gray-500">
              {group?.members?.length || 0} members
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-16">
              No messages yet. Start the conversation 👋
            </p>
          )}

          {messages.map((msg) => {
            const senderId = String(msg.sender?._id || msg.sender || "");
            const isMine = senderId === myId;
            const readerCount = getOtherReaderCount(msg);

            return (
              <div
                key={msg._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${isMine ? "items-end" : ""}`}>
                  {!isMine && (
                    <p className="text-[11px] text-gray-500 mb-1 ml-1">
                      {msg.sender?.full_name || "Member"}
                    </p>
                  )}

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>

                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                        isMine ? "text-indigo-200" : "text-gray-400"
                      }`}
                    >
                      <span>{formatTime(msg.createdAt)}</span>

                      {isMine && (
                        <span
                          title={
                            readerCount > 0
                              ? `Read by ${readerCount} ${
                                  readerCount === 1 ? "member" : "members"
                                }`
                              : "Sent"
                          }
                          className="inline-flex items-center gap-1"
                        >
                          {readerCount > 0 ? (
                            <>
                              <CheckCheck size={13} />
                              <span>
                                Read {readerCount}
                              </span>
                            </>
                          ) : (
                            <Check size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100">
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message the group..."
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
