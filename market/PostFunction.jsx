import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "./src/Api";

export default function usePostFunctions({
  posts,
  setPosts,

  comment,
  setComment,

  setSubmitting,
  setCommentClick,

  setPostMenu,
  setCommentMenu,

  isModalOpen,
}) {

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

                commentsCount:
                  res.data.commentsCount,
              }
            : post
        )
      );

      setComment("");

      toast.success(
        "Comment successfully added"
      );

    } catch (error) {

      console.log(
        "Comment error:",
        error.response?.data ||
        error.message
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

      toast.success(
        "Post deleted successfully"
      );

    } catch (error) {

      console.log(
        "Delete error:",
        error.response?.data ||
        error.message
      );

      toast.error(
        error.response?.data?.message ||
        "Failed to delete post"
      );
    }
  };


  // =====================================================
  // DELETE COMMENT
  // =====================================================

  const handleDeleteComment = async (
    postId,
    commentId
  ) => {

    try {

      await axios.delete(
        `${API_URL}/api/posts/${postId}/comment/${commentId}`,
        {
          withCredentials: true,
        }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) => {

          if (post._id !== postId) {
            return post;
          }

          return {
            ...post,

            comments: (
              post.comments || []
            ).filter(
              (comment) =>
                comment._id !== commentId
            ),
          };
        })
      );

      setCommentMenu(null);

      toast.success(
        "Comment deleted successfully"
      );

    } catch (error) {

      console.error(
        "Delete comment error:",
        error.response?.data ||
        error.message
      );

      toast.error(
        error.response?.data?.message ||
        "Failed to delete comment"
      );
    }
  };


  // =====================================================
  // FIND POST FOR MODAL
  // =====================================================

  const selectedPost = posts.find(
    (post) => post._id === isModalOpen
  );


  // =====================================================
  // SHARE POST
  // =====================================================

  const handleSharePost = async (post) => {

    const shareUrl =
      `${window.location.origin}/post/${post._id}`;

    try {

      if (navigator.share) {

        await navigator.share({
          title:
            `${post.author?.full_name || "StudyConnect"}'s post`,

          text:
            post.content ||
            "Check out this post on StudyConnect",

          url: shareUrl,
        });

      } else {

        await navigator.clipboard.writeText(
          shareUrl
        );

        toast.success(
          "Post link copied!"
        );
      }

    } catch (error) {

      if (error.name !== "AbortError") {

        console.error(
          "Share error:",
          error
        );

        toast.error(
          "Unable to share post"
        );
      }
    }
  };


  // =====================================================
  // SHARE COMMENT
  // =====================================================

  const handleShareComment = async (
    postId,
    comment
  ) => {

    const shareUrl =
      `${window.location.origin}/post/${postId}#comment-${comment._id}`;

    try {

      if (navigator.share) {

        await navigator.share({
          title:
            `${comment.user?.full_name || "User"}'s comment`,

          text:
            comment.text,

          url: shareUrl,
        });

      } else {

        await navigator.clipboard.writeText(
          shareUrl
        );

        toast.success(
          "Comment link copied!"
        );
      }

    } catch (error) {

      if (error.name !== "AbortError") {

        console.error(
          "Share comment error:",
          error
        );

        toast.error(
          "Unable to share comment"
        );
      }
    }
  };


  // =====================================================
  // RETURN
  // =====================================================

  return {
    handleLike,
    handleComment,
    handleSubmitComment,

    handleDelete,
    handleDeleteComment,

    handleSharePost,
    handleShareComment,

    selectedPost,
  };
}