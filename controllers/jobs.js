const parse_v = require("../util/parse_v_error");
const Job = require("../models/Job");

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id });
    res.render("jobs", { jobs });
  } catch (e) {
    next(e);
  }
};

const addJob = (req, res) => {
  res.render("job");
};

const createJob = async (req, res, next) => {
  req.body.createdBy = req.user._id;
  try {
    await Job.create(req.body);
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parse_v(e, req);
    } else {
      return next(e);
    }
    return res.render("job");
  }
  req.flash("info", "The job entry was created.");
  res.redirect("/jobs");
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      createdBy: req.user._id,
      _id: req.params.id,
    });
    if (!job) {
      req.flash("error", "The job entry could not be found.");
    } else {
      req.flash("info", "The job entry was deleted.");
    }
  } catch (e) {
    console.log("Error deleting job:", e.message);
    req.flash("error", "The job entry could not be deleted.");
  }
  res.redirect("/jobs");
};

module.exports = { getJobs, addJob, createJob, deleteJob };
