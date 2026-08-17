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

        // Get all users (except current user)
        const usersRes = await axios.get(
          `${API_URL}/api/register/all-users`,
          { withCredentials: true }
        );

        // Remove current user from list
        const filtered = usersRes.data.filter(
          (u) => u._id !== meRes.data._id
        );

        setUsers(filtered);
      } catch (error) {
        console.error(error);
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
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Find Friends
        </h1>
        <p className="text-gray-500 mt-1">
          Connect with students from your school and beyond
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department or school..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Students
          </button>

          <button
            onClick={() => setFilter("same-school")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "same-school"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Same School
          </button>

          <button
            onClick={() => setFilter("same-department")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "same-department"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Same Department
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        {filteredUsers.length} student
        {filteredUsers.length !== 1 ? "s" : ""} found
      </p>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No students found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try a different search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredUsers.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                
                {/* Avatar */}
                <img
                  src={student.profileImage || studySpher}
                  alt={student.full_name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-50 cursor-pointer"
                  onClick={() => navigate(`/profile/${student._id}`)}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/profile/${student._id}`)}
                  >
                    {student.full_name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <GraduationCap size={14} />
                    <span className="truncate">
                      {student.department || "No department"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <MapPin size={14} />
                    <span className="truncate">
                      {student.institution || "No institution"}
                    </span>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleFollow(student._id)}
                    className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      student.isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}