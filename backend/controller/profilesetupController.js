const multer = require("multer");
const path = require("path");
const pool = require("../config/db");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("profilePicture");

exports.getProfile = async (req, res) => {
  const userId = req.query.userId;
  try {
    const [profileRows] = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [userId]
    );

    if (profileRows.length === 0) {
      return res.json({ success: true, profile: null });
    }

    const profile = profileRows[0];
    if (profile.profile_picture) {
      profile.profile_picture_url = `${req.protocol}://${req.get("host")}/${
        profile.profile_picture
      }`;
    }

    res.json({ success: true, profile: profileRows[0] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      // Get all fields from the form data
      const {
        fullName,
        bio,
        title,
        department,
        phone,
        location,
        website,
        twitter,
        linkedin,
        userId,
      } = req.body;

      const profilePicture = req.file ? req.file.path : null;

      console.log("Received profile data:", {
        userId,
        fullName,
        bio,
        title,
        department,
        phone,
        location,
        website,
        twitter,
        linkedin,
        profilePicture,
      });

      const [existingProfile] = await pool.query(
        "SELECT * FROM user_profiles WHERE user_id = ?",
        [userId]
      );

      if (existingProfile.length > 0) {
        await pool.query(
          `UPDATE user_profiles SET 
              full_name = ?,
              bio = ?,
              title = ?,
              department = ?,
              phone = ?,
              location = ?,
              website = ?,
              twitter_handle = ?,
              linkedin_url = ?,
              profile_picture = COALESCE(?, profile_picture),
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?`,
          [
            fullName,
            bio,
            title,
            department,
            phone,
            location,
            website,
            twitter,
            linkedin,
            profilePicture,
            userId,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO user_profiles (
              user_id, full_name, bio, title, department, phone, 
              location, website, twitter_handle, linkedin_url, profile_picture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            fullName,
            bio,
            title,
            department,
            phone,
            location,
            website,
            twitter,
            linkedin,
            profilePicture,
          ]
        );
      }

      res.json({
        success: true,
        message: "Profile saved successfully",
        profilePicture: profilePicture ? path.basename(profilePicture) : null,
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save profile",
        error: error.message,
      });
    }
  });
};
