import Mailgen from "mailgen";
import nodemailer from "nodemailer";

/**
 *
 * @param {{email: string; subject: string; mailgenContent: Mailgen.Content; }} options
 */
const sendEmail = async (options) => {
    // const mailGenerator = new Mailgen({
    //     theme: "default",
    //     product: {
    //         name: "Task Manager",
    //         link: "https://taskmanager.app",
    //     },
    // });
    // const emailTextual = mailGenerator.generatePlaintext(
    //     options.mailgenContent
    // );
    // const emailHtml = mailGenerator.generate(options.mailgenContent);
    // // In a real-world app, you'd use a proper email service.
    // // For this example, we'll just log the email to the console.
    // console.log("--- New Email ---");
    // console.log(`To: ${options.email}`);
    // console.log(`Subject: ${options.subject}`);
    // console.log("HTML Body:");
    // console.log(emailHtml);
    // console.log("--- End Email ---");
    //
    // // The original Mailtrap code is commented out below for reference.
    // /*
    // const transporter = nodemailer.createTransport({
    //     host: process.env.MAILTRAP_SMTP_HOST,
    //     port: process.env.MAILTRAP_SMTP_PORT,
    //     auth: {
    //         user: process.env.MAILTRAP_SMTP_USER,
    //         pass: process.env.MAILTRAP_SMTP_PASS,
    //     },
    // });
    //
    // const mail = {
    //     from: "mail.spices@example.com",
    //     to: options.email,
    //     subject: options.subject,
    //     text: emailTextual,
    //     html: emailHtml,
    // };
    //
    // try {
    //     await transporter.sendMail(mail);
    // } catch (error) {
    //     console.error(
    //         "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    //     );
    //     console.error("Error: ", error);
    // }
    // */
};

/**
 *
 * @param {string} username
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the email verification mail
 */
const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our app! We're very excited to have you on board.",
            action: {
                instructions:
                    "To verify your email please click on the following button:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

/**
 *
 * @param {string} username
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the forgot password mail
 */
const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of our account",
            action: {
                instructions:
                    "To reset your password click on the following button or link:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const orderConfirmationMailgenContent = (username, order) => {
    return {
        body: {
            name: username,
            intro: `Thank you for your order! Your order (ID: ${order._id}) has been placed successfully.`,
            table: {
                data: order.items.map((item) => ({
                    Product: item.product?.name || "Product",
                    Quantity: item.quantity,
                    Price: `₹${item.product?.price || item.price}`,
                })),
                columns: {
                    // Optionally add more style here
                    customWidth: {
                        Product: "40%",
                        Quantity: "20%",
                        Price: "20%",
                    },
                },
            },
            action: {
                instructions:
                    "You can view your order details by clicking the button below:",
                button: {
                    color: "#3b82f6", // Tailwind blue
                    text: "View Order",
                    link: `${process.env.FRONTEND_URL}/account/orders/${order._id}`,
                },
            },
            outro: `We'll notify you as soon as your order is shipped. If you have questions, just reply to this email!`,
        },
    };
};

const orderCancelledMailgenContent = (username, order) => {
    return {
        body: {
            name: username,
            intro: `We're sorry to inform you that your order (ID: ${order._id}) has been cancelled.`,
            table: {
                data: order.items.map((item) => ({
                    Product: item.product?.name || "Product",
                    Quantity: item.quantity,
                    Price: `₹${item.product?.price || item.price}`,
                })),
                columns: {
                    customWidth: {
                        Product: "40%",
                        Quantity: "20%",
                        Price: "20%",
                    },
                },
            },
            action: {
                instructions:
                    "If you have questions or want to place a new order, visit your account:",
                button: {
                    color: "#ef4444", // Tailwind red
                    text: "View My Orders",
                    link: `${process.env.FRONTEND_URL}/account/orders/${order._id}`,
                },
            },
            outro: "If this was a mistake or you need help, just reply to this email. We’re here for you!",
        },
    };
};

const orderReturnRequestedMailgenContent = (username, order, reason) => ({
    body: {
        name: username,
        intro: `Your return request for order (ID: ${order._id}) has been received!`,
        table: {
            data: order.items.map((item) => ({
                Product: item.product?.name || "Product",
                Quantity: item.quantity,
                Price: `₹${item.product?.price || item.price}`,
            })),
            columns: {
                customWidth: { Product: "40%", Quantity: "20%", Price: "20%" },
            },
        },
        ...(reason && {
            action: {
                instructions: `Reason for return: ${reason}`,
                button: {
                    color: "#f59e42", // orange
                    text: "View Order",
                    link: `${process.env.FRONTEND_URL}/account/orders/${order._id}`,
                },
            },
        }),
        outro: "Our support team will review your request soon. For any queries, reply to this email!",
    },
});

export {
    orderReturnRequestedMailgenContent,
    orderCancelledMailgenContent,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    orderConfirmationMailgenContent,
    sendEmail,
};
