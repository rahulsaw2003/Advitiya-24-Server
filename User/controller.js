import User from "./model.js";
import bcrpt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";

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
		if(isMobile){
			return res.status(422).json({ message : "Mobile number already exists in Database" });
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
				console.log("User Registered Successfully & verification email sent.")
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
		}

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

export const googleLogin = async (req, res) => {
	const { tokenId, mobile, college_name } = req.body;
	try {
		const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
		const verify = await client.verifyIdToken({ idToken: tokenId, aud: process.env.GOOGLE_CLIENT_ID });
		const { email_verified, name, email } = verify.payload;

		// Check if the mobile number is already registered
		const existingUserWithMobile = await User.findOne({ mobile });
		if (existingUserWithMobile) {
			res.status(400).json({ message: "Mobile number is already registered. Please use a different mobile number." });
			return;
		}

		if (!email_verified) {
			res.json({ message: "Email Not Verified" });
		}
		const userExist = await User.findOne({ email }).select("-password");

		if (userExist) {
			// Login User

			// Generate Token for Existing User Login
			const token = await userExist.generateAuthToken();

			res.cookie("userToken", token, {
				httpOnly: true,
				expires: new Date(Date.now() + 15 * 60 * 60 * 1000),
			});
			res.status(200).json({ message: "Existing Google User Signed in successfully", token, user: userExist });
			console.log("Existing User Logged in successfully via Google", userExist, "Token: ", token);
		} else {
			// Register User
			
			const password = email + process.env.GOOGLE_CLIENT_ID;
			const newUser = await User.create({ name, email, college_name, password, mobile });

			// Generate Token for New User Login after Registration
			const token = await newUser.generateAuthToken();
			res.cookie("userToken", token, {
				httpOnly: true,
				expires: new Date(Date.now() + 15 * 60 * 60 * 1000),
			});
			res.status(200).json({ message: "New User registered & LoggedIn Successfully", token, user: newUser });

			console.log("New User registered & LoggedIn Successfully", newUser, "Token: ", token);
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: "Something went wrong while signing in user with Google", error });
	}
};

export const validateUser = async (req, res) => {
	try {
		const validUser = await User.findById(req.userId).select(`-password -tokens`);
		res.status(200).json({ message: "User validated successfully", validUser, status: 200 });
		console.log("User validated successfully");
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

		res.status(201).json({ message: "User Logged out successfully", status: 201 });
		console.log("User Logged out successfully");
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ status: 500, message: error.message });
	}
};
