const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    level: { type: String, enum: ['eli5', 'technical', 'expert'], required: true },
    sectionName: { type: String, default: 'full' },  // 'full' or specific section name
    content: { type: String, required: true },
    originalTokens: { type: Number, default: 0 },
    compressedTokens: { type: Number, default: 0 },
    compressionRatio: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
}, { timestamps: true });

summarySchema.index({ paperId: 1, level: 1, sectionName: 1 });

module.exports = mongoose.model('Summary', summarySchema);
