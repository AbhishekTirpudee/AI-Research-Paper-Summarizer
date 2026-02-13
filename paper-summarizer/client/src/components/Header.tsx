import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const location = useLocation();

    return (
        <header className="header">
            <div className="header-inner">
                <Link to="/" className="header-logo">
                    <span className="header-logo-icon">📄</span>
                    <span>PaperLens</span>
                </Link>
                <nav className="header-nav">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        Dashboard
                    </Link>
                    <Link to="/lit-review" className={location.pathname === '/lit-review' ? 'active' : ''}>
                        Literature Review
                    </Link>
                </nav>
            </div>
        </header>
    );
}
