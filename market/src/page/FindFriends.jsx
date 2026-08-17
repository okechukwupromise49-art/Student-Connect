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
   <div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 pb-24">

    {/* =====================================================
        HEADER
    ===================================================== */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <Users className="text-white" size={22} />
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Find Friends
          </h1>
        </div>

        <p className="text-gray-500 text-base lg:text-lg">
          Discover students, connect with classmates, and grow your network.
        </p>
      </div>

      {/* Students Count */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
          Students Found
        </p>

        <p className="text-2xl font-bold text-indigo-600 mt-1">
          {filteredUsers.length}
        </p>
      </div>

    </div>


    {/* =====================================================
        SEARCH + FILTER PANEL
    ===================================================== */}
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 lg:p-6 mb-8">

      <div className="flex flex-col xl:flex-row gap-5 xl:items-center">

        {/* SEARCH */}
        <div className="relative flex-1">

          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            size={21}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department or school..."
            className="
              w-full
              pl-14
              pr-5
              py-4
              rounded-2xl
              border border-gray-200
              bg-gray-50
              text-gray-800
              outline-none
              transition-all
              focus:bg-white
              focus:ring-2
              focus:ring-indigo-500
              focus:border-transparent
            "
          />

        </div>


        {/* FILTERS */}
        <div className="flex flex-wrap gap-2">

          <button
            onClick={() => setFilter("all")}
            className={`
              px-5
              py-3
              rounded-xl
              text-sm
              font-semibold
              transition-all
              ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            All Students
          </button>

          <button
            onClick={() => setFilter("same-school")}
            className={`
              px-5
              py-3
              rounded-xl
              text-sm
              font-semibold
              transition-all
              ${
                filter === "same-school"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            Same School
          </button>

          <button
            onClick={() => setFilter("same-department")}
            className={`
              px-5
              py-3
              rounded-xl
              text-sm
              font-semibold
              transition-all
              ${
                filter === "same-department"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            Same Department
          </button>

        </div>

      </div>

    </div>


    {/* =====================================================
        RESULTS HEADER
    ===================================================== */}
    <div className="flex items-center justify-between mb-5">

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Students
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Connect with people who share your academic journey.
        </p>
      </div>

      <div className="hidden sm:block text-sm text-gray-500">
        {filteredUsers.length}{" "}
        {filteredUsers.length === 1 ? "student" : "students"}
      </div>

    </div>


    {/* =====================================================
        EMPTY STATE
    ===================================================== */}
    {filteredUsers.length === 0 ? (

      <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">

        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-50 flex items-center justify-center">
          <Users
            size={40}
            className="text-indigo-400"
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-900">
          No students found
        </h3>

        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          We couldn't find anyone matching your search.
          Try another name, department, or school.
        </p>

      </div>

    ) : (

      /* =====================================================
          USERS GRID
      ===================================================== */

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3
        2xl:grid-cols-4
        gap-5
      ">

        {filteredUsers.map((student) => (

          <div
            key={student._id}
            className="
              group
              bg-white
              rounded-3xl
              border border-gray-100
              p-6
              shadow-sm
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >

            {/* =================================================
                TOP SECTION
            ================================================= */}

            <div className="flex items-start justify-between">

              {/* PROFILE */}
              <div
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/profile/${student._id}`)
                }
              >

                <img
                  src={
                    student.profileImage ||
                    studySpher
                  }
                  alt={student.full_name}
                  className="
                    w-20
                    h-20
                    rounded-2xl
                    object-cover
                    ring-4
                    ring-indigo-50
                    group-hover:ring-indigo-100
                    transition-all
                  "
                />

              </div>


              {/* STATUS */}
              {student.isFollowing && (

                <div className="
                  flex
                  items-center
                  gap-1
                  px-3
                  py-1.5
                  rounded-full
                  bg-green-50
                  text-green-600
                  text-xs
                  font-semibold
                ">

                  <UserCheck size={13} />

                  Connected

                </div>

              )}

            </div>


            {/* =================================================
                USER INFORMATION
            ================================================= */}

            <div className="mt-5">

              <h3
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  truncate
                  cursor-pointer
                  hover:text-indigo-600
                  transition-colors
                "
                onClick={() =>
                  navigate(`/profile/${student._id}`)
                }
              >
                {student.full_name}
              </h3>


              {/* DEPARTMENT */}

              <div className="
                flex
                items-center
                gap-2
                text-sm
                text-gray-500
                mt-3
              ">

                <div className="
                  w-7
                  h-7
                  rounded-lg
                  bg-indigo-50
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                ">
                  <GraduationCap
                    size={15}
                    className="text-indigo-500"
                  />
                </div>

                <span className="truncate">
                  {student.department ||
                    "No department"}
                </span>

              </div>


              {/* SCHOOL */}

              <div className="
                flex
                items-center
                gap-2
                text-sm
                text-gray-500
                mt-2
              ">

                <div className="
                  w-7
                  h-7
                  rounded-lg
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                ">
                  <MapPin
                    size={15}
                    className="text-gray-500"
                  />
                </div>

                <span className="truncate">
                  {student.institution ||
                    "No institution"}
                </span>

              </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="mt-6 flex gap-2">

              {/* VIEW PROFILE */}

              <button
                onClick={() =>
                  navigate(`/profile/${student._id}`)
                }
                className="
                  flex-1
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  text-gray-700
                  text-sm
                  font-semibold
                  hover:bg-gray-50
                  transition-all
                "
              >
                View Profile
              </button>


              {/* FOLLOW */}

              <button
                onClick={() =>
                  handleFollow(student._id)
                }
                className={`
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  font-semibold
                  transition-all
                  ${
                    student.isFollowing
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  }
                `}
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