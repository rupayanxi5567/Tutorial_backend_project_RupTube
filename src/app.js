import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

let app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,
    limit:"16kb"
}))
app.use(express.static("public"))
app.use(cookieParser());


//  import routes
import userRouter from "./routes/users.routes.js";
//  routes declaration
app.use("/api/v1/users", userRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}. Register is POST /api/v1/users/register`,
    });
});

app.use((err, req, res, next) => {
    console.error("ERROR:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export default app