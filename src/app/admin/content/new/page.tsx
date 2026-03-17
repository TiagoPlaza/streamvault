'use client';
import ContentForm from '@/components/admin/ContentForm';
import styles from './page.module.css';

export default function NewContentPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Novo Conteúdo</h1>
        <p className={styles.sub}>Adicione um novo título à plataforma</p>
      </div>
      <div className={styles.formWrap}>
        <ContentForm mode="create" />
      </div>
    </div>
  );
}
