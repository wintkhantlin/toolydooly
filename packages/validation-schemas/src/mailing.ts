import z from "zod";

export const forgetPasswordQueueSchema = z.object({
    action: z.literal("forget_password"),
    payload: z.object({
        to: z.email(),
        session: z.string(),
        username: z.string()
    })
});

export const loginAlertQueueSchema = z.object({
    action: z.literal("login_alert"),
    payload: z.object({
        to: z.email(),
        user_info: z.string().max(300),
        timestamp: z.string().transform(str => new Date(str))
    })
})

export const mailingQueueSchema = z.union([
    forgetPasswordQueueSchema,
    loginAlertQueueSchema
])
