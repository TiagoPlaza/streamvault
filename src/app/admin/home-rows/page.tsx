'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface HomeRow {
  id: number;
  title: string;
  filterType: string;
  filterValue: string | null;
  sortBy: string;
  contentLimit: number;
  position: number;
  active: boolean;
  rowType: 'standard' | 'top10';
  metadata?: {
    period?: 'day' | 'week' | 'month' | 'all_time';
    genreId?: string;
    type?: 'movie' | 'series' | 'both';
  } | null;
}

const FILTER_TYPES = [
  { value: 'genre',        label: 'Gênero — todos',   hint: 'Ex: Ação,Aventura' },
  { value: 'genre_movie',  label: 'Gênero — filmes',  hint: 'Ex: Drama,Comédia' },
  { value: 'genre_series', label: 'Gênero — séries',  hint: 'Ex: Ação,Fantasia' },
  { value: 'type',         label: 'Tipo',              hint: 'movie  ou  series' },
  { value: 'featured',     label: 'Em Destaque',       hint: '(sem valor)' },
  { value: 'tag',          label: 'Tag',               hint: 'Ex: anime' },
  { value: 'new',          label: 'Novidades',         hint: '(sem valor)' },
  { value: 'top10',        label: 'Top 10 — algoritmo',hint: '(sem valor)' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularidade' },
  { value: 'score',      label: 'Pontuação' },
  { valuez: 'year',       label: 'Mais recente' },
  { value: 'top10_algo', label: 'Algoritmo Top 10' },
  { value: 'random',     label: 'Aleatório diário' },
];

const BLANK: Omit<HomeRow, 'id'> = {
  title: '', filterType: 'genre', filterValue: '',
  sortBy: 'popularity', contentLimit: 20,
  position: 0, active: true, rowType: 'standard', metadata: { period: 'week', type: 'both' }
};

// ─── Sub‑componente de formulário (reutilizado em Nova e Edição) ─────────────

interface RowFormProps {
  value: Omit<HomeRow, 'id'>;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onCancel?: () => void;
  saving: boolean;
  error: string;
  mode: 'create' | 'edit';
}

function RowForm({ value, onChange, onSave, onCancel, saving, error, mode }: RowFormProps) {
  const filterMeta = FILTER_TYPES.find(f => f.value === value.filterType);
  const needsValue = !['featured', 'new', 'top10'].includes(value.filterType);
  const isTop10 = value.rowType === 'top10';

  return (
    <div className={styles.form}>
      {/* Linha 1: título + tipo de row */}
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>Título *</label>
          <input
            className={styles.input}
            value={value.title}
            onChange={e => onChange('title', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            placeholder="Ex: Séries de Ação"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Visual</label>
          <select className={styles.select} value={value.rowType} onChange={e => {
            const rowType = e.target.value as 'standard' | 'top10';
            onChange('rowType', rowType);
            if (rowType === 'top10') {
              onChange('filterType', 'top10');
              onChange('filterValue', '');
              onChange('metadata', { ...value.metadata, period: value.metadata?.period || 'week', type: value.metadata?.type || 'both' });
            } else if (value.filterType === 'top10') {
              onChange('filterType', 'genre');
              onChange('metadata', {});
            }
          }}>
            <option value="standard">Carrossel padrão (16:9)</option>
            <option value="top10">Top 10 — poster vertical + número</option>
          </select>
        </div>
      </div>

      {/* Linha 2: filtro + valor + ordenação */}
      {isTop10 ? (
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label}>Período do Ranking</label>
            <select
              className={styles.select}
              value={value.metadata?.period || 'week'}
              onChange={e => onChange('metadata', { ...value.metadata, period: e.target.value })}
            >
              <option value="day">Hoje (24h)</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="all_time">Todo o Tempo</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tipo de Conteúdo</label>
            <select
              className={styles.select}
              value={value.metadata?.type || 'both'}
              onChange={e => onChange('metadata', { ...value.metadata, type: e.target.value })}
            >
              <option value="both">Filmes e Séries</option>
              <option value="movie">Apenas Filmes</option>
              <option value="series">Apenas Séries</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Gênero (ID opcional)</label>
            <input
              className={styles.input}
              placeholder="Ex: action"
              value={value.metadata?.genreId || ''}
              onChange={e => onChange('metadata', { ...value.metadata, genreId: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label}>Filtrar por</label>
            <select className={styles.select} value={value.filterType}
              onChange={e => onChange('filterType', e.target.value)}>
              {FILTER_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Valor
              {filterMeta && <span className={styles.labelHint}> — {filterMeta.hint}</span>}
            </label>
            <input
              className={styles.input}
              value={value.filterValue ?? ''}
              onChange={e => onChange('filterValue', e.target.value)}
              placeholder={filterMeta?.hint ?? ''}
              disabled={!needsValue}
              style={!needsValue ? { opacity: .35 } : {}}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Ordenar por</label>
            <select className={styles.select} value={value.sortBy}
              onChange={e => onChange('sortBy', e.target.value)}>
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Linha 3: limite + posição + ativo */}
      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label}>Máx. itens</label>
          <input className={styles.input} type="number" min={1} max={50}
            value={value.contentLimit} onChange={e => onChange('contentLimit', Number(e.target.value))} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Posição</label>
          <input className={styles.input} type="number" min={1}
            value={value.position} onChange={e => onChange('position', Number(e.target.value))} />
        </div>
        <div className={styles.field} style={{ justifyContent: 'flex-end', paddingTop: 22 }}>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={value.active}
              onChange={e => onChange('active', e.target.checked)} />
            <span>Visível na home</span>
          </label>
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.formActions}>
        {onCancel && (
          <button className={styles.btnCancel} onClick={onCancel} type="button">Cancelar</button>
        )}
        <button className={styles.btnSave} onClick={onSave} disabled={saving} type="button">
          {saving ? 'Salvando…' : mode === 'create' ? '+ Adicionar' : '✓ Salvar'}
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function AdminHomeRowsPage() {
  const [rows,    setRows]    = useState<HomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState<Omit<HomeRow,'id'>>(BLANK);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [editForm,setEditForm]= useState<Omit<HomeRow,'id'>>(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [deleteId,setDeleteId]= useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/home-rows');
    const json = await res.json();
    if (json.ok) setRows(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Criar ─────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newForm.title.trim()) { setError('Título é obrigatório'); return; }
    setSaving(true); setError('');
    const res  = await fetch('/api/home-rows', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); setSaving(false); return; }
    setNewForm(BLANK);
    await load();
    setSaving(false);
  }

  // ── Editar inline ─────────────────────────────────────────────────────────

  function startEdit(row: HomeRow) {
    setEditId(row.id);
    setEditForm({ 
      title: row.title, 
      filterType: row.filterType,
      filterValue: row.filterValue ?? '', 
      sortBy: row.sortBy,
      contentLimit: row.contentLimit, 
      position: row.position, active: row.active,
      rowType: row.rowType, 
      metadata: row.rowType === 'top10' ? row.metadata : null });
    setError('');
    setDeleteId(null);
  }

  function cancelEdit() { setEditId(null); setError(''); }

  async function handleUpdate() {
    if (!editForm.title.trim()) { setError('Título é obrigatório'); return; }
    setSaving(true); setError('');
    const res  = await fetch(`/api/home-rows/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); setSaving(false); return; }
    setEditId(null);
    setRows(prev => prev.map(r => r.id === editId ? json.data : r));
    setSaving(false);
  }

  // ── Toggle ativo ──────────────────────────────────────────────────────────

  async function toggleActive(row: HomeRow) {
    await fetch(`/api/home-rows/${row.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, active: !r.active } : r));
  }

  // ── Reordenar ▲▼ ──────────────────────────────────────────────────────────

  async function move(id: number, dir: 'up' | 'down') {
    const sorted = [...rows].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(r => r.id === id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return;
    [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
    const ids = sorted.map(r => r.id);
    // Optimistic update
    setRows(sorted.map((r, i) => ({ ...r, position: i + 1 })));
    await fetch(`/api/home-rows/0`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }

  // ── Excluir (duplo clique) ────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (deleteId !== id) { setDeleteId(id); return; }
    setDeleteId(null);
    await fetch(`/api/home-rows/${id}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== id));
    if (editId === id) setEditId(null);
  }

  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const active  = rows.filter(r => r.active).length;

  return (
    <div className={styles.page}>

      {/* ── Cabeçalho ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Linhas da Home</h1>
          <p className={styles.subtitle}>
            {rows.length} configuradas · {active} visíveis
          </p>
        </div>
      </div>

      {/* ── Formulário de nova linha ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Nova linha</h2>
        <RowForm
          value={newForm}
          onChange={(k, v) => setNewForm(f => ({ ...f, [k]: v }))}
          onSave={handleCreate}
          saving={saving}
          error={editId === null ? error : ''}
          mode="create"
        />
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className={styles.loading}>Carregando…</div>
      ) : sorted.length === 0 ? (
        <div className={styles.empty}>Nenhuma linha cadastrada.</div>
      ) : (
        <div className={styles.table}>

          {/* Cabeçalho */}
          <div className={styles.thead}>
            <span className={styles.colPos}>Pos.</span>
            <span className={styles.colTitle}>Título</span>
            <span className={styles.colFilter}>Filtro</span>
            <span className={styles.colSort}>Ordenação</span>
            <span className={styles.colType}>Visual</span>
            <span className={styles.colActive}>Ativa</span>
            <span className={styles.colActions}>Ações</span>
          </div>

          {sorted.map((row, idx) => (
            <React.Fragment key={row.id}>

              {/* Linha normal */}
              {editId !== row.id && (
                <div className={`${styles.trow} ${!row.active ? styles.trowInactive : ''} ${deleteId === row.id ? styles.trowDeleting : ''}`}>

                  {/* Posição + setas */}
                  <div className={styles.colPos}>
                    <div className={styles.posBlock}>
                      <button className={styles.moveBtn} onClick={() => move(row.id, 'up')}
                        disabled={idx === 0} title="Mover para cima">▲</button>
                      <span className={styles.posNum}>{row.position}</span>
                      <button className={styles.moveBtn} onClick={() => move(row.id, 'down')}
                        disabled={idx === sorted.length - 1} title="Mover para baixo">▼</button>
                    </div>
                  </div>

                  <span className={styles.colTitle}>
                    <span className={styles.rowTitle}>{row.title}</span>
                  </span>

                  <span className={styles.colFilter}>
                    {row.rowType === 'top10' ? (
                      <>
                        <span className={styles.chip}>
                          {row.metadata?.period === 'all_time' ? 'Geral' : (row.metadata?.period || 'Semana')}
                        </span>
                        {row.metadata?.genreId && (
                          <span className={styles.chipVal}>{row.metadata.genreId}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={styles.chip}>
                          {FILTER_TYPES.find(f => f.value === row.filterType)?.label ?? row.filterType}
                        </span>
                        {row.filterValue && (
                          <span className={styles.chipVal}>{row.filterValue}</span>
                        )}
                      </>
                    )}
                  </span>

                  <span className={styles.colSort}>
                    {row.rowType === 'top10'
                      ? <span style={{ opacity: 0.5 }}>Automático</span>
                      : (SORT_OPTIONS.find(s => s.value === row.sortBy)?.label ?? row.sortBy)
                    }
                  </span>

                  <span className={styles.colType}>
                    <span className={`${styles.typeBadge} ${row.rowType === 'top10' ? styles.typeBadgeTop10 : ''}`}>
                      {row.rowType === 'top10' ? 'Top 10' : 'Padrão'}
                    </span>
                  </span>

                  <span className={styles.colActive}>
                    <button
                      className={`${styles.toggle} ${row.active ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => toggleActive(row)}
                      title={row.active ? 'Desativar' : 'Ativar'}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </span>

                  <div className={styles.colActions}>
                    <button className={styles.btnEdit} onClick={() => startEdit(row)}>
                      Editar
                    </button>
                    <button
                      className={`${styles.btnDel} ${deleteId === row.id ? styles.btnDelConfirm : ''}`}
                      onClick={() => handleDelete(row.id)}
                      title={deleteId === row.id ? 'Clique para confirmar' : 'Excluir'}
                    >
                      {deleteId === row.id ? '⚠ Confirmar' : 'Excluir'}
                    </button>
                  </div>
                </div>
              )}

              {/* Linha em modo edição — inline */}
              {editId === row.id && (
                <div className={styles.inlineEdit}>
                  <div className={styles.inlineEditHeader}>
                    <span className={styles.inlineEditLabel}>Editando: <strong>{row.title}</strong></span>
                  </div>
                  <RowForm
                    value={editForm}
                    onChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))}
                    onSave={handleUpdate}
                    onCancel={cancelEdit}
                    saving={saving}
                    error={editId !== null ? error : ''}
                    mode="edit"
                  />
                </div>
              )}

            </React.Fragment>
          ))}
        </div>
      )}

      {/* Banner de confirmação de exclusão */}
      {deleteId !== null && (
        <div className={styles.deleteBanner}>
          <span>⚠ Clique em <strong>⚠ Confirmar</strong> novamente para excluir permanentemente.</span>
          <button className={styles.cancelDelBtn} onClick={() => setDeleteId(null)}>Cancelar</button>
        </div>
      )}

    </div>
  );
}
