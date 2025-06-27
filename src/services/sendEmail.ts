import nodemailer from "nodemailer";
// Create a transporter object
const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});


// Define email templates
const emailTemplates = { // Registration OTP template
    registerOtpSendEmail: {
        subject: "Verify Your Registration with OTP - Perfume os",
        text: `Welcome to Your Service Name! Your one-time password (OTP) for registration is {{OTP}}. Please enter it to complete your signup. This OTP expires in 10 minutes. If you didn’t request this, you can safely ignore this email. For support, contact us at techwin363@gmail.com. © 2025 Perfume os, 123 main road, new york, usa .`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">Welcome to Your Service Name!</h2>
                    <p>Thank you for registering with us. To complete your registration, please use the OTP below:</p>
                    <h3 style="color: #4CAF50; font-size: 24px; text-align: center;">{{OTP}}</h3>
                    <p style="font-size: 14px;">This OTP expires in 10 minutes.</p>
                    <p>If you didn’t initiate this request, you can safely ignore this email.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #777;">
                        Need help? Contact us at <a href="mailto:techwin363@gmail.com">techwin363@gmail.com</a>.<br />
                        © 2025 Perfume os, 123 main road, new york, usa .<br />.
                    </p>
                </div>
            `

    },
    // Resend OTP template
    resendRegistrationOtp: {

        subject: "Resent Registration OTP - Perfume os",
        text: `Hi! We’ve resent your OTP for Your Service Name registration: {{OTP}}. Please use it to complete your signup. This OTP expires in 10 minutes. If you didn’t request this, ignore this email. For support, contact techwin363@gmail.com. © 2025 Perfume os, 123 main road, new york, usa .`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #FFA500;">OTP Resent</h2>
                    <p>We received a request to resend your registration OTP for Your Service Name. Here it is:</p>
                    <h3 style="color: #FFA500; font-size: 24px; text-align: center;">{{OTP}}</h3>
                    <p style="font-size: 14px;">This OTP expires in 10 minutes.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #777;">
                        Need help? Contact us at <a href="mailto:techwin363@gmail.com">techwin363@gmail.com</a>.<br />
                        © 2025 Perfume os, 123 main road, new york, usa .<br />.
                    </p>
                </div>
            `

    },
    // Forget Password OTP template
    forgetSendEmail: {

        subject: "Reset Your Password OTP - Perfume os",
        text: `Your OTP to reset your Your Service Name password is {{OTP}}. Use it to proceed with your reset. This OTP expires in 10 minutes. If you didn’t request this, ignore this email. For support, contact techwin363@gmail.com. © 2025 Perfume os, 123 main road, new york, usa .`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #E91E63;">Password Reset Request</h2>
                    <p>We received a password reset request for your Your Service Name account. Use the OTP below:</p>
                    <h3 style="color: #E91E63; font-size: 24px; text-align: center;">{{OTP}}</h3>
                    <p style="font-size: 14px;">This OTP expires in 10 minutes.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #777;">
                        Need help? Contact us at <a href="mailto:techwin363@gmail.com">techwin363@gmail.com</a>.<br />
                        © 2025 Perfume os, 123 main road, new york, usa .<br />.
                    </p>
                </div>
            `

    },
    // Resent Forget Password OTP template
    forgotReSendEmail: {

        subject: "Resent Password Reset OTP - Perfume os",
        text: `We’ve resent your OTP for resetting your Your Service Name password: {{OTP}}. Use it to proceed. This OTP expires in 10 minutes. If you didn’t request this, ignore this email. For support, contact techwin363@gmail.com. © 2025 Perfume os, 123 main road, new york, usa .`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #FF5722;">Resent Password Reset OTP</h2>
                    <p>We received a request to resend your password reset OTP for Your Service Name. Here it is:</p>
                    <h3 style="color: #FF5722; font-size: 24px; text-align: center;">{{OTP}}</h3>
                    <p style="font-size: 14px;">This OTP expires in 10 minutes.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #777;">
                        Need help? Contact us at <a href="mailto:techwin363@gmail.com">techwin363@gmail.com</a>.<br />
                        © 2025 Perfume os, 123 main road, new york, usa .<br />.
                    </p>
                </div>
            `

    },
    // Change Email OTP template
    changeEmail: {

        subject: "Confirm Email Change OTP - Perfume os",
        text: `Your OTP to change your email on Your Service Name is {{OTP}}. Please use it to confirm your email change request. This OTP expires in 10 minutes. If you didn’t request this, ignore this email. For support, contact techwin363@gmail.com. © 2025 Perfume os, 123 main road, new york, usa .`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00BCD4;">Confirm Email Change Request</h2>
                    <p>We received a request to change your email address on Your Service Name. Use the OTP below to confirm this request:</p>
                    <h3 style="color: #00BCD4; font-size: 24px; text-align: center;">{{OTP}}</h3>
                    <p style="font-size: 14px;">This OTP expires in 10 minutes.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #777;">
                        Need help? Contact us at <a href="mailto:techwin363@gmail.com">techwin363@gmail.com</a>.<br />
                        © 2025 Perfume os, 123 main road, new york, usa .<br />.
                    </p>
                </div>
            `

    }
};

// Generate email body based on type
function generateEmailBody(type: number, otp: string | number,) {
    let template: any;
    switch (type) {
        case 1:
            template = emailTemplates.registerOtpSendEmail;
            break;
        case 2:
            template = emailTemplates.resendRegistrationOtp;
            break;
        case 3:
            template = emailTemplates.forgetSendEmail;
            break;
        case 4:
            template = emailTemplates.forgotReSendEmail;
            break;
        case 5:
            template = emailTemplates.changeEmail;
            break;
        default:
            throw new Error("Invalid email type");
    }
    // Replace {{OTP}} placeholder with the actual OTP
    const textWithOtp = template.text.replace("{{OTP}}", otp);
    const htmlWithOtp = template.html.replace("{{OTP}}", otp);
    return { subject: template.subject, text: textWithOtp, html: htmlWithOtp };
}

// Send an email
export async function sendEmail(to: string, type: number, otp: string | number) {
    try {
        const { subject, text, html } = generateEmailBody(type, otp);

        await transport.sendMail({
            from: `"Perfume os" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `otp-${Date.now()}`,
            },
        });
        console.log("Email sent successfully");
    } catch (error) {
        console.log("Error sending email:", error);
        throw error;
    }
}