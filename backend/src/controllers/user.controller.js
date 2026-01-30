import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ✅ Register new user
const register = async (req, res) => {
    try {
        const { name, username, password } = req.body;

        // Validation
        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "All fields are required (name, username, password)" 
            });
        }

        // Check password length
        if (password.length < 6) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Password must be at least 6 characters long" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ 
                message: "Username already taken" 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name: name.trim(),
            username: username.toLowerCase().trim(),
            password: hashedPassword
        });

        await newUser.save();

        console.log(`✅ New user registered: ${username}`);

        res.status(httpStatus.CREATED).json({ 
            message: "User registered successfully",
            user: {
                name: newUser.name,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
            message: "Registration failed",
            error: error.message 
        });
    }
};

// ✅ Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Username and password are required" 
            });
        }

        // Find user
        const user = await User.findOne({ username: username.toLowerCase().trim() });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ 
                message: "User not found" 
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
                message: "Invalid username or password" 
            });
        }

        // Generate token
        let token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        console.log(`✅ User logged in: ${username}`);

        res.status(httpStatus.OK).json({ 
            message: "Login successful",
            token: token,
            user: {
                name: user.name,
                username: user.username
            }
        });

    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
            message: "Login failed",
            error: error.message 
        });
    }
};

// ✅ Get user meeting history
const getUserHistory = async (req, res) => {
    try {
        const { token } = req.query;

        // Validation
        if (!token) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Token is required" 
            });
        }

        // Find user by token
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
                message: "Invalid or expired token" 
            });
        }

        // Get user's meetings
        const meetings = await Meeting.find({ user_id: user.username })
            .sort({ createdAt: -1 }); // Latest first

        res.status(httpStatus.OK).json({ 
            message: "Meeting history retrieved successfully",
            count: meetings.length,
            meetings: meetings
        });

    } catch (error) {
        console.error("❌ Get history error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
            message: "Failed to retrieve meeting history",
            error: error.message 
        });
    }
};

// ✅ Add meeting to history
const addToHistory = async (req, res) => {
    try {
        const { token, meeting_code } = req.body;

        // Validation
        if (!token || !meeting_code) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Token and meeting code are required" 
            });
        }

        // Find user by token
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
                message: "Invalid or expired token" 
            });
        }

        // Check if meeting code already exists for this user
        const existingMeeting = await Meeting.findOne({
            user_id: user.username,
            meetingCode: meeting_code
        });

        if (existingMeeting) {
            return res.status(httpStatus.CONFLICT).json({ 
                message: "Meeting already exists in history" 
            });
        }

        // Create new meeting record
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        console.log(`✅ Meeting added to history: ${meeting_code} for user ${user.username}`);

        res.status(httpStatus.CREATED).json({ 
            message: "Meeting added to history successfully",
            meeting: {
                meetingCode: newMeeting.meetingCode,
                createdAt: newMeeting.createdAt
            }
        });

    } catch (error) {
        console.error("❌ Add to history error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
            message: "Failed to add meeting to history",
            error: error.message 
        });
    }
};

export { login, register, getUserHistory, addToHistory };