import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import studySpher from "../assets/studySpher.jpeg";


export default function ProfillePostField({
  posts,
  profile,
  user,

  // Post functions coming from parent
  handleLike,
  handleComment,
  handleSubmitComment,
  handleDelete,
  handleDeleteComment,
  handleSharePost,
  handleShareComment,
}) {
  const navigate = useNavigate();

  // =====================================================
  // LOCAL UI STATES
  // =====================================================

  const [comment, setComment] = useState("");
  const [commentClick, setCommentClick] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [postMenu, setPostMenu] = useState(null);
  const [commentMenu, setCommentMenu] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(null);

  // =====================================================
  // FILTER PROFILE POSTS
  // =====================================================

  const profilePosts = posts.filter(
    (post) =>
      post.author?._id?.toString() ===
      profile?._id?.toString()
  );

  // =====================================================
  // FIND SELECTED POST FOR MODAL
  // =====================================================

  const selectedPost = posts.find(
    (post) => post._id === isModalOpen
  );

  // =====================================================
  // LOCAL COMMENT HANDLER
  // =====================================================

  const handleCommentClick = (postId) => {
    setCommentClick((prev) =>
      prev === postId ? null : postId
    );
  };

  // =====================================================
  // SUBMIT COMMENT
  // =====================================================

 const submitComment = async (postId) => {
  const text = comment?.trim();

  if (!text) return;

  try {
    setSubmitting(true);

    await handleSubmitComment(postId, text);

    setComment("");
  } finally {
    setSubmitting(false);
  }
};
  // =====================================================
  // POST OWNER
  // =====================================================

  const isPostOwner = (post) =>
    post.author?._id?.toString() ===
    user?._id?.toString();

  // =====================================================
  // COMMENT OWNER
  // =====================================================

  const isCommentOwner = (comment) =>
    comment.user?._id?.toString() ===
    user?._id?.toString();

  return (
    <div className="max-w-2xl mx-auto">

      {/* =================================================
          TITLE
      ================================================= */}

      <h2 className="text-2xl font-bold mb-6">
        Posts
      </h2>

      {/* =================================================
          NO POSTS
      ================================================= */}

      {profilePosts.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <p className="text-gray-500">
            No posts yet.
          </p>
        </div>
      )}

      {/* =================================================
          POSTS
      ================================================= */}

      <div className="space-y-6">

        {profilePosts.map((post) => (

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

              {/* =================================================
                  POST MENU
              ================================================= */}

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

                    {/* EDIT + DELETE */}

                    {isPostOwner(post) && (
                      <>
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

                        <button
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            handleDelete(
                              post._id
                            );

                            setPostMenu(null);
                          }}
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
                      setIsModalOpen(
                        post._id
                      )
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
                  handleCommentClick(
                    post._id
                  )
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
                onClick={() =>
                  handleSharePost(post)
                }
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
                      (c, index) => {

                        const commentOwner =
                          isCommentOwner(c);

                        return (

                          <div
                            key={
                              c._id ||
                              index
                            }
                            className="flex gap-3 group"
                            id={`comment-${c._id}`}
                          >

                            {/* USER IMAGE */}

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

                            {/* COMMENT BODY */}

                            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex-1">

                              {/* NAME + MENU */}

                              <div className="flex items-center justify-between">

                                <p className="text-sm font-semibold text-gray-800">
                                  {c.user
                                    ?.full_name ||
                                    "Unknown"}
                                </p>

                                {/* THREE DOTS */}

                                <div className="relative">

                                  <button
                                    className="
                                      opacity-0
                                      group-hover:opacity-100
                                      transition-opacity
                                      w-8 h-8
                                      rounded-full
                                      hover:bg-gray-100
                                      text-gray-500
                                    "
                                    onClick={() =>
                                      setCommentMenu(
                                        (prev) =>
                                          prev ===
                                          c._id
                                            ? null
                                            : c._id
                                      )
                                    }
                                  >
                                    ⋮
                                  </button>

                                  {/* COMMENT MENU */}

                                  {commentMenu ===
                                    c._id && (

                                    <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">

                                      {/* REPLY */}

                                      <button
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                        onClick={() => {
                                          console.log(
                                            "Reply:",
                                            c._id
                                          );

                                          setCommentMenu(
                                            null
                                          );
                                        }}
                                      >
                                        Reply
                                      </button>

                                      {/* SHARE */}

                                      <button
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                        onClick={() => {
                                          handleShareComment(
                                            post._id,
                                            c
                                          );

                                          setCommentMenu(
                                            null
                                          );
                                        }}
                                      >
                                        Share
                                      </button>

                                      {/* EDIT + DELETE */}

                                      {commentOwner && (
                                        <>
                                          <button
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                            onClick={() => {
                                              console.log(
                                                "Edit comment:",
                                                c._id
                                              );

                                              setCommentMenu(
                                                null
                                              );
                                            }}
                                          >
                                            Edit
                                          </button>

                                          <button
                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                              handleDeleteComment(
                                                post._id,
                                                c._id
                                              );

                                              setCommentMenu(
                                                null
                                              );
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}

                                    </div>
                                  )}

                                </div>

                              </div>

                              {/* COMMENT TEXT */}

                              <p className="text-sm text-gray-600 mt-0.5">
                                {c.text}
                              </p>

                              {/* DATE */}

                              <p className="text-xs text-gray-400 mt-1">
                                {c.createdAt
                                  ? new Date(
                                      c.createdAt
                                    ).toLocaleString()
                                  : ""}
                              </p>

                            </div>

                          </div>
                        );
                      }
                    )

                  ) : (

                    <p className="text-sm text-gray-400 text-center py-3">
                      No comments yet.
                      Be the first!
                    </p>

                  )}

                </div>

                {/* =================================================
                    ADD COMMENT
                ================================================= */}

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
                          submitComment(
                            post._id
                          );
                        }
                      }}
                    />

                    <button
                      onClick={() =>
                        submitComment(
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
        ))}

      </div>

      {/* =================================================
          FILE MODAL
      ================================================= */}

      {isModalOpen &&
        selectedPost && (

          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
            onClick={() =>
              setIsModalOpen(null)
            }
          >

            <div
              className="relative max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* BACK */}

              <button
                onClick={() =>
                  setIsModalOpen(null)
                }
                className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-gray-400 text-black hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
              >
                <ArrowLeft size={20} />
                Back
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
                          file.name ||
                          "PDF"
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