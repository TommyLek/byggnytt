import { useEffect, useState, useCallback } from 'react';
import type { Newsletter, Template } from '@byggnytt/shared';
import { api } from '../../utils/api';
import { CHANNEL_CONFIG } from '@byggnytt/shared';

interface NewsletterListProps {
  onEdit: (newsletter: Newsletter) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alla' },
  { value: 'draft', label: 'Utkast' },
  { value: 'ready', label: 'Klara' },
  { value: 'sent', label: 'Skickade' },
];

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Alla kanaler' },
  { value: 'proffs', label: 'Proffs' },
  { value: 'konsument', label: 'Konsument' },
];

export function NewsletterList({ onEdit }: NewsletterListProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [listError, setListError] = useState<string | null>(null);

  const fetchNewsletters = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const params: Record<string, string> = {};
      if (filterChannel !== 'all') params.channel = filterChannel;
      if (filterStatus !== 'all') params.status = filterStatus;
      const data = await api.newsletters.list(Object.keys(params).length > 0 ? params : undefined);
      setNewsletters(data);
    } catch (err) {
      console.error('Kunde inte hämta nyhetsbrev:', err);
      setListError('Kunde inte hämta nyhetsbrev. Kontrollera att servern är igång.');
    } finally {
      setLoading(false);
    }
  }, [filterChannel, filterStatus]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const handleCreated = (newsletter: Newsletter) => {
    setShowCreate(false);
    onEdit(newsletter);
  };

  const handleDelete = async (newsletter: Newsletter) => {
    const confirmed = window.confirm(
      `Vill du ta bort "${newsletter.title}"? Detta går inte att ångra.`
    );
    if (!confirmed) return;
    try {
      setListError(null);
      await api.newsletters.delete(newsletter.id);
      setNewsletters((prev) => prev.filter((n) => n.id !== newsletter.id));
    } catch (err) {
      console.error('Kunde inte ta bort nyhetsbrev:', err);
      setListError('Kunde inte ta bort nyhetsbrevet. Försök igen.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setListError(null);
      const duplicated = await api.newsletters.duplicate(id);
      setNewsletters((prev) => [duplicated, ...prev]);
    } catch (err) {
      console.error('Kunde inte duplicera nyhetsbrev:', err);
      setListError('Kunde inte duplicera nyhetsbrevet. Försök igen.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ByggNytt</h1>
          <p className="text-gray-500 mt-1">Hantera dina nyhetsbrev</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + Nytt nyhetsbrev
        </button>
      </div>

      {/* Skapa nytt - mallväljare */}
      {showCreate && (
        <CreateFromTemplate onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <FilterGroup options={CHANNEL_OPTIONS} value={filterChannel} onChange={setFilterChannel} />
        <div className="w-px h-6 bg-gray-200" />
        <FilterGroup options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
      </div>

      {/* Felmeddelande */}
      {listError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between">
          <span>{listError}</span>
          <button
            onClick={fetchNewsletters}
            className="text-xs text-red-700 underline hover:text-red-900 ml-4 shrink-0"
          >
            Försök igen
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-400 mb-4">
            {filterChannel !== 'all' || filterStatus !== 'all'
              ? 'Inga nyhetsbrev matchar filtret'
              : 'Inga nyhetsbrev ännu'}
          </p>
          {filterChannel === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Skapa ditt första nyhetsbrev
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {newsletters.map((nl) => (
            <NewsletterCard
              key={nl.id}
              newsletter={nl}
              onEdit={() => onEdit(nl)}
              onDuplicate={() => handleDuplicate(nl.id)}
              onDelete={() => handleDelete(nl)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// === Skapa fran mall ===

type CreateStep = 'channel' | 'template' | 'title';

function CreateFromTemplate({
  onCreated,
  onCancel,
}: {
  onCreated: (newsletter: Newsletter) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<CreateStep>('channel');
  const [channel, setChannel] = useState<'proffs' | 'konsument' | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChannelSelect = async (ch: 'proffs' | 'konsument') => {
    setChannel(ch);
    setLoadingTemplates(true);
    setError(null);
    try {
      const data = await api.templates.list(ch);
      setTemplates(data);
      setStep('template');
    } catch (err) {
      console.error('Kunde inte hämta mallar:', err);
      setError('Kunde inte hämta mallar. Kontrollera att servern är igång.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (tmpl: Template | null) => {
    setSelectedTemplate(tmpl);
    setStep('title');
  };

  const handleCreate = async () => {
    if (!title.trim() || !channel) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.newsletters.create({
        title: title.trim(),
        channel,
        ...(selectedTemplate ? { from_template_id: selectedTemplate.id } : {}),
      });
      onCreated(created);
    } catch (err) {
      console.error('Kunde inte skapa nyhetsbrev:', err);
      setError('Kunde inte skapa nyhetsbrevet. Försök igen.');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Steg-indikator */}
      <div className="flex items-center gap-2 mb-5">
        <StepIndicator num={1} label="Kanal" active={step === 'channel'} done={!!channel} />
        <div className="w-6 h-px bg-gray-300" />
        <StepIndicator num={2} label="Mall" active={step === 'template'} done={step === 'title'} />
        <div className="w-6 h-px bg-gray-300" />
        <StepIndicator num={3} label="Titel" active={step === 'title'} done={false} />
      </div>

      {/* Steg 1: Välj kanal */}
      {step === 'channel' && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Välj kanal</h2>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(CHANNEL_CONFIG) as [string, (typeof CHANNEL_CONFIG)['proffs']][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleChannelSelect(key as 'proffs' | 'konsument')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    key === 'proffs'
                      ? 'border-green-200 hover:border-green-400 hover:bg-green-50'
                      : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{config.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                  <div className="flex gap-1 mt-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.defaultSettings.color_primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.defaultSettings.color_secondary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: config.defaultSettings.color_background }}
                    />
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Steg 2: Välj mall */}
      {step === 'template' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Välj mall</h2>
            <button
              onClick={() => {
                setStep('channel');
                setChannel(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Byt kanal
            </button>
          </div>
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Tom mall */}
              <button
                onClick={() => handleTemplateSelect(null)}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">Tom</div>
                <div className="text-xs text-gray-400 mt-1">Börja från noll</div>
              </button>
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="p-4 rounded-lg border-2 border-gray-200 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{tmpl.name}</span>
                    {tmpl.is_default && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded">
                        Standard
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{tmpl.blocks.length} block</div>
                  <div className="flex gap-1 mt-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tmpl.settings.color_primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tmpl.settings.color_secondary }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steg 3: Ange titel */}
      {step === 'title' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Namnge nyhetsbrevet</h2>
            <button
              onClick={() => setStep('template')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Byt mall
            </button>
          </div>
          <div className="mb-3 text-xs text-gray-500">
            Kanal: <strong>{channel && CHANNEL_CONFIG[channel].label}</strong>
            {selectedTemplate ? (
              <>
                {' '}
                &middot; Mall: <strong>{selectedTemplate.name}</strong>
              </>
            ) : (
              <> &middot; Ingen mall (tom)</>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="T.ex. Veckans erbjudanden v.7"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!title.trim() || creating}
              className={`px-4 py-2 text-sm rounded-md font-medium ${
                title.trim() && !creating
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {creating ? 'Skapar...' : 'Skapa'}
            </button>
          </div>
        </div>
      )}

      {/* Felmeddelande */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Avbryt */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">
          Avbryt
        </button>
      </div>
    </div>
  );
}

function StepIndicator({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          done
            ? 'bg-green-500 text-white'
            : active
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {done ? '\u2713' : num}
      </span>
      <span className={`text-xs ${active ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

// === Newsletter card ===

function NewsletterCard({
  newsletter,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  newsletter: Newsletter;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Utkast', className: 'bg-gray-100 text-gray-600' },
    ready: { label: 'Klar', className: 'bg-blue-100 text-blue-700' },
    sent: { label: 'Skickad', className: 'bg-green-100 text-green-700' },
  };

  const sc = statusConfig[newsletter.status] || {
    label: newsletter.status,
    className: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{newsletter.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                newsletter.channel === 'proffs'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {CHANNEL_CONFIG[newsletter.channel].label}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sc.className}`}>
              {sc.label}
            </span>
            <span className="text-xs text-gray-400">{newsletter.blocks.length} block</span>
            <span className="text-xs text-gray-400">
              Uppdaterad: {new Date(newsletter.updated_at).toLocaleDateString('sv-SE')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
        >
          Redigera
        </button>
        <button
          onClick={onDuplicate}
          className="px-3 py-1.5 text-sm text-gray-600 rounded hover:bg-gray-100"
        >
          Duplicera
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 rounded hover:bg-red-50"
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}

// === Filter ===

function FilterGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            value === opt.value
              ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
              : 'text-gray-500 hover:bg-gray-100 border border-transparent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
