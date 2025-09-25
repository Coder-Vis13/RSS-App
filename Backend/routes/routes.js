
const express = require("express");
const { homePage, addSource } = require("../controllers/controller");

const router = express.Router();

router.get("/", homePage);
router.post("/addSource", addSource);


module.exports = router;

