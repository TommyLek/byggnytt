import { useState } from 'react';
import type { Newsletter } from '@byggnytt/shared';
import { EditorLayout } from './components/Editor/EditorLayout';
import { NewsletterList } from './components/NewsletterList/NewsletterList';

type View = 'list' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [activeNewsletter, setActiveNewsletter] = useState<Newsletter | null>(null);

  const handleEdit = (newsletter: Newsletter) => {
    setActiveNewsletter(newsletter);
    setView('editor');
  };

  const handleBack = () => {
    setActiveNewsletter(null);
    setView('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'list' && <NewsletterList onEdit={handleEdit} />}
      {view === 'editor' && activeNewsletter && (
        <EditorLayout newsletter={activeNewsletter} onBack={handleBack} />
      )}
    </div>
  );
}
