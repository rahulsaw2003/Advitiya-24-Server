import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import passport from "passport";
import session from "express-session";
import initializingPassport from "./utils/passportConfig.js";

config({ path: "./.env" });

export const app = express();

// Using Middlewares
app.use(
	cors({
		origin: process.env.REACT_APP_URL,
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	})
);
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// setup session
app.use(
	session({
		secret: "iygyikgo89495hI896529FUJuougjhmgfvejYGU",
		resave: false,
		saveUninitialized: true,
	})
);

// setup passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport
initializingPassport(passport);

//Using Routes Here
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
	res.send("ADVITIYA Server is running...");
});
