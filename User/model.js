import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Please enter your name!"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Please enter your email!"],
			trim: true,
			unique: true,
			validate: {
				validator: validator.isEmail,
				message: "Please enter a valid email address!",
			},
		},
		college_name: {
			type: String,
		},
		mobile: {
			type: String,
			required: [true, "Please enter a 10-digit mobile number!"],
			minLength: [10, "Please enter a valid 10-digit mobile number!"],
		},
		password: {
			type: String,
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
		resetPasswordToken: {
			type: String,
		},
	},

	{ timestamps: true }
);

// encrypting password
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// generating auth token
userSchema.methods.generateAuthToken = async function () {
	try {
		let token = jwt.sign({ email: this.email, id: this._id }, process.env.JWT_SECRET, {
			expiresIn: "15h",
		});
		this.tokens = this.tokens.concat({ token });
		await this.save();
		return token;
	} catch (err) {
		console.log("Something went wrong while generating token", err.message);
		res.status(500).json({ message: "Something went wrong while generating token", err });
	}
};

// *** Generating Password Reset Token ***
userSchema.methods.getResetPasswordToken = async function () {
	try {
		// Generating Token
		let resetToken = await jwt.sign({ email: this.email, id: this._id }, process.env.JWT_SECRET, {
			expiresIn: "15m",
		});

		// Hashing and setting to resetPasswordToken
		this.resetPasswordToken = await bcrypt.hash(resetToken, 10);

		// Save the user with the resetPasswordToken
		await this.save();

		return resetToken;
	} catch (error) {
		console.log("Something went wrong while generating reset password token", err.message);
		res.status(500).json({ message: "Something went wrong while generating reset password token", err });
	}
};

const User = mongoose.model("User", userSchema);

export default User;
