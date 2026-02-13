const mongoose = require('mongoose');

const litReviewSchema = new mongoose.Schema({
    title: { type: String, required: true },
    paperIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
    content: { type: String, required: true },
    themes: [{ type: String }],
    totalPapers: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LitReview', litReviewSchema);
