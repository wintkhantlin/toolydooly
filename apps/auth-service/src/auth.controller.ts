import type { Request, Response } from "express";
import { createUserSchema, loginUserSchema, forgetPasswordSchema, resetPasswordSchema } from "@toolydooly/validation-schemas/auth";
import * as authService from "./auth.service";
import { ZodError } from "zod";

export const createUser = async (req: Request, res: Response) => {
    const parsed = await createUserSchema.safeParseAsync(req.body);
    if (!parsed.success) return res.status(400).json({ status: "error", message: parsed.error.format() });

    try {
        const { user, accessToken, refreshToken } = await authService.registerUser(parsed.data.username, parsed.data.email, parsed.data.password);
        res.cookie("refresh_token", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "none", secure: true });
        res.status(201).json({ status: "success", data: user, access_token: accessToken });
    } catch (err: any) {
        res.status(409).json({ status: "error", message: err.message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const parsed = await loginUserSchema.safeParseAsync(req.body);
    if (!parsed.success) return res.status(400).json({ status: "error", message: parsed.error.format() });

    try {
        const { user, accessToken, refreshToken } = await authService.loginUser(parsed.data.usernameOrEmail, parsed.data.password);
        res.cookie("refresh_token", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "none", secure: true });
        res.status(200).json({ status: "success", data: user, access_token: accessToken });
    } catch (err: any) {
        res.status(401).json({ status: "error", message: err.message });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const token = req.cookies["refresh_token"];
    if (!token) return res.status(401).json({ status: "error", message: "No refresh token" });

    try {
        const accessToken = await authService.refreshUserToken(token);
        res.status(200).json({ status: "success", access_token: accessToken });
    } catch (err: any) {
        res.clearCookie("refresh_token");
        res.status(401).json({ status: "error", message: err.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie("refresh_token", { httpOnly: true, sameSite: "none", secure: true });
    res.status(200).json({ status: "success", message: "Logged out successfully" });
};

export const forgetPassword = async (req: Request, res: Response) => {
    const parsed = await forgetPasswordSchema.safeParseAsync(req.body);
    if (!parsed.success) return res.status(400).json({ status: "error", message: parsed.error.issues });

    try {
        await authService.createForgetPasswordSession(parsed.data.identifier);
        res.status(200).json({ status: "success", message: "Request mail sent" });
    } catch (err: any) {
        res.status(500).json({ status: "error", message: err.message || "Something went wrong" });
    }
};

export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { sessionId, newPassword } = resetPasswordSchema.parse(req.body);
        const { accessToken } = await authService.resetPassword(sessionId, newPassword);
        res.status(200).json({ status: "success", message: "Password reset successfully", access_token: accessToken });
    } catch (error) {
        if (error instanceof ZodError) return res.status(400).json({ status: "error", message: error.format() });
        res.status(400).json({ status: "error", message: error instanceof Error ? error.message : "Failed to reset password" });
    }
};

export const verify = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized access"
        });
    }

    return res.status(200).json({
        status: "success",
        data: req.user
    });
};

export const verifyResetPasswordSession = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) return res.status(404).json({
        status: "error",
        message: "Session ID is required"
    });

    const session = await authService.verifyResetPasswordSession(id);

    if (!session) return res.status(404).json({
        status: "error",
        message: "Reset Password Session not found"
    });

    return res.status(200).json({
        status: "success",
        message: "Session found"
    });
};
