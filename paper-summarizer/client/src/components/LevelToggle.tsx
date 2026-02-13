interface LevelToggleProps {
    activeLevel: string;
    onLevelChange: (level: string) => void;
}

export default function LevelToggle({ activeLevel, onLevelChange }: LevelToggleProps) {
    const levels = [
        { key: 'eli5', label: 'ELI5' },
        { key: 'technical', label: 'Technical' },
        { key: 'expert', label: 'Expert' },
    ];

    return (
        <div className="level-toggle">
            {levels.map(({ key, label }) => (
                <button
                    key={key}
                    className={activeLevel === key ? `active-${key}` : ''}
                    onClick={() => onLevelChange(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
