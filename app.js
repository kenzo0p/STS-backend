import express from "express";
import { PORT } from "./config/env.js";
const app  = express();

app.get('/' , (req,res) => {
    res.send("Welcome to the subscription tracking system");
});

app.listen(PORT , () => {
    console.log(`Subscription Tracker Api is running on http://localhost:${PORT}`);
})

export default app;

// 4545