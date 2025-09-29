const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : "localhost",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};