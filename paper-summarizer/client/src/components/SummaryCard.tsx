interface SummaryCardProps {
    level: string;
    content: string;
    sectionName?: string;
    originalTokens?: number;
    compressedTokens?: number;
    processingTimeMs?: number;
}

const LEVEL_INFO: Record<string, { label: string; desc: string }> = {
    eli5: { label: 'ELI5', desc: 'Simple explanation' },
    technical: { label: 'Technical', desc: 'Standard summary' },
    expert: { label: 'Expert', desc: 'Detailed analysis' },
};

export default function SummaryCard({
    level,
    content,
    sectionName,
    originalTokens = 0,
    compressedTokens = 0,
    processingTimeMs = 0,
}: SummaryCardProps) {
    const info = LEVEL_INFO[level] || { label: level, desc: '' };
    const tokensReduced = originalTokens - compressedTokens;
    const reductionPct = originalTokens > 0 ? ((tokensReduced / originalTokens) * 100).toFixed(0) : '0';

    return (
        <div className="summary-card">
            <div className="summary-card-header">
                <div>
                    <span className={`summary-badge ${level}`}>{info.label}</span>
                    {sectionName && sectionName !== 'full' && (
                        <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            — {sectionName}
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.desc}</span>
            </div>

            <div className="summary-card-body">
                <p>{content}</p>
            </div>

            {originalTokens > 0 && (
                <div className="summary-stats">
                    <div className="stat">
                        <span className="stat-num">{originalTokens.toLocaleString()}</span>
                        <span className="stat-lbl">Original Tokens</span>
                    </div>
                    <div className="stat">
                        <span className="stat-num">{compressedTokens.toLocaleString()}</span>
                        <span className="stat-lbl">Compressed</span>
                    </div>
                    <div className="stat">
                        <span className="stat-num" style={{ color: 'var(--accent-emerald)' }}>{reductionPct}%</span>
                        <span className="stat-lbl">Reduction</span>
                    </div>
                    <div className="stat">
                        <span className="stat-num">{(processingTimeMs / 1000).toFixed(1)}s</span>
                        <span className="stat-lbl">Processing</span>
                    </div>
                </div>
            )}
        </div>
    );
}
