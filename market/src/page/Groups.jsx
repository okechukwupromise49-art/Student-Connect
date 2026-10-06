// pages/Groups.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("my"); // my | discover
  const [search, setSearch] = useState("");
  const [me, setMe] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [meRes, groupsRes] = await Promise.all([
          axios.get(`${API_URL}/api/register/details`, {
            withCredentials: true,
          }),
          axios.get(
            tab === "my"
              ? `${API_URL}/api/groups/my`
              : `${API_URL}/api/groups`,
            { withCredentials: true }
          ),
        ]);
        setMe(meRes.data);
        setGroups(groupsRes.data || []);
      } catch (error) {
        toast.error("Failed to load groups");
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const myId = String(me?._id || me?.id || "");

  const isMember = (group) =>
    group.members?.some(
      (m) => String(m._id || m) === myId
    );

  const handleJoin = async (groupId) => {
    try {
      await axios.post(
        `${API_URL}/api/groups/${groupId}/join`,
        {},
        { withCredentials: true }
      );
      toast.success("Joined group");
      setTab("my");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join");
    }
  };

  const filtered = groups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase().trim())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Groups</h1>
            <p className="text-xs text-gray-500">Study · Project · Campus</p>
          </div>
          <button
            onClick={() => navigate("/groups/create")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab("my")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === "my"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setTab("discover")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === "discover"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Discover
          </button>
        </div>

        <div className="relative mb-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <Users className="mx-auto text-indigo-400 mb-3" size={32} />
            <p className="font-bold text-gray-900">No groups yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create or join a study group
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Users className="text-indigo-600" size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {group.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {group.members?.length || 0} members ·{" "}
                    {group.category || "study"}
                  </p>
                </div>

                {isMember(group) ? (
                  <button
                    onClick={() => navigate(`/groups/${group._id}/chat`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(group._id)}
                    className="px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-semibold"
                  >
                    Join
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}