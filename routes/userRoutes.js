import express from "express";
import { loginUser, registerUser, logoutUser, validateUser, googleLogin, getAllUsers } from "../User/controller.js";
import { isUser } from "../middleware/auth.js";

const router = express.Router();

// SignUP Route
router.post("/register", registerUser);

router.get("/all", getAllUsers);

// SIGNIN Route
router.post("/login", loginUser);

// VALIDATE Route
router.get("/validate", isUser, validateUser);

// LOGOUT Route
router.get("/logout", isUser, logoutUser);

// Google Login Route
router.post("/googlelogin", googleLogin);


export default router;