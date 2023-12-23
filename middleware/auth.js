import User from "../User/model.js";
import jwt from "jsonwebtoken";

export const isUser = async (req, res, next) => {
	try {
		const token = req.headers.authorization;
		const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
		const rootUser = await User.findOne({ _id: verifyToken.id, "tokens.token": token });

		if (!rootUser) {
			throw new Error("User not found");
		}

		req.token = token;
		req.rootUser = rootUser;
		req.userId = rootUser._id;

		next();
	} catch (error) {
		console.log(error.message);
		res.status(401).json({ message: "Unauthorized: No token provided" });
	}
};
