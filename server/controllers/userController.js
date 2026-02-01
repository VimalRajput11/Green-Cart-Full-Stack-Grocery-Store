import User from '../models/User.js';
import Otp from '../models/Otp.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Nodemailer Config
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP for Registration
export const sendRegisterOtp = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("-----------------------------------------");
        console.log("OTP Request for:", email);
        console.log("Sender Email Loaded:", process.env.EMAIL_USER ? "YES (" + process.env.EMAIL_USER + ")" : "NO (Undefined)");
        console.log("Sender Pass Loaded:", process.env.EMAIL_PASS ? "YES (Length: " + process.env.EMAIL_PASS.length + ")" : "NO (Undefined)");
        console.log("-----------------------------------------");

        if (!email) return res.json({ success: false, message: "Email is required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ success: false, message: "User already registered" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP (delete old one first)
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp });

        // Send Email
        const info = await transporter.sendMail({
            from: `"Green Cart" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your account',
            text: `Your verification code is: ${otp}. This code expires in 5 minutes.`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4; padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <div style="background-color: #4fbf86; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Green Cart</h1>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px; color: #1f2937; text-align: center;">
                            <h2 style="font-size: 20px; color: #333333; margin-bottom: 16px;">Verify your identity</h2>
                            <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 32px;">
                                To complete your registration for <strong>Green Cart</strong>, please use the verification code below:
                            </p>
                            
                            <div style="margin: 32px 0;">
                                <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #4fbf86; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; border: 1px solid #bdf2d5;">
                                    ${otp}
                                </span>
                            </div>
                            
                            <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
                                This code is valid for <strong>5 minutes</strong>. <br>If you did not request this code, please ignore this email.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Green Cart Store. Quality Freshness Delivered.<br>
                                Tech City, Grocers Hub
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        console.log("Email sent successfully:", info.messageId);
        res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        console.error("Email Error:", error);
        res.json({ success: false, message: "Failed to send OTP. Check server logs." });
    }
}

// Register User with OTP
export const register = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        if (!name || !email || !password || !otp) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        // Verify OTP
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ success: false, message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        // Cleanup OTP
        await Otp.deleteOne({ email });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.json({ success: true, user: { email: user.email, name: user.name } })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}

//Function for login the existing user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'Email and Password are required' })
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid Email or Password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid Email or Password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.json({
            success: true, message: 'User is logged in', user: { email: user.email, name: user.name }
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}


//Check Auth: /api/user/is-auth

export const isAuth = async (req, res) => {
    try {
        // const {userId} = req.body;       If you’re protecting this route with authUser, and that middleware sets req.userId, then your controller should read it from req.userId, not req.body.
        const userId = req.userId;
        const user = await User.findById(userId).select("-password")
        return res.json({ success: true, user })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}


//Logout User: /api/user/logout

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: 'Logged Out' });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
