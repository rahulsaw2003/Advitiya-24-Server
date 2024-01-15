import User from "./model.js";
import bcrpt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
	const { name, email, college_name, password, cpassword, mobile } = req.body;
	try {
		if (!name || !email || !password || !cpassword || !mobile) {
			return res.status(422).json({ message: "Please fill all the fields" });
		}

		const isUserExist = await User.findOne({ email: email });
		if (isUserExist) {
			return res.status(422).json({ message: "User already exists in Database" });
		}

		const isMobile = await User.findOne({ mobile: mobile });
		if (isMobile) {
			return res.status(422).json({ message: "Mobile number already exists in Database" });
		}

		if (password !== cpassword) {
			return res.status(422).json({ message: "Password and confirm password should be same!" });
		}

		const newUser = await User.create({ name, email, college_name, password, mobile });

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
				res.status(201).json({ message: "User registered successfully", newUser, token, emailInfo: info });
			})
			.catch((error) => {
				console.error(error.message);
				res.status(500).json({ message: "Something went wrong while sending the email", error });
			});
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: "Something went wrong while registering user", error });
	}
};

export const loginUser = async (req, res) => {
	const { email, password } = req.body;
	try {
		if (!email || !password) {
			return res.status(422).json({ message: "Please fill all the fields" });
		}

		const isUser = await User.findOne({ email });

		if (!isUser) {
			return res.status(404).json({ message: "User doesn't exist!" });
		}
		const isPasswordCorrect = await bcrpt.compare(password, isUser.password);

		if (!isPasswordCorrect) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const thisUser = {
			_id: isUser._id,
			name: isUser.name,
			email: isUser.email,
			college_name: isUser.college_name,
			mobile: isUser.mobile,
		};

		const token = await isUser.generateAuthToken();

		res.cookie("userToken", token, {
			httpOnly: true,
			expires: new Date(Date.now() + 15 * 60 * 60 * 1000),
		});

		res.status(200).json({ message: "User signed in successfully", thisUser, token });
		console.log("User signed in successfully", thisUser);
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: "Something went wrong while signing in user", error });
	}
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const isUser = await User.findOne({ email });

		if (!isUser) {
			return res.status(404).json({ message: "User doesn't exist!" });
		}

		const resetToken = await isUser.getResetPasswordToken();
		// console.log("resetToken: ", resetToken);

		const resetPasswordUrl = `http://localhost:3000/reset-password/${isUser._id}/${resetToken}`;
		// console.log("resetUrl: ", resetPasswordUrl);

		const message = `Your password reset link is as follows:\n\n${resetPasswordUrl}\n\nPlease reset your password within 15 minutes.\n\nIf you have not requested this email, then ignore it.`;
		sendEmail({
			email: isUser.email,
			subject: "Password Reset Request | ADVITIYA IIT Ropar",
			message,
		})
			.then((info) => {
				console.log("Password reset email sent successfully.");
				res.status(201).json({ message: "Password reset email sent successfully", resetPasswordUrl, emailInfo: info });
			})
			.catch((error) => {
				console.error(error.message);
				res.status(500).json({ message: "Something went wrong while sending the reset password email", error });
			});
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: "Something went wrong while sending the reset password email", error });
	}
};

export const resetPassword = async (req, res) => {
	const { userId, token } = req.params;
	const { password } = req.body;

	try {
		// Find user by userId
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}
		if (!user.resetPasswordToken) {
			return res.status(500).json({ message: "Invalid token. Please try again!" });
		}

		// Check if the user's reset token matches the provided token
		if (bcrypt.compareSync(token, user.resetPasswordToken)) {
			// Verify token expiration
			const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

			if (Date.now() >= decodedToken.exp * 1000) {
				return res.status(500).json({ message: "Token expired. Please request a new one." });
			}

			// Update the user's password
			user.password = password;
			user.resetPasswordToken = null; // Reset the token after password change
			await user.save();

			const message = `Your password has been successfully reset. Please login with your new password.`;
			sendEmail({
				email: user.email,
				subject: "Password Reset Successfully | ADVITIYA IIT Ropar",
				message,
			})
				.then((info) => {
					console.log("Password reset successfully.");
					res.status(201).json({ message: "Password reset successfully", emailInfo: info });
				})
				.catch((error) => {
					console.error(error.message);
					res.status(500).json({ message: "Something went wrong while sending the email", error });
				});
		} else {
			return res.status(500).json({ message: "Invalid token. Please try again!" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

export const validateUser = async (req, res) => {
	try {
		const validUser = await User.findById(req.userId).select(`-password -tokens`);
		res.status(200).json({ message: "User validated successfully", user: validUser, status: 200 });
		// console.log("User validated successfully");
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: error.message });
	}
};

export const logoutUser = async (req, res) => {
	try {
		req.rootUser.tokens = req.rootUser.tokens.filter((currToken) => {
			return currToken.token !== req.token;
		});
		res.clearCookie("jwtToken", { path: "/" });
		req.rootUser.save();

		res.status(200).json({ message: "User Logged out successfully", status: 200 });
		console.log("User Logged out successfully");
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ status: 500, message: error.message });
	}
};
