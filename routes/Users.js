const express = require("express");
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");

const router = express.Router();

router.get("/get/all", getAllUsers);
router.get("/get/:userId", getUser);
router.post("/create/", createUser);
router.patch("/update", updateUser);
router.delete("/delete", deleteUser);

module.exports = router;
