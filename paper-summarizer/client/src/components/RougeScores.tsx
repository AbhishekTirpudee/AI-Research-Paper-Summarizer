interface RougeScore {
    precision: number;
    recall: number;
    f1: number;
}

interface RougeScoresProps {
    scores: {
        rouge1: RougeScore;
        rouge2: RougeScore;
        rougeL: RougeScore;
    } | null;
    level?: string;
}

export default function RougeScores({ scores, level }: RougeScoresProps) {
    if (!scores) {
        return (
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Generate summaries first to see ROUGE scores</p>
            </div>
        );
    }

    const metrics = [
        { key: 'rouge1', label: 'ROUGE-1', score: scores.rouge1, cssClass: 'r1' },
        { key: 'rouge2', label: 'ROUGE-2', score: scores.rouge2, cssClass: 'r2' },
        { key: 'rougeL', label: 'ROUGE-L', score: scores.rougeL, cssClass: 'rl' },
    ];

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                ROUGE Scores {level && `— ${level.toUpperCase()}`}
            </h4>
            <div className="rouge-container">
                {metrics.map(({ key, label, score, cssClass }) => (
                    <div key={key} className="rouge-metric">
                        <span className="rouge-label">{label}</span>
                        <span className={`rouge-value ${cssClass}`}>{(score.f1 * 100).toFixed(1)}%</span>
                        <div className="rouge-bar-track">
                            <div
                                className={`rouge-bar-fill ${cssClass}`}
                                style={{ width: `${Math.min(score.f1 * 100, 100)}%` }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span>P: {(score.precision * 100).toFixed(1)}%</span>
                            <span>R: {(score.recall * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
