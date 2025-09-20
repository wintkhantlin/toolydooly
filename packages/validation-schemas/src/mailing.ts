import z from "zod";

export const forgetPasswordQueueSchema = z.object({
    action: z.literal("forget_password"),
    payload: z.object({
        to: z.email(),
        session: z.string(),
        username: z.string()
    })
});

export const mailingQueueSchema = z.union([
    forgetPasswordQueueSchema,
])
