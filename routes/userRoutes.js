import express from "express";
import { loginUser, registerUser, logoutUser, validateUser, forgotPassword, resetPassword } from "../Controllers/userController.js";
import { isUser } from "../middleware/auth.js";
import User from "../mongoDB/model.js";
import passport from "passport";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

//test route
router.get("/", (req, res) => {
	res.status(200).json({ message: "ADVITIYA Server is running on secure connection." });
});

// SignUP Route
router.post("/register", registerUser);

// SIGNIN Route
router.post("/login", loginUser);

// VALIDATE Route
router.get("/validate", isUser, validateUser);

// LOGOUT Route
router.get("/logout", isUser, logoutUser);

//Forgot Password
router.post("/password/forgot", forgotPassword);

//Reset Password
router.put("/password/reset/:userId/:token", resetPassword);

// Google Login Route
router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

router.get("/auth/google/callback", (req, res, next) => {
	passport.authenticate("google", async (err, user, info) => {
		if (err) {
			console.error(err);
			return next(err);
		}
		if (!user) {
			// Handle authentication failure
			console.log("Authentication failed");
			return res.redirect(`${process.env.REACT_APP_URL}/login`);
		}

		try {
			// Check if the user already exists in the database based on the email
			const existingUser = await User.findOne({ email: user.email });

			if (existingUser) {
				// User already exists, log in the user
				req.logIn(existingUser, (loginErr) => {
					if (loginErr) {
						console.error(loginErr);
						return next(loginErr);
					}
					console.log("Existing user logged in:", existingUser);
					return res.redirect(`${process.env.REACT_APP_URL}/dashboard`);
				});
			} else {
				// User does not exist, log in the new user
				req.logIn(user, (loginErr) => {
					if (loginErr) {
						console.error(loginErr);
						return next(loginErr);
					}
					console.log("New user logged in:", user);
					// Redirect with user's name, email, and image as query parameters
					const redirectUrl = `${process.env.REACT_APP_URL}/google-auth/mobile?image=${user.image}&name=${user.displayName}&email=${user.email}`;
					return res.redirect(redirectUrl);
				});
			}
		} catch (dbError) {
			console.error("Database error:", dbError);
			return next(dbError);
		}
	})(req, res, next);
});

router.get("/auth/google/login/success", async (req, res) => {
	console.log(req.user);
	if (req.user) {
		try {
			const isUser = await User.findOne({ email: req.user.email });

			if (isUser) {
				// User exists in the database
				const token = await isUser.generateAuthToken();

				res.json({
					success: true,
					message: "User has successfully authenticated",
					user: req.user,
					token: token,
				});
			} else {
				res.json({
					success: false,
					message: "User not found in the database",
				});
			}
		} catch (error) {
			console.error("Error finding user:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	} else {
		res.json({
			success: false,
			message: "User has not been authenticated",
		});
	}
});
router.post("/auth/google/register", async (req, res) => {
	const { name, email, mobile, college } = req.body;
	try {
		const isMobile = await User.findOne({ mobile: mobile });
		if (isMobile) {
			return res.status(422).json({ message: "Mobile number already exists in Database" });
		}
		const newUser = await User.create({ name, email, mobile, college_name: college });

		const token = await newUser.generateAuthToken();
		await newUser.save();

		// sending email
		const message = "User registered successfully at ADVITIYA Website. Please login to continue!";
		sendEmail({
			email: newUser.email,
			subject: "User Registered Successfully!",
			message,
		})
			.then((info) => {
				console.log("User Registered Successfully & verification email sent.");
				res.status(201).json({ message: "User registered successfully", success: true, user: newUser, token, emailInfo: info });
			})
			.catch((error) => {
				console.error(error.message);
				res.status(500).json({ message: "Something went wrong while sending the email", error });
			});
	} catch (err) {
		res.status(500).json({
			success: false,
			message: "Something went wrong while registering user",
			err,
		});
		console.log(err);
	}
});

router.get("/auth/google/logout", (req, res) => {
	req.logout(function (err) {
		if (err) {
			return res.status(500).json({
				message: err,
			});
		}
		res.redirect(process.env.REACT_APP_URL);
	});
});

export default router;
