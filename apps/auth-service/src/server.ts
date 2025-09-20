import bodyParser from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import { createUser, forgetPassword, loginUser, logout, refresh, resetPasswordController, verify, verifyResetPasswordSession } from "./auth.controller";
import AuthMiddleware from "./auth.middleware";
import cookieParser from "cookie-parser";
import cors from 'cors';

const allowedOrigins = ["http://localhost:4173", "http://localhost:5173"];

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    }))
    .use(bodyParser.urlencoded({ extended: true }))
    .use(express.json())
    .use(cookieParser())
    .post("/create-user", createUser)
    .post("/login", loginUser)
    .post("/forget-password", forgetPassword)
    .get("/reset-password/:id", verifyResetPasswordSession)
    .put("/reset-password", resetPasswordController)
    .get("/session", AuthMiddleware, verify)
    .get("/refresh", refresh)
    .get("/logout", logout)
  return app;
};
