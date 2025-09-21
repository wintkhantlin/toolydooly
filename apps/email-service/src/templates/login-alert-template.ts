export default function loginAlertTemplate({
    timestamp,
    user_info,
    resetLink
}: {
    timestamp: Date;
    user_info: string;
    resetLink: string;
}) {
    const timeUTC = timestamp.toISOString();
    return `
        <h1>Login Alert</h1>
        <p>We detected a login to your on <strong>${timeUTC}</strong> UTC.</p>
        <p>User info: ${user_info}</p>
        <p>If this was you, you can safely ignore this message.</p>
        ${resetLink ? `<p>If this wasn't you, <a href="${resetLink}">request a password reset</a> immediately.</p>` : ''}
    `;
}
