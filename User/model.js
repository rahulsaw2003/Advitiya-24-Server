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
			unique: true,
			minLength: [10, "Please enter a valid 10-digit mobile number!"],
		},
		password: {
			type: String,
			required: [true, "Please enter your password!"],
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
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
		console.log("Model", err.message);
		res.status(500).json({ message: "Something went wrong while generating token", error });
	}
};

const User = mongoose.model("User", userSchema);

export default User;
