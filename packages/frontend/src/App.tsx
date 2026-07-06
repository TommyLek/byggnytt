import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import type { Newsletter } from '@byggnytt/shared';
import { EditorLayout } from './components/Editor/EditorLayout';
import { NewsletterList } from './components/NewsletterList/NewsletterList';
import { Toaster } from './components/ui/Toaster';
import { api } from './utils/api';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function ListPage() {
  const navigate = useNavigate();
  return <NewsletterList onEdit={(newsletter) => navigate(`/edit/${newsletter.id}`)} />;
}

function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setNewsletter(null);
    setError(null);
    api.newsletters
      .get(id)
      .then((data) => {
        if (!cancelled) setNewsletter(data);
      })
      .catch((err) => {
        console.error('Kunde inte hämta nyhetsbrev:', err);
        if (!cancelled) {
          setError('Nyhetsbrevet kunde inte hämtas. Det kan ha tagits bort.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Tillbaka till listan
        </Link>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <EditorLayout newsletter={newsletter} onBack={() => navigate('/')} />;
}
