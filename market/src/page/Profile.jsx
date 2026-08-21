import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import studySpher from "../assets/studySpher.jpeg";

import {
  Edit3,
  Share2,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  Download,
  UserPlus,
  UserCheck,
  MessageCircle,
} from "lucide-react";

import axios from "axios";
import API_URL from "../Api";
import { toast } from "react-toastify";


import usePostFunctions from "../../PostFunction";
import ProfillePostField from "../component/UserPostFeed";
import { PageLoader } from "../component/Loader";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // PROFILE STATES
  // =====================================================

  const [activeTab, setActiveTab] = useState("posts");

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // =====================================================
  // POSTS STATE
  // =====================================================

  const [posts, setPosts] = useState([]);

  // =====================================================
  // FETCH PROFILE
  // =====================================================
  useEffect(() => {
  const fetchUser = async () => {
    try {
      setLoading(true);

      console.log(
        "PROFILE URL:",
        `${API_URL}/api/register/profile/${id}`
      );

      console.log(
        "PROFILE ID FROM URL:",
        id
      );

      const res = await axios.get(
        `${API_URL}/api/register/profile/${id}`,
        {
          withCredentials: true,
        }
      );

      console.log(
        "PROFILE RESPONSE:",
        res.data
      );

      setUser(res.data);

    } catch (err) {
      console.error(
        "❌ PROFILE FETCH ERROR:",
        err.response?.status,
        err.response?.data,
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchUser();
  }
}, [id]);

  
  // =====================================================
  // FETCH CURRENT LOGGED-IN USER
  // =====================================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/register/details`,
          {
            withCredentials: true,
          }
        );

        setCurrentUser(res.data);
      } catch (err) {
        console.error(
          "Error fetching current user:",
          err
        );
      }
    };

    fetchCurrentUser();
  }, []);

  // =====================================================
  // FETCH POSTS
  // =====================================================

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/posts/display`,
          {
            withCredentials: true,
          }
        );

        setPosts(res.data);
      } catch (error) {
        console.error(
          "Error fetching posts:",
          error.response?.data ||
            error.message
        );
      }
    };

    fetchPosts();
  }, []);

  // =====================================================
  // POST FUNCTIONS
  // =====================================================

  const {
    handleLike,
    handleComment,
    handleSubmitComment,
    handleDelete,
    handleDeleteComment,
    handleSharePost,
    handleShareComment,
    selectedPost,
  } = usePostFunctions({
    posts,
    setPosts,
  });

  // =====================================================
  // FILTER PROFILE POSTS
  // =====================================================

  const profilePosts = posts.filter(
    (post) =>
      post.author?._id?.toString() ===
      user?._id?.toString()
  );

  // =====================================================
  // CHECK PROFILE OWNER
  // =====================================================

  const isOwner =
    currentUser &&
    user &&
    currentUser._id?.toString() ===
      user._id?.toString();


  const isFollowing =
  user?.isFollowing === true ||
  user?.followers?.some(
    (id) => id?.toString() === currentUser?._id?.toString()
  ) ||
  currentUser?.following?.some(
    (id) => id?.toString() === user?._id?.toString()
  );

  // =====================================================
  // TABS
  // =====================================================

  const tabs = [
    {
      id: "posts",
      label: "Posts",
    },
    {
      id: "groups",
      label: "Study Groups",
    },
    {
      id: "materials",
      label: "Materials",
    },
    {
      id: "about",
      label: "About",
    },
  ];

  const handleFollow = async (userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/register/follow/${userId}`,
      {},
      { withCredentials: true }
    );

    // Update the profile user state
    setUser((prev) => ({
      ...prev,
      isFollowing: res.data.isFollowing,
      followers: res.data.followers || prev.followers,
    }));

    // Also update currentUser following list if needed
    setCurrentUser((prev) => {
      if (!prev) return prev;

      const following = prev.following || [];
      const alreadyFollowing = following.some(
        (id) => id.toString() === userId.toString()
      );

      return {
        ...prev,
        following: res.data.isFollowing
          ? alreadyFollowing
            ? following
            : [...following, userId]
          : following.filter(
              (id) => id.toString() !== userId.toString()
            ),
      };
    });

    toast.success(
      res.data.isFollowing ? "Followed successfully" : "Unfollowed"
    );
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || "Action failed");
  }
};

