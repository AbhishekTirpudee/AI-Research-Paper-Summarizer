import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PaperView from './pages/PaperView';
import LitReview from './pages/LitReview';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Header />
        <main className="main-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paper/:id" element={<PaperView />} />
            <Route path="/lit-review" element={<LitReview />} />
          </Routes>
        </main>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
