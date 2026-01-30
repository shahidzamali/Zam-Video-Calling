import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        user_id: {
            type: String,
            required: [true, "User ID is required"],
            trim: true,
            index: true // For faster queries
        },
        meetingCode: {
            type: String,
            required: [true, "Meeting code is required"],
            trim: true,
            uppercase: true,
            minlength: [6, "Meeting code must be at least 6 characters long"],
            maxlength: [20, "Meeting code cannot exceed 20 characters"]
        },
        date: {
            type: Date,
            default: Date.now,
            required: true
        }
    },
    {
        timestamps: true // Adds createdAt and updatedAt automatically
    }
);

// ✅ Compound index for faster queries (user + meeting code)
meetingSchema.index({ user_id: 1, meetingCode: 1 });

// ✅ Index for sorting by date
meetingSchema.index({ date: -1 });

// ✅ Static method to find meetings by user
meetingSchema.statics.findByUser = async function (userId) {
    return await this.find({ user_id: userId }).sort({ date: -1 });
};

// ✅ Static method to check if meeting exists for user
meetingSchema.statics.isMeetingExists = async function (userId, meetingCode) {
    const meeting = await this.findOne({ 
        user_id: userId, 
        meetingCode: meetingCode.toUpperCase() 
    });
    return !!meeting;
};

// ✅ Static method to get recent meetings
meetingSchema.statics.getRecentMeetings = async function (userId, limit = 10) {
    return await this.find({ user_id: userId })
        .sort({ date: -1 })
        .limit(limit);
};

// ✅ Static method to delete old meetings (older than X days)
meetingSchema.statics.deleteOldMeetings = async function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.deleteMany({ date: { $lt: cutoffDate } });
    return result.deletedCount;
};

// ✅ Virtual property to format date
meetingSchema.virtual('formattedDate').get(function () {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// ✅ Ensure virtuals are included in JSON
meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };