import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [50, "Name cannot exceed 50 characters"]
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username cannot exceed 30 characters"],
            match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        token: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// ✅ Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ token: 1 });

// ✅ Method to hide password in JSON responses
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

// ✅ Static method to find user by token
userSchema.statics.findByToken = async function (token) {
    return await this.findOne({ token });
};

// ✅ Static method to check if username exists
userSchema.statics.isUsernameTaken = async function (username) {
    const user = await this.findOne({ username: username.toLowerCase() });
    return !!user;
};

const User = mongoose.model("User", userSchema);

export { User };