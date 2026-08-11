import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import studySpher from "../assets/studySpher.jpeg";
import { toast } from "react-toastify";
import API_URL from "../Api";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  const [comment, setComment] = useState("");
  const [commentClick, setCommentClick] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [postMenu, setPostMenu] = useState(null);

  // Stores the ID of the post whose files are open
  const [isModalOpen, setIsModalOpen] = useState(null);
  const navigate = useNavigate();

  // =====================================================
  // LIKE POST
  // =====================================================
  const handleLike = async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${id}/like`,
        {},
        {
          withCredentials: true,
        }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === id
            ? {
                ...post,
                likes: res.data.post.likes,
                liked: res.data.liked,
                likesCount: res.data.likesCount,
              }
            : post
        )
      );
    } catch (error) {
      console.log(
        "Like error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to like post"
      );
    }
  };

  // =====================================================
  // OPEN / CLOSE COMMENT
  // =====================================================
  const handleComment = (id) => {
    setCommentClick((prev) =>
      prev === id ? null : id
    );
  };

  // =====================================================
  // SUBMIT COMMENT
  // =====================================================
  const handleSubmitComment = async (id) => {
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_URL}/api/posts/comment/${id}`,
        {
          comment: comment.trim(),
        },
        {
          withCredentials: true,
        }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === id
            ? {
                ...post,
                comments: [
                  ...(post.comments || []),
                  res.data.comment,
                ],
                commentsCount: res.data.commentsCount,
              }
            : post
        )
      );

      setComment("");

      toast.success("Comment successfully added");
    } catch (error) {
      console.log(
        "Comment error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to post comment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE POST
  // =====================================================
  const handleDelete = async (postId) => {
    try {
      await axios.delete(
        `${API_URL}/api/posts/${postId}`,
        {
          withCredentials: true,
        }
      );

      setPosts((prevPosts) =>
        prevPosts.filter(
          (post) => post._id !== postId
        )
      );

      setPostMenu(null);

      toast.success("Post deleted successfully");
    } catch (error) {
      console.log(
        "Delete error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete post"
      );
    }
  };

  // =====================================================
  // FETCH USER + POSTS
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // -----------------------------
        // GET LOGGED-IN USER
        // -----------------------------
        const userRes = await axios.get(
          `${API_URL}/api/register/details`,
          {
            withCredentials: true,
          }
        );

        setUser(userRes.data);

        // -----------------------------
        // GET POSTS
        // -----------------------------
        const postRes = await axios.get(
          `${API_URL}/api/posts/display`,
          {
            withCredentials: true,
          }
        );

        setPosts(postRes.data);
      } catch (error) {
        console.log(
          "Fetch error:",
          error.response?.data || error.message
        );
      }
    };

    fetchData();
  }, []);

  // =====================================================
  // FIND POST FOR MODAL
  // =====================================================
  const selectedPost = posts.find(
    (post) => post._id === isModalOpen
  );

  return (
    <div className="max-w-2xl mx-auto">

      {/* =================================================
          PAGE TITLE
      ================================================= */}
      <h2 className="text-2xl font-bold mb-6">
        Latest Posts
      </h2>

      {/* =================================================
          POSTS
      ================================================= */}
      <div className="space-y-6">

        {posts.map((post) => {

          // Check if current logged-in user owns this post
          const isOwner =
            post.author?._id?.toString() ===
            user?._id?.toString();

          return (
            <div
              key={post._id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >

              {/* =================================================
                  POST HEADER
              ================================================= */}
              <div className="p-5 flex items-center justify-between">

                {/* AUTHOR */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/profile/${post.author?._id}`
                    )
                  }
                >
                  <img
                    src={
                      post.author?.profileImage ||
                      studySpher
                    }
                    alt={
                      post.author?.full_name ||
                      "User"
                    }
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100"
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      {post.author?.full_name ||
                        "Unknown User"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(
                            post.createdAt
                          ).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>

                {/* POST MENU */}
                <div className="relative">

                  <button
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                    onClick={() =>
                      setPostMenu((prev) =>
                        prev === post._id
                          ? null
                          : post._id
                      )
                    }
                  >
                    ⋮
                  </button>

                  {postMenu === post._id && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">

                      {/* SAVE */}
                      <button
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                        onClick={() => {
                          console.log(
                            "Save:",
                            post._id
                          );

                          setPostMenu(null);
                        }}
                      >
                        Save
                      </button>

                      {/* OWNER OPTIONS */}
                      {isOwner && (
                        <>
                          {/* EDIT */}
                          <button
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                            onClick={() => {
                              console.log(
                                "Edit:",
                                post._id
                              );

                              setPostMenu(null);
                            }}
                          >
                            Edit
                          </button>

                          {/* DELETE */}
                          <button
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleDelete(post._id)
                            }
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  POST CONTENT
              ================================================= */}
              <div className="px-5 pb-5">

                {post.content && (
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {post.content}
                  </p>
                )}

                {/* =================================================
                    POST FILES
                ================================================= */}
                {post.files?.map(
                  (file, index) => (
                    <div
                      key={index}
                      className="mb-3 cursor-pointer"
                      onClick={() =>
                        setIsModalOpen(post._id)
                      }
                    >

                      {/* IMAGE */}
                      {file.type === "image" && (
                        <img
                          src={file.url}
                          alt={
                            file.name ||
                            "Post image"
                          }
                          className="rounded-2xl w-full object-cover max-h-[420px]"
                        />
                      )}

                      {/* VIDEO */}
                      {file.type === "video" && (
                        <video
                          src={file.url}
                          controls
                          className="rounded-2xl w-full max-h-[420px]"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        />
                      )}

                      {/* PDF */}
                      {file.type === "pdf" && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl text-indigo-600 font-medium"
                        >
                          <span className="text-2xl">
                            📄
                          </span>

                          <span>
                            {file.name ||
                              "View PDF"}
                          </span>
                        </a>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}
              <div className="border-t px-5 py-4 flex items-center justify-between text-gray-500">

                {/* LIKE */}
                <button
                  onClick={() =>
                    handleLike(post._id)
                  }
                  className={`flex items-center gap-2 transition-colors group ${
                    post.liked
                      ? "text-red-500"
                      : "hover:text-red-500"
                  }`}
                >
                  <Heart
                    size={22}
                    className="group-hover:scale-110 transition-transform"
                    fill={
                      post.liked
                        ? "currentColor"
                        : "none"
                    }
                  />

                  <span className="font-medium">
                    {post.likes?.length || 0}
                  </span>
                </button>

                {/* COMMENTS */}
                <button
                  className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                  onClick={() =>
                    handleComment(post._id)
                  }
                >
                  <MessageCircle size={22} />

                  <span className="font-medium">
                    {post.comments?.length || 0}
                  </span>
                </button>

                {/* SHARE */}
                <button
                  className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                >
                  <Share2 size={22} />
                </button>

                {/* BOOKMARK */}
                <button
                  className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                >
                  <Bookmark size={22} />
                </button>
              </div>

              {/* =================================================
                  COMMENT SECTION
              ================================================= */}
              {commentClick === post._id && (
                <div className="border-t px-5 py-4 bg-gray-50">

                  {/* EXISTING COMMENTS */}
                  <div className="space-y-4 mb-5 max-h-64 overflow-y-auto">

                    {post.comments?.length > 0 ? (
                      post.comments.map(
                        (c, index) => (
                          <div
                            key={
                              c._id || index
                            }
                            className="flex gap-3"
                          >

                            <img
                              src={
                                c.user
                                  ?.profileImage ||
                                studySpher
                              }
                              alt={
                                c.user
                                  ?.full_name ||
                                "User"
                              }
                              className="w-8 h-8 rounded-full object-cover"
                            />

                            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex-1">

                              <p className="text-sm font-semibold text-gray-800">
                                {c.user
                                  ?.full_name ||
                                  "Unknown"}
                              </p>

                              <p className="text-sm text-gray-600 mt-0.5">
                                {c.text}
                              </p>

                              <p className="text-xs text-gray-400 mt-1">
                                {c.createdAt
                                  ? new Date(
                                      c.createdAt
                                    ).toLocaleString()
                                  : ""}
                              </p>

                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-3">
                        No comments yet. Be the first!
                      </p>
                    )}
                  </div>

                  {/* ADD COMMENT */}
                  <div className="flex gap-3">

                    <img
                      src={
                        user?.profileImage ||
                        studySpher
                      }
                      alt={
                        user?.full_name ||
                        "User"
                      }
                      className="w-9 h-9 rounded-full object-cover"
                    />

                    <div className="flex-1">

                      <input
                        type="text"
                        value={comment}
                        onChange={(e) =>
                          setComment(
                            e.target.value
                          )
                        }
                        placeholder={`Comment as ${
                          user?.full_name ||
                          "User"
                        }`}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter"
                          ) {
                            handleSubmitComment(
                              post._id
                            );
                          }
                        }}
                      />

                      <button
                        onClick={() =>
                          handleSubmitComment(
                            post._id
                          )
                        }
                        disabled={
                          submitting ||
                          !comment.trim()
                        }
                        className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm font-medium"
                      >
                        {submitting
                          ? "Posting..."
                          : "Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =================================================
          LOAD MORE
      ================================================= */}
      <div className="flex justify-center mt-8">

        <button
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-colors"
          onClick={() =>
            window.location.reload()
          }
        >
          Load More Posts
        </button>

      </div>

      {/* =================================================
          FILE MODAL
      ================================================= */}
      {isModalOpen && selectedPost && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={() =>
            setIsModalOpen(null)
          }
        >

          <div
            className="relative  rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CLOSE BUTTON */}
            <button
              onClick={() =>
                setIsModalOpen(null)
              }
              className="absolute hover:bg-gray-200 top-3 right-3 z-10 w-10 h-10  hover:text-red-400 rounded-full text-gray-700 font-bold"
            >
              <X size={22} />
            </button>

            {/* FILES */}
            {selectedPost.files?.map(
              (file, index) => (
                <div
                  key={index}
                  className="mb-4"
                >

                  {/* IMAGE */}
                  {file.type === "image" && (
                    <img
                      src={file.url}
                      alt={
                        file.name ||
                        "Post image"
                      }
                      className="rounded-xl w-full max-h-[80vh] object-contain"
                    />
                  )}

                  {/* VIDEO */}
                  {file.type === "video" && (
                    <video
                      src={file.url}
                      controls
                      autoPlay
                      className="rounded-xl w-full max-h-[80vh]"
                    />
                  )}

                  {/* PDF */}
                  {file.type === "pdf" && (
                    <iframe
                      src={file.url}
                      title={
                        file.name || "PDF"
                      }
                      className="w-full h-[80vh] rounded-xl"
                    />
                  )}

                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
