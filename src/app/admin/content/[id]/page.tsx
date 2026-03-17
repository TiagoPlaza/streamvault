'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ContentForm from '@/components/admin/ContentForm';
import { useContent } from '@/context/ContentContext';
import styles from './page.module.css';

export default function EditContentPage() {
  const { id } = useParams<{ id: string }>();
  const { getById } = useContent();
  const item = getById(id);

  if (!item) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <p>Conteúdo não encontrado</p>
          <Link href="/admin/content">← Voltar à lista</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Editar Conteúdo</h1>
          <p className={styles.sub}>{item.title}</p>
        </div>
        <Link href="/admin/content" className={styles.backBtn}>← Voltar</Link>
      </div>
      <div className={styles.formWrap}>
        <ContentForm mode="edit" initial={item} />
      </div>
    </div>
  );
}
