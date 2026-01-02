import type { Request, Response } from "express";
import { createUserSchema, loginUserSchema, forgetPasswordSchema, resetPasswordSchema } from "@toolydooly/validation-schemas/auth";
import * as authService from "./auth.service";
import { ZodError } from "zod";

const handleError = (res: Response, err: unknown, defaultStatus = 500) => {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    res.status(defaultStatus).json({ status: "error", message });
};

export const createUser = async (req: Request, res: Response) => {
    const parsed = await createUserSchema.safeParseAsync(req.body);
    if (!parsed.success) return res.status(400).json({ status: "error", message: parsed.error.format() });

    try {
        const { user, accessToken, refreshToken } = await authService.registerUser(parsed.data.username, parsed.data.email, parsed.data.password);
        res.cookie("refresh_token", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "none", secure: true });
        res.status(201).json({ status: "success", data: user, access_token: accessToken });
    } catch (err) {
        handleError(res, err, 409);
    }
};

function getBrowserInfo(ua: string) {
    let browser = "Unknown";
    let os = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `Browser: ${browser}, OS: ${os}`;
}

export const loginUser = async (req: Request, res: Response) => {
    const parsed = await loginUserSchema.safeParseAsync(req.body);
    if (!parsed.success) return res.status(400).json({ status: "error", message: parsed.error });

    try {
        const { user, accessToken, refreshToken } = await authService.loginUser(parsed.data.usernameOrEmail, parsed.data.password);
        
        authService.emitLoginAlertToMailingQueue({
            timestamp: new Date(),
            to: user.email,
            user_info: req.headers["user-agent"]
                ? getBrowserInfo(req.headers["user-agent"])
                : "Unknown"
        })

        res.cookie("refresh_token", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "none", secure: true });
        res.status(200).json({ status: "success", data: user, access_token: accessToken });
    } catch (err) {
        handleError(res, err, 401);
    }
};

export const refresh = async (req: Request, res: Response) => {
    const token = req.cookies["refresh_token"];
    if (!token) return res.status(401).json({ status: "error", message: "No refresh token" });

    try {
        const accessToken = await authService.refreshUserToken(token);
        res.status(200).json({ status: "success", access_token: accessToken });
    } catch (err) {
        res.clearCookie("refresh_token");
        handleError(res, err, 401);
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
    } catch (err) {
        handleError(res, err, 500);
    }
};

export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { sessionId, newPassword } = resetPasswordSchema.parse(req.body);
        const { accessToken } = await authService.resetPassword(sessionId, newPassword);
        res.status(200).json({ status: "success", message: "Password reset successfully", access_token: accessToken });
    } catch (error) {
        if (error instanceof ZodError) return res.status(400).json({ status: "error", message: error.format() });
        handleError(res, error, 400);
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
