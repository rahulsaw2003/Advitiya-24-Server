import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";

config({ path: "./.env" });


export const app = express();


// Using Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());


//Using Routes Here
app.use("/api/users", userRoutes);



app.get("/", (req, res) => {
	res.send("ADVITIYA Server is running...");
});


