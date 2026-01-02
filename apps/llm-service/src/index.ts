import express, { type Request, type Response, type NextFunction } from 'express'
import OpenAI from 'openai'
import { llmActionPayload } from '@toolydooly/validation-schemas'

const app = express()
app.use(express.json())

const key = process.env.OPENROUTER_API
if (!key) throw new Error("OPENROUTER_API Missing")

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
})

// Authentication middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ 
                success: false, 
                message: "Missing or invalid authorization header" 
            });
        }

        const authServiceUrl = process.env.AUTH_SERVICE ?? "http://localhost:3002";
        const sessionUrl = `${authServiceUrl}/session`;

        const response = await fetch(sessionUrl, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
            },
        });

        if (!response.ok) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired session" 
            });
        }

        const sessionData = await response.json();
        (req as any).user = sessionData.data;
        
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Authentication service error" 
        });
    }
}

app.post("/", authMiddleware, async (req, res) => {
    try {
        const payload = llmActionPayload.parse(req.body)

        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
                { role: "system", content: "You are the Writing Tool for my Todo App" },
                { role: "user", content: `Action: ${payload.type}\nText: ${payload.text}` }
            ],
            // response_format: {
            //     type: "json_schema",
            //     json_schema: {
            //         name: "llm_result",
            //         schema: {
            //             type: "object",
            //             properties: {
            //                 result: { type: "string" }
            //             },
            //             required: ["result"]
            //         }
            //     }
            // },
            max_tokens: 100
        })

        res.json({ success: true, data: completion.choices[0].message.content })
    } catch (err) {
        console.log(err)
        if (err instanceof Error && err.name === 'ZodError') {
            res.status(400).json({ success: false, error: "Invalid request payload", details: err.message })
        } else {
            res.status(500).json({ success: false, error: "Something went wrong" })
        }
    }
})

app.listen(3010, () => {
    console.log("Server running on port 3010")
})
