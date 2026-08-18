import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  UserCheck,
  MapPin,
  GraduationCap,
  Users,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import studySpher from "../assets/studySpher.jpeg";
import { toast } from "react-toastify";
import API_URL from "../Api";

export default function FindFriends() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | same-department | same-school

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    const fetchData = async () => {
  try {
    setLoading(true);

    // Get logged-in user
    const meRes = await axios.get(
      `${API_URL}/api/register/details`,
      { withCredentials: true }
    );

    setCurrentUser(meRes.data);

    // Get students
    const usersRes = await axios.get(
      `${API_URL}/api/register/users`,
      { withCredentials: true }
    );

    setUsers(usersRes.data);

  } catch (error) {
    console.error(
      "Fetch users error:",
      error.response?.data || error.message
    );

    toast.error("Failed to load users");
  } finally {
    setLoading(false);
  }
};
    fetchData();
  }, []);

  // ===============================
  // FOLLOW / UNFOLLOW
  // ===============================
  const handleFollow = async (userId) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/register/follow/${userId}`,
        {},
        { withCredentials: true }
      );

      // Update UI
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isFollowing: res.data.isFollowing }
            : u
        )
      );

      toast.success(
        res.data.isFollowing ? "Followed successfully" : "Unfollowed"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  // ===============================
  // FILTER + SEARCH
  // ===============================
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase()) ||
      u.institution?.toLowerCase().includes(search.toLowerCase());

    if (filter === "same-department") {
      return (
        matchesSearch &&
        u.department?.toLowerCase() ===
          currentUser?.department?.toLowerCase()
      );
    }

    if (filter === "same-school") {
      return (
        matchesSearch &&
        u.institution?.toLowerCase() ===
          currentUser?.institution?.toLowerCase()
      );
    }

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
  
<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-28">

    {/* =====================================================
        HEADER
    ===================================================== */}
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Users className="text-white" size={24} />
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Find Friends
          </h1>
          <p className="text-gray-500 mt-1 text-base sm:text-lg">
            Discover students, connect with classmates, and grow your network.
          </p>
        </div>
      </div>
    </div>

    {/* =====================================================
        SEARCH + FILTER PANEL
    ===================================================== */}
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100/80 shadow-sm p-5 sm:p-6 mb-8">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-center">

        {/* SEARCH */}
        <div className="relative flex-1">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department or school..."
            className="w-full pl-14 pr-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/80 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Students" },
            { id: "same-school", label: "Same School" },
            { id: "same-department", label: "Same Department" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* =====================================================
        RESULTS HEADER
    ===================================================== */}
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Students</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect with people who share your academic journey
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
        <Users size={15} className="text-indigo-500" />
        <span className="font-medium text-gray-700">
          {filteredUsers.length}
        </span>
        {filteredUsers.length === 1 ? "student" : "students"}
      </div>
    </div>

    {/* =====================================================
        EMPTY STATE
    ===================================================== */}
    {filteredUsers.length === 0 ? (
      <div className="bg-white rounded-3xl border border-gray-100 p-14 sm:p-20 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
          <Users size={36} className="text-indigo-400" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900">
          No students found
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          We couldn’t find anyone matching your search. Try another name,
          department, or school.
        </p>
      </div>
    ) : (
      /* =====================================================
          USERS GRID
      ===================================================== */
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filteredUsers.map((student) => (
          <div
            key={student._id}
            className="group relative bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Top */}
            <div className="flex items-start justify-between mb-5">
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/profile/${student._id}`)}
              >
                <img
                  src={student.profileImage || studySpher}
                  alt={student.full_name}
                  className="w-18 h-18 w-[72px] h-[72px] rounded-2xl object-cover ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all"
                />
              </div>

              {student.isFollowing && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                  <UserCheck size={13} />
                  Connected
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h3
                className="text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => navigate(`/profile/${student._id}`)}
              >
                {student.full_name}
              </h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={14} className="text-indigo-500" />
                  </div>
                  <span className="truncate">
                    {student.department || "No department"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-gray-500" />
                  </div>
                  <span className="truncate">
                    {student.institution || "No institution"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => navigate(`/profile/${student._id}`)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                View
              </button>

              <button
                onClick={() => handleFollow(student._id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  student.isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                }`}
              >
                {student.isFollowing ? (
                  <>
                    <UserCheck size={16} />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
  );
}