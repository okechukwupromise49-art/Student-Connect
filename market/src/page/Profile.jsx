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
  MessageCircle
} from "lucide-react";
import axios from "axios";
import API_URL from "../Api";

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen,setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  // Check if the logged-in user is viewing their own profile
  const isOwner = currentUser && user && currentUser._id === user._id;

  // Fetch the profile of the user whose ID is in the URL
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/api/register/profile/${id}`
        );
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  // Fetch the currently logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
         `${API_URL}/api/register/details`,
          { withCredentials: true }
        );
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "groups", label: "Study Groups" },
    { id: "materials", label: "Materials" },
    { id: "about", label: "About" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-lg">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* Cover + Profile Header */}
      <div className="relative">
        <div className="h-40 md:h-52 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"></div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="relative -mt-16 md:-mt-20">
            
            <div className="flex flex-col md:flex-row md:items-end gap-4"
                onClick={() => setIsModalOpen(true)}>
              
              {/* Avatar */}
              <img
                src={ user?.profileImage
                  ? `${user.profileImage}?t=${Date.now()}`
                  : studySpher}
                alt={user.full_name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl object-cover bg-white"
              />

              {/* Name & Info */}
              <div className="flex-1 pt-2 md:pt-0 md:pb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {user.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">
                  <GraduationCap size={16} />
                  <span>{user.institution} • {user.department}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
                {isOwner ? (
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
                    onClick={() => navigate("/editProfile")}>
                    <Edit3 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all">
                      <UserPlus size={18} />
                      Follow
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all">
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </>
                )}

                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-all">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
              {user.bio || "No bio yet."}
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{user.connections || 0}</p>
                <p className="text-sm text-gray-500">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{user.posts || 0}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{user.courses || 0}</p>
                <p className="text-sm text-gray-500">Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "posts" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-700">
                  Just finished my Machine Learning assignment! Anyone else working on neural networks this semester?
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>❤️ 24 likes</span>
                  <span>💬 8 comments</span>
                  <span>2 hours ago</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "CS101 Syllabus.pdf", size: "1.2 MB" },
                { title: "Machine Learning Notes.pdf", size: "3.4 MB" },
              ].map((file, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <FileText className="text-indigo-600" size={22} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{file.title}</p>
                      <p className="text-sm text-gray-500">{file.size}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download size={20} className="text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "groups" && (
            <div className="text-center py-12 text-gray-500">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p>No study groups yet</p>
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">About</h3>
                <p className="text-gray-600">{user.bio || "No bio yet."}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <GraduationCap size={18} />
                <span>{user.department} at {user.institution}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} />
                <span>Abuja, Nigeria</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl">
            
            <img
              src={ user?.profileImage
              ? `${user.profileImage}?t=${Date.now()}`
              : studySpher}
              className="w-80 h-80 rounded-xl object-cover"
            />

            <button
              onClick={() => setIsModalOpen(false)}
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