useEffect(() => {
  console.log("MY PROFILE USER:", user);
  console.log("MY FOLLOWERS:", user?.followers);
  console.log("MY FOLLOWERS LENGTH:", user?.followers?.length);
}, [user]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <PageLoader/>
    );
  }

  // =====================================================
  // USER NOT FOUND
  // =====================================================

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-lg">
          User not found
        </p>
      </div>
    );
  }

   

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* =================================================
          COVER + PROFILE HEADER
      ================================================= */}

      <div className="relative">

        <div className="h-40 md:h-52 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"></div>

        <div className="max-w-4xl mx-auto px-4">

          <div className="relative -mt-16 md:-mt-20">

            <div className="flex flex-col md:flex-row md:items-end gap-4">

              {/* AVATAR */}

              <div
                onClick={() =>
                  setIsModalOpen(true)
                }
                className="cursor-pointer"
              >
                <img
                  src={
                    user?.profileImage
                      ? `${user.profileImage}?t=${Date.now()}`
                      : studySpher
                  }
                  alt={user.full_name}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                />
              </div>

              {/* NAME */}

              <div className="flex-1 pt-2 md:pt-0 md:pb-4">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {user.full_name}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">

                  <GraduationCap size={16} />

                  <span>
                    {user.institution} •{" "}
                    {user.department}
                  </span>

                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex flex-wrap gap-3 mt-2 md:mt-0">

                {isOwner ? (

                  <button
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
                    onClick={() =>
                      navigate("/editProfile")
                    }
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </button>

                ) : (

                  <>
                    <button
                        onClick={() => handleFollow(user._id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                          user.isFollowing
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {user.isFollowing ? (
                          <>
                            <UserCheck size={18} />
                            Connected
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            Connect
                          </>
                        )}
                      </button>

                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium">
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </>

                )}

                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl font-medium">
                  <Share2 size={18} />
                  Share
                </button>

              </div>

            </div>

            {/* BIO */}

            <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
              {user.bio || "No bio yet."}
            </p>

            {/* STATS */}

            <div className="flex gap-8 mt-6">

              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">
                  {user?.followers?.length || 0}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {user?.following?.length || 0}
                </p>

                <p className="text-sm text-gray-500">
                  Connections
                </p>
              </div>

              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">
                  {profilePosts.length}
                </p>

                <p className="text-sm text-gray-500">
                  Posts
                </p>
              </div>

              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">
                  {user.courses || 0}
                </p>

                <p className="text-sm text-gray-500">
                  Courses
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="max-w-4xl mx-auto px-4 mt-8">

        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">

          {tabs.map((tab) => (

            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`px-5 py-3 font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>

          ))}

        </div>

        {/* =================================================
            TAB CONTENT
        ================================================= */}

        <div className="mt-6">

          {/* POSTS */}

          {activeTab === "posts" && (

            <ProfillePostField
              posts={profilePosts}
              setPosts={setPosts}
              profile={user}
              user={currentUser}

              handleLike={handleLike}
              handleComment={handleComment}
              
              
              handleDeleteComment={
                handleDeleteComment
              }
              handleSharePost={
                handleSharePost
              }
              handleShareComment={
                handleShareComment
              }
            />

          )}

          {/* MATERIALS */}

          {activeTab === "materials" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {[
                {
                  title: "CS101 Syllabus.pdf",
                  size: "1.2 MB",
                },
                {
                  title:
                    "Machine Learning Notes.pdf",
                  size: "3.4 MB",
                },
              ].map((file, index) => (

                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
                >

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <FileText
                        className="text-indigo-600"
                        size={22}
                      />
                    </div>

                    <div>
                      <p className="font-medium text-gray-800">
                        {file.title}
                      </p>

                      <p className="text-sm text-gray-500">
                        {file.size}
                      </p>
                    </div>

                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download
                      size={20}
                      className="text-gray-600"
                    />
                  </button>

                </div>

              ))}

            </div>
          )}

          {/* GROUPS */}

          {activeTab === "groups" && (
            <div className="text-center py-12 text-gray-500">
              <Users
                size={40}
                className="mx-auto mb-3 opacity-50"
              />

              <p>
                No study groups yet
              </p>
            </div>
          )}

          {/* ABOUT */}

          {activeTab === "about" && (

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  About
                </h3>

                <p className="text-gray-600">
                  {user.bio ||
                    "No bio yet."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <GraduationCap size={18} />

                <span>
                  {user.department} at{" "}
                  {user.institution}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} />

                <span>
                  Abuja, Nigeria
                </span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* =================================================
          PROFILE IMAGE MODAL
      ================================================= */}

      {isModalOpen && (

        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() =>
            setIsModalOpen(false)
          }
        >

          <div
            className="bg-white p-6 rounded-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <img
              src={
                user?.profileImage
                  ? `${user.profileImage}?t=${Date.now()}`
                  : studySpher
              }
              className="w-80 h-80 rounded-xl object-cover"
              alt={user.full_name}
            />

            <button
              onClick={() =>
                setIsModalOpen(false)
              }
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl"
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>
  );
}