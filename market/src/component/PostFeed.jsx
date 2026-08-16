import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import studySpher from "../assets/studySpher.jpeg";
import { toast } from "react-toastify";
import API_URL from "../Api";

export default function PostFeed() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  const [comment, setComment] = useState("");
  const [commentClick, setCommentClick] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [postMenu, setPostMenu] = useState(null);
  const [commentMenu, setCommentMenu] = useState(null);

  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(null);

  // =====================================================
  // FETCH USER + POSTS
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(
          `${API_URL}/api/register/details`,
          { withCredentials: true }
        );
        setUser(userRes.data);

        const postRes = await axios.get(
          `${API_URL}/api/posts/display`,
          { withCredentials: true }
        );
        setPosts(postRes.data);
      } catch (error) {
        console.log("Fetch error:", error.response?.data || error.message);
      }
    };

    fetchData();
  }, []);

  // =====================================================
  // LIKE
  // =====================================================
  const handleLike = async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${id}/like`,
        {},
        { withCredentials: true }
      );

      setPosts((prev) =>
        prev.map((post) =>
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
      toast.error(error.response?.data?.message || "Failed to like post");
    }
  };

  // =====================================================
  // COMMENT
  // =====================================================
  const handleSubmitComment = async (postId) => {
    const text = comment.trim();
    if (!text) return;

    try {
      setSubmitting(true);

      const res = await axios.post(
        `${API_URL}/api/posts/comment/${postId}`,
        { comment: text },
        { withCredentials: true }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), res.data.comment],
                commentsCount: res.data.commentsCount,
              }
            : post
        )
      );

      setComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // REPLY
  // =====================================================
  const handleSubmitReply = async (postId, commentId) => {
    const text = replyText.trim();
    if (!text) return;

    try {
      setReplySubmitting(true);

      const res = await axios.post(
        `${API_URL}/api/posts/comment/${postId}/${commentId}/reply`,
        { reply: text },
        { withCredentials: true }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((c) =>
                  c._id === commentId
                    ? {
                        ...c,
                        replies: [...(c.replies || []), res.data.reply],
                      }
                    : c
                ),
              }
            : post
        )
      );

      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  // =====================================================
  // DELETE POST
  // =====================================================
  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        withCredentials: true,
      });

      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setPostMenu(null);
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  // =====================================================
  // DELETE COMMENT
  // =====================================================
  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(
        `${API_URL}/api/posts/${postId}/comment/${commentId}`,
        { withCredentials: true }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: (post.comments || []).filter(
                  (c) => c._id !== commentId
                ),
              }
            : post
        )
      );

      setCommentMenu(null);
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete comment"
      );
    }
  };

  // =====================================================
  // SHARE
  // =====================================================
  const handleSharePost = async (post) => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author?.full_name || "StudyConnect"}'s post`,
          text: post.content || "Check out this post",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Unable to share");
      }
    }
  };

  const handleShareComment = async (postId, comment) => {
    const shareUrl = `${window.location.origin}/post/${postId}#comment-${comment._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${comment.user?.full_name || "User"}'s comment`,
          text: comment.text,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Comment link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Unable to share comment");
      }
    }
  };

  const selectedPost = posts.find((p) => p._id === isModalOpen);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>

      <div className="space-y-6">
        {posts.map((post) => {
          const isOwner =
            post.author?._id?.toString() === user?._id?.toString();

          return (
            <div
              key={post._id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* HEADER */}
              <div className="p-5 flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/profile/${post.author?._id}`)}
                >
                  <img
                    src={post.author?.profileImage || studySpher}
                    alt={post.author?.full_name || "User"}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {post.author?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString()
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
                        prev === post._id ? null : post._id
                      )
                    }
                  >
                    ⋮
                  </button>

                  {postMenu === post._id && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                      <button
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                        onClick={() => setPostMenu(null)}
                      >
                        Save
                      </button>

                      {isOwner && (
                        <>
                          <button
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                            onClick={() => setPostMenu(null)}
                          >
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(post._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="px-5 pb-5">
                {post.content && (
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {post.content}
                  </p>
                )}

                {post.files?.map((file, index) => (
                  <div
                    key={index}
                    className="mb-3 cursor-pointer"
                    onClick={() => setIsModalOpen(post._id)}
                  >
                    {file.type === "image" && (
                      <img
                        src={file.url}
                        alt={file.name || "Post image"}
                        className="rounded-2xl w-full object-cover max-h-[420px]"
                      />
                    )}

                    {file.type === "video" && (
                      <video
                        src={file.url}
                        controls
                        className="rounded-2xl w-full max-h-[420px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {file.type === "pdf" && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl text-indigo-600 font-medium"
                      >
                        <span className="text-2xl">📄</span>
                        <span>{file.name || "View PDF"}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="border-t px-5 py-4 flex items-center justify-between text-gray-500">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center gap-2 ${
                    post.liked ? "text-red-500" : "hover:text-red-500"
                  }`}
                >
                  <Heart
                    size={22}
                    fill={post.liked ? "currentColor" : "none"}
                  />
                  <span className="font-medium">
                    {post.likes?.length || 0}
                  </span>
                </button>

                <button
                  className="flex items-center gap-2 hover:text-indigo-600"
                  onClick={() =>
                    setCommentClick((prev) =>
                      prev === post._id ? null : post._id
                    )
                  }
                >
                  <MessageCircle size={22} />
                  <span className="font-medium">
                    {post.comments?.length || 0}
                  </span>
                </button>

                <button
                  className="flex items-center gap-2 hover:text-indigo-600"
                  onClick={() => handleSharePost(post)}
                >
                  <Share2 size={22} />
                </button>

                <button className="flex items-center gap-2 hover:text-amber-500">
                  <Bookmark size={22} />
                </button>
              </div>

              {/* COMMENTS SECTION */}
              {commentClick === post._id && (
                <div className="border-t px-5 py-4 bg-gray-50">
                  {/* Existing Comments */}
                  <div className="space-y-4 mb-5 max-h-72 overflow-y-auto">
                    {post.comments?.length > 0 ? (
                      post.comments.map((c) => {
                        const commentOwner =
                          c.user?._id?.toString() ===
                          user?._id?.toString();

                        return (
                          <div key={c._id} className="flex gap-3 group">
                            <img
                              src={c.user?.profileImage || studySpher}
                              alt={c.user?.full_name || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                            />

                            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-800">
                                  {c.user?.full_name || "Unknown"}
                                </p>

                                <div className="relative">
                                  <button
                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500"
                                    onClick={() =>
                                      setCommentMenu((prev) =>
                                        prev === c._id ? null : c._id
                                      )
                                    }
                                  >
                                    ⋮
                                  </button>

                                  {commentMenu === c._id && (
                                    <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                        onClick={() => {
                                          setReplyingTo(c._id);
                                          setReplyText("");
                                          setCommentMenu(null);
                                        }}
                                      >
                                        Reply
                                      </button>

                                      <button
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                        onClick={() => {
                                          handleShareComment(post._id, c);
                                          setCommentMenu(null);
                                        }}
                                      >
                                        Share
                                      </button>

                                      {commentOwner && (
                                        <button
                                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                          onClick={() =>
                                            handleDeleteComment(
                                              post._id,
                                              c._id
                                            )
                                          }
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 mt-0.5">
                                {c.text}
                              </p>

                              <p className="text-xs text-gray-400 mt-1">
                                {c.createdAt
                                  ? new Date(c.createdAt).toLocaleString()
                                  : ""}
                              </p>

                              {/* Replies */}
                              {c.replies?.length > 0 && (
                                <div className="mt-3 ml-2 space-y-3">
                                  {c.replies.map((reply) => (
                                    <div
                                      key={reply._id}
                                      className="flex gap-2"
                                    >
                                      <img
                                        src={
                                          reply.user?.profileImage ||
                                          studySpher
                                        }
                                        alt={
                                          reply.user?.full_name || "User"
                                        }
                                        className="w-7 h-7 rounded-full object-cover"
                                      />
                                      <div className="bg-gray-50 px-3 py-2 rounded-xl flex-1">
                                        <p className="text-xs font-semibold text-gray-800">
                                          {reply.user?.full_name ||
                                            "Unknown"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {reply.text}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                          {reply.createdAt
                                            ? new Date(
                                                reply.createdAt
                                              ).toLocaleString()
                                            : ""}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply Input */}
                              {replyingTo === c._id && (
                                <div className="mt-3 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    placeholder={`Reply to ${
                                      c.user?.full_name || "User"
                                    }`}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSubmitReply(post._id, c._id);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() =>
                                      handleSubmitReply(post._id, c._id)
                                    }
                                    disabled={
                                      replySubmitting || !replyText.trim()
                                    }
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                                  >
                                    {replySubmitting ? "..." : "Reply"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-3">
                        No comments yet. Be the first!
                      </p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <img
                      src={user?.profileImage || studySpher}
                      alt={user?.full_name || "User"}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Comment as ${
                          user?.full_name || "User"
                        }`}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSubmitComment(post._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSubmitComment(post._id)}
                        disabled={submitting || !comment.trim()}
                        className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {submitting ? "Posting..." : "Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LOAD MORE */}
      <div className="flex justify-center mt-8">
        <button
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          Load More Posts
        </button>
      </div>

      {/* FILE MODAL */}
      {isModalOpen && selectedPost && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={() => setIsModalOpen(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(null)}
              className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-gray-400 text-black hover:bg-indigo-50 hover:text-indigo-600 font-medium"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            {selectedPost.files?.map((file, index) => (
              <div key={index} className="mb-4">
                {file.type === "image" && (
                  <img
                    src={file.url}
                    alt={file.name || "Post image"}
                    className="rounded-xl w-full max-h-[80vh] object-contain"
                  />
                )}
                {file.type === "video" && (
                  <video
                    src={file.url}
                    controls
                    autoPlay
                    className="rounded-xl w-full max-h-[80vh]"
                  />
                )}
                {file.type === "pdf" && (
                  <iframe
                    src={file.url}
                    title={file.name || "PDF"}
                    className="w-full h-[80vh] rounded-xl"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}