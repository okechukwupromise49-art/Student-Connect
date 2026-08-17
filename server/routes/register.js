const express = require("express")
const router = express.Router()
const User = require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const upload = require("../middleware/upload");
const path = require("path");
const { supabase } = require("../supabase/supabaseClient.js")


router.post("/register", async(req,res) => {
    try{
        const {full_name, email, password, institution, department, confirmPassword} = req.body

        if (
            !full_name ||
            !email ||
            !password ||
            !confirmPassword ||
            !institution ||
            !department
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const existEmail = await User.findOne({ email })

        if(existEmail){
            return res.status(400).json({ message: "Email already exists" });
        }

        if(password !== confirmPassword){
            return res.status(400).json({ message : "Recheck Your Password"})

        }

        if(password.length < 6){
            return res.status(400).json({ message : "Password must be more than six character"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const user = new User({
            department,
            institution,
            full_name,
            email,
            password: hashedPassword,
        
        });

        await user.save();
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {
      expiresIn:"7d"
    })

    res.cookie("token", token, {
            httpOnly: true,
            secure: true, // true in production (HTTPS)
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
            message: "User registered",
            token,
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                department: user.department,
                institution: user.institution,
            }
            })


    } catch(err){
        console.error(err);
        res.status(400).json({ error: err.message });
    }
})


router.post("/login", async (req,res) => {
    try{
        const {email, password} = req.body

        if(!email || !password){
            return res.status(400).json({ message: "Please enter email and password" });
        }

        const user = await User.findOne({ email })
        if(!user){
            return res.status(400).json({message: "User not found"})
        }

        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Incorrect Password"})
        }

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {
            expiresIn:"7d"
            })

        res.cookie("token", token, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

      res.json({
        token,
        user: {
            id: user._id,
            full_name: user.full_name,
            email: user.email,
           
        }
        });
    }catch(err){
            console.error(err);

            res.status(500).json({
                message: "Server error",
                error: err.message,
            });
    }
})


router.get("/details", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
        
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(user);

    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

router.put("/editProfile", 
    auth,
    upload.single("profileImage"),
    async (req, res) => {
    try{
    

        const user = await User.findById(req.user.id)

        if(!user){
            return res.status(404).json({message: "User not found"})
        }

        const { full_name, bio, institution, department } = req.body;

            if (full_name) user.full_name = full_name;
            if (bio) user.bio = bio;
            if (institution) user.institution = institution;
            if (department) user.department = department;


            //Upload new profile image
      if (req.file) {
        // Same filename for every user
        const fileName = `${user._id}${path.extname(req.file.originalname)}`;


        await supabase.storage
          .from("profile-images")
          .remove([fileName]);
        

            
           const { data, error } = await supabase.storage
          .from("stackmobile")
          .upload(fileName, req.file.buffer, {
            upsert: true,
            contentType: req.file.mimetype,
          });

        console.log("Upload data:", data);
        console.log("Upload error:", error);
          
          if (error) {
          return res.status(500).json({
            message: error.message,
          });
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("stackmobile")
          .getPublicUrl(fileName);

        user.profileImage = publicUrl;
        console.log("PUBLIC URL:", publicUrl);


        console.log("PROFILE IMAGE BEFORE SAVE:", user.profileImage);
      }

      await user.save();
      console.log("USER AFTER SAVE:", user);

      res.json({
        message: "Profile updated successfully",
        user,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
      });
    } 
})

router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id }
    }).select(
      "full_name profileImage department institution followers following"
    );

    const formattedUsers = users.map((user) => ({
      ...user.toObject(),
      isFollowing: user.followers?.some(
        (id) => id.toString() === req.user.id.toString()
      ) || false
    }));

    res.status(200).json(formattedUsers);

  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
});


router.post("/follow/:userId", auth, async(req,res) => {
    try {
    const targetId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = currentUser.following?.includes(targetId);

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following.pull(targetId);
      targetUser.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();

      return res.json({ isFollowing: false });
    } else {
      // Follow
      currentUser.following.push(targetId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      return res.json({ isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

 module.exports = router