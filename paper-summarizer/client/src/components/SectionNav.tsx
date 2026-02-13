interface Section {
    key: string;
    label: string;
}

interface SectionNavProps {
    sections: Section[];
    activeSection: string;
    onSectionChange: (key: string) => void;
}

const SECTION_ICONS: Record<string, string> = {
    full: '📋',
    abstract: '📝',
    introduction: '📖',
    related_work: '🔗',
    methodology: '🔬',
    experiments: '📊',
    discussion: '💬',
    conclusion: '✅',
    preamble: '📄',
};

export default function SectionNav({ sections, activeSection, onSectionChange }: SectionNavProps) {
    return (
        <div className="glass-card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', fontWeight: 600 }}>
                Sections
            </h4>
            <nav className="section-nav">
                {sections.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`section-nav-item ${activeSection === key ? 'active' : ''}`}
                        onClick={() => onSectionChange(key)}
                    >
                        <span>{SECTION_ICONS[key] || '📄'}</span>
                        {label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
