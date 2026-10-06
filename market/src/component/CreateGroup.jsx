import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Users,
  Check,
  BookOpen,
  FolderKanban,
  PartyPopper,
  Megaphone,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";

const CATEGORIES = [
  { id: "study", label: "Study", icon: BookOpen },
  { id: "project", label: "Project", icon: FolderKanban },
  { id: "social", label: "Social", icon: PartyPopper },
  { id: "general", label: "General", icon: Megaphone },
];

export default function CreateGroup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("study");

  const [followers, setFollowers] = useState([]);
  const [selected, setSelected] = useState([]); // user ids
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // ===============================
  // LOAD FOLLOWERS
  // ===============================
  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);

        // Preferred endpoint
        try {
          const res = await axios.get(
            `${API_URL}/api/register/followers`,
            { withCredentials: true }
          );
          setFollowers(res.data || []);
        } catch {
          // Fallback: profile + populate
          const me = await axios.get(
            `${API_URL}/api/register/details`,
            { withCredentials: true }
          );

          const profile = await axios.get(
            `${API_URL}/api/register/profile/${me.data._id}`,
            { withCredentials: true }
          );

          const list = profile.data?.followers || [];
          // If only IDs, you need populate on backend
          setFollowers(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load followers");
        setFollowers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  const toggleMember = (userId) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    const ids = filtered.map((u) => u._id);
    setSelected(ids);
  };

  const clearAll = () => setSelected([]);

  const filtered = followers.filter((user) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      user.full_name?.toLowerCase().includes(q) ||
      user.department?.toLowerCase().includes(q) ||
      user.institution?.toLowerCase().includes(q)
    );
  });

  // ===============================
  // CREATE GROUP
  // ===============================
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setCreating(true);

      const res = await axios.post(
        `${API_URL}/api/groups`,
        {
          name: name.trim(),
          description: description.trim(),
          category,
          memberIds: selected, // followers you picked
        },
        { withCredentials: true }
      );

      toast.success("Group created");
      const groupId = res.data.group?._id || res.data._id;
      navigate(`/groups/${groupId}/chat`);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to create group"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/groups")}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-lg font-bold text-gray-900">Create Group</h1>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Name */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Group name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pharmacy 300 Level Study"
              required
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </section>

          {/* Description */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={3}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 outline-none resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </section>

          {/* Category */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Followers list */}
          <section className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  Add followers
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.length} selected
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-indigo-600"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search followers */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search followers..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto text-gray-300 mb-2" size={28} />
                <p className="text-sm text-gray-500">No followers yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You can still create the group alone
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {filtered.map((user) => {
                  const active = selected.includes(user._id);

                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleMember(user._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition ${
                        active
                          ? "bg-indigo-50 border border-indigo-100"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <img
                        src={user.profileImage || studySpher}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.full_name || "Student"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.department
                            ? `${user.department}${
                                user.institution
                                  ? ` · ${user.institution}`
                                  : ""
                              }`
                            : "Follower"}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "border-2 border-gray-200"
                        }`}
                      >
                        {active && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 disabled:opacity-60"
          >
            {creating
              ? "Creating..."
              : `Create group${
                  selected.length
                    ? ` · ${selected.length} member${
                        selected.length > 1 ? "s" : ""
                      }`
                    : ""
                }`}
          </button>
        </form>
      </main>
    </div>
  );
}