export default function resetPasswordTemplate({ username, url } : { username: string, url: string}) {
    return `
        <div>
        <h2 style="color: #007bff;">Toolydooly Password Reset</h2>
        <p>Hello @${username},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${url}">Reset Password Here</a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
    `
}