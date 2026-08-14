const express = require("express");
const router = express.Router();

const Post = require("../models/post");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { supabase } = require("../supabase/supabaseClient");
const path = require("path");
 

// ===============================
// CREATE POST
// ===============================
router.post(
  "/create",
  auth,
  upload.array("files", 10),
  async (req, res) => {
    try {

      const { content } = req.body;

      console.log("Content:", content);
      console.log("Files:", req.files);


      // Check if post is empty
      if (
        (!content || !content.trim()) &&
        (!req.files || req.files.length === 0)
      ) {
        return res.status(400).json({
          message: "Post cannot be empty",
        });
      }


      // ===============================
      // UPLOAD FILES TO SUPABASE
      // ===============================

      const uploadedFiles = [];


      if (req.files && req.files.length > 0) {

        for (const file of req.files) {

          const extension = path.extname(file.originalname);

          const fileName = `${req.user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${extension}`;


          // Determine file type
          let fileType;

          if (file.mimetype.startsWith("image/")) {
            fileType = "image";
          } 
          else if (file.mimetype.startsWith("video/")) {
            fileType = "video";
          } 
          else if (file.mimetype === "application/pdf") {
            fileType = "pdf";
          }


          const { error } = await supabase.storage
            .from("post-files")
            .upload(
              fileName,
              file.buffer,
              {
                contentType: file.mimetype,
                upsert: false,
              }
            );


          if (error) {
            console.error("Supabase upload error:", error);

            return res.status(500).json({
              message: "Failed to upload file",
              error: error.message,
            });
          }


          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("post-files")
            .getPublicUrl(fileName);


          uploadedFiles.push({
            url: publicUrl,
            type: fileType,
            name: file.originalname,
          });

        }
      }


      // ===============================
      // CREATE MONGODB POST
      // ===============================

      const post = new Post({
        author: req.user.id,

        content: content || "",

        files: uploadedFiles,
      });


      await post.save();


      // ===============================
      // RETURN RESPONSE
      // ===============================

      res.status(201).json({
        message: "Post created successfully",

        post,
      });


    } catch (err) {

      console.error("Create post error:", err);

      res.status(500).json({
        message: "Server error",
        error: err.message,
      });

    }
  }
);

router.get("/display", auth, async (req, res) => {
   try{
      const posts = await Post.find()
      .populate("author", "full_name profileImage department institution")
      .populate(
        "comments.user",
        "full_name profileImage"
      )
      .sort({ createdAt: -1 });


       const formattedPosts = posts.map((post) => {
          const liked = post.likes.some(
            (userId) =>
              userId.toString() === req.user.id.toString()
          );

          return {
            ...post.toObject(),
            liked,
            likesCount: post.likes.length,
            commentsCount: post.comments.length,
          };
        });

        res.status(200).json(formattedPosts);
   }catch(err){
      res.status(500).json({
            error: err.message,
        });
   }
})


// ===============================
// LIKE / UNLIKE POST
// ===============================
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userId = req.user.id;

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked
        ? "Post unliked"
        : "Post liked",

      liked: !alreadyLiked,

      likesCount: post.likes.length,

      post,
    });

  } catch (err) {
    console.error("Like post error:", err);

    res.status(500).json({
      message: "Failed to like post",
      error: err.message,
    });
  }
});

//comment session

router.post("/comment/:id", auth, async (req, res) => {
  try {
    const { comment } = req.body;

    // Validate comment
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Create comment
    const newComment = {
      user: req.user.id,
      text: comment.trim(),
    };

    // Add comment
    post.comments.push(newComment);

    // Save post
    await post.save();

    // Populate comment user
    await post.populate(
      "comments.user",
      "full_name profileImage"
    );

    // Get the newly added comment
    const addedComment =
      post.comments[post.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully",
      comment: addedComment,
      commentsCount: post.comments.length,
    });

  } catch (error) {
    console.error("Comment error:", error);

    res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
});

router.delete("/:postId", auth, async (req, res) => {
  try {
    // 1. Find the post
    const post = await Post.findById(req.params.postId);

    // 2. Check if post exists
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // 3. Check that the logged-in user owns the post
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You are not allowed to delete this post",
      });
    }

    // 4. Delete files from Supabase
    if (post.files && post.files.length > 0) {
      for (const file of post.files) {
        try {
          // Get the file path from the URL
          const url = new URL(file.url);
          const pathParts = url.pathname.split("/post-files/");

          if (pathParts[1]) {
            const filePath = decodeURIComponent(pathParts[1]);

            const { error } = await supabase.storage
              .from("post-files")
              .remove([filePath]);

            if (error) {
              console.log(
                "Supabase delete error:",
                error.message
              );
            }
          }
        } catch (fileError) {
          console.log(
            "Could not delete file:",
            fileError.message
          );
        }
      }
    }

    // 5. Delete post from MongoDB
    await post.deleteOne();

    // 6. Send response
    res.status(200).json({
      message: "Post deleted successfully",
      postId: req.params.postId,
    });

  } catch (error) {
    console.error("Delete post error:", error);

    res.status(500).json({
      message: "Failed to delete post",
      error: error.message,
    });
  }
});


//delete comment 

router.delete("/:postId/comment/:commentId", auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    // Check comment owner
    if (comment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own comment",
      });
    }

    // Delete comment
    comment.deleteOne();

    await post.save();

    res.status(200).json({
      message: "Comment deleted successfully",
      commentId: commentId,
    });

  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      message: "Failed to delete comment",
    });
  }
});

// ===============================
// GET INDIVIDUAL POST
// ===============================
router.get("/profile/:userId/posts", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({
      author: userId,
    })
      .populate(
        "author",
        "full_name profileImage department institution"
      )
      .populate(
        "comments.user",
        "full_name profileImage"
      )
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map((post) => ({
      ...post.toObject(),

      // Check if current user liked this post
      liked: post.likes.some(
        (id) =>
          id.toString() === req.user.id.toString()
      ),

      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.status(200).json(formattedPosts);

  } catch (error) {
    console.error("Get profile posts error:", error);

    res.status(500).json({
      message: "Failed to get profile posts",
    });
  }
});

module.exports = router;