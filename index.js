import connectDB from "./connectDB.js";
import { app } from "./app.js";

const port = process.env.PORT || 4000;

//add the mongodb connection here
connectDB();

app.listen(port, () => {
	console.log(`ADVITIYA Server is running on port ${port}`);
});
