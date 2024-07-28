const express = require("express");
const router = express.Router();

const { getJobs, addJob, createJob, deleteJob, editJob, updateJob } = require("../controllers/jobs")

router.get("/", getJobs);

router.get("/showJobCreate", addJob);

router.post("/update/:id", updateJob);

router.post("/", createJob);

router.get("/edit/:id", editJob);

router.post("/delete/:id", deleteJob)

module.exports=router