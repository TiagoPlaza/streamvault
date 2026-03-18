'use client';
import React, { useState, useCallback } from 'react';
import styles from './page.module.css';

interface Genre {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  contentCount: number;
}

interface GenreListClientProps {
  initialGenres: Genre[];
}

export default function GenreListClient({ initialGenres }: GenreListClientProps) {
  const [genres, setGenres]     = useState<Genre[]>(initialGenres);
  const [newName, setNewName]   = useState('');
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);  // primeiro clique
  const [error, setError]       = useState('');

  // ── Criar ──────────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setNewName('');
      // Adiciona o novo gênero com contentCount 0, pois é recém-criado
      setGenres(prev => [...prev, { ...json.data, contentCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    } finally {
      setAdding(false);
    }
  }

  // ── Editar ─────────────────────────────────────────────────────────────────

  function startEdit(g: Genre) {
    setEditId(g.id);
    setEditName(g.name);
    setError('');
    setDeleteId(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditName('');
    setError('');
  }

  async function handleSave(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/genres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setGenres(prev =>
        prev.map(g => g.id === id ? { ...g, ...json.data } : g)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  // ── Excluir ────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (deleteId !== id) {
      // primeiro clique — pede confirmação
      setDeleteId(id);
      setEditId(null);
      return;
    }
    // segundo clique — confirma
    setDeleteId(null);
    try {
      const res = await fetch(`/api/genres/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) setGenres(prev => prev.filter(g => g.id !== id));
      else setError(json.error || 'Erro ao excluir gênero');
    } catch {
      setError('Erro ao excluir gênero');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gêneros</h1>
          <p className={styles.subtitle}>
            {genres.length} gênero{genres.length !== 1 ? 's' : ''} cadastrado{genres.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Formulário de novo gênero */}
      <div className={styles.addCard}>
        <h2 className={styles.addTitle}>Novo gênero</h2>
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Suspense, Musical, Biografia..."
            maxLength={50}
            disabled={adding}
          />
          <button
            className={styles.btnPrimary}
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
          >
            {adding ? 'Adicionando...' : '+ Adicionar'}
          </button>
        </div>
        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {/* Lista */}
      {genres.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎭</div>
          <p>Nenhum gênero cadastrado ainda.</p>
          <p className={styles.emptyHint}>Adicione o primeiro gênero acima.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Nome</span>
            <span>Slug</span>
            <span className={styles.centerCol}>Conteúdos</span>
            <span className={styles.actionsCol}>Ações</span>
          </div>

          {genres.map(g => (
            <div
              key={g.id}
              className={`${styles.tableRow} ${deleteId === g.id ? styles.rowDeleting : ''}`}
            >
              {editId === g.id ? (
                /* Linha em modo edição */
                <>
                  <div className={styles.editCell}>
                    <input
                      className={styles.editInput}
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setError(''); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSave(g.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      maxLength={50}
                      disabled={saving}
                    />
                    {error && <span className={styles.inlineError}>{error}</span>}
                  </div>
                  <span className={styles.slugPreview}>
                    {editName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || g.slug}
                  </span>
                  <span className={styles.centerCol} />
                  <div className={styles.actions}>
                    <button
                      className={styles.btnSave}
                      onClick={() => handleSave(g.id)}
                      disabled={saving || !editName.trim()}
                    >
                      {saving ? '...' : 'Salvar'}
                    </button>
                    <button className={styles.btnCancel} onClick={cancelEdit}>
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                /* Linha normal */
                <>
                  <span className={styles.genreName}>{g.name}</span>
                  <span className={styles.slug}>{g.slug}</span>
                  <span className={styles.centerCol}>
                    <span className={`${styles.badge} ${g.contentCount > 0 ? styles.badgeActive : styles.badgeZero}`}>
                      {g.contentCount}
                    </span>
                  </span>
                  <div className={styles.actions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => startEdit(g)}
                      title="Editar nome"
                    >
                      Editar
                    </button>
                    <button
                      className={`${styles.btnDelete} ${deleteId === g.id ? styles.btnDeleteConfirm : ''}`}
                      onClick={() => handleDelete(g.id)}
                      title={deleteId === g.id ? 'Clique para confirmar exclusão' : 'Excluir gênero'}
                    >
                      {deleteId === g.id ? '⚠ Confirmar' : 'Excluir'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aviso ao confirmar exclusão */}
      {deleteId !== null && (
        <div className={styles.deleteWarning}>
          <strong>⚠ Atenção:</strong> excluir este gênero o removerá de todos os conteúdos que o utilizam. Clique em "Confirmar" novamente para prosseguir.
          <button className={styles.cancelDelete} onClick={() => setDeleteId(null)}>
            Cancelar
          </button>
        </div>
      )}

    </div>
  );
}