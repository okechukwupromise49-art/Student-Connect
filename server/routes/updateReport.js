const express = require("express");
const router = express.Router();

const UpdateReport = require("../models/updateReport");
const Update = require("../models/update");
const auth = require("../middleware/auth");

// ===============================
// REPORT AN UPDATE
// ===============================
router.post("/:updateId", auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const { updateId } = req.params;

    if (!reason) {
      return res.status(400).json({
        message: "Report reason is required",
      });
    }

    const update = await Update.findById(updateId);

    if (!update) {
      return res.status(404).json({
        message: "Update not found",
      });
    }

    // Don't allow author to report their own update
    if (update.author.toString() === req.user.id.toString()) {
      return res.status(400).json({
        message: "You cannot report your own update",
      });
    }

    // Prevent same user from reporting same update repeatedly
    const existingReport = await UpdateReport.findOne({
      update: updateId,
      reporter: req.user.id,
      status: "pending",
    });

    if (existingReport) {
      return res.status(400).json({
        message: "You have already reported this update",
      });
    }

    const report = await UpdateReport.create({
      update: updateId,
      reporter: req.user.id,
      reason,
      description: description?.trim() || "",
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("Report update error:", error);

    res.status(500).json({
      message: "Failed to report update",
      error: error.message,
    });
  }
});

// ===============================
// ADMIN - GET REPORTS
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const reports = await UpdateReport.find()
      .populate("reporter", "full_name profileImage")
      .populate({
        path: "update",
        populate: {
          path: "author",
          select: "full_name profileImage",
        },
      })
      .populate("reviewedBy", "full_name")
      .sort({ status: 1, createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Get reports error:", error);

    res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
});

// ===============================
// ADMIN - KEEP UPDATE
// ===============================
router.patch("/:reportId/keep", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const report = await UpdateReport.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    report.status = "kept";
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    res.status(200).json({
      message: "Report dismissed. Update kept.",
      report,
    });
  } catch (error) {
    console.error("Keep report error:", error);

    res.status(500).json({
      message: "Failed to keep update",
      error: error.message,
    });
  }
});

// ===============================
// ADMIN - DELETE UPDATE
// ===============================
router.patch("/:reportId/delete", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const report = await UpdateReport.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    const update = await Update.findById(report.update);

    if (update) {
      await update.deleteOne();
    }

    report.status = "deleted";
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    res.status(200).json({
      message: "Update deleted successfully",
    });
  } catch (error) {
    console.error("Delete reported update error:", error);

    res.status(500).json({
      message: "Failed to delete update",
      error: error.message,
    });
  }
});

module.exports = router;