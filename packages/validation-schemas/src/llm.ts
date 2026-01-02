import { z } from "zod/mini";

export const llmActionPayload = z.object({
    type: z.enum(["fix_grammar", "expand_details", "improve_text", "rewrite"]),
    text: z.string()
})