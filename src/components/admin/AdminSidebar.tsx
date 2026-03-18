'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

const links = [
  { href: '/admin', label: 'Dashboard', icon: '⬛' },
  { href: '/admin/content', label: 'Conteúdo', icon: '🎬' },
  { href: '/admin/content/new', label: 'Novo conteúdo', icon: '＋' },
  { href: '/admin/genres', label: 'Gêneros', icon: '🎭' },
  { href: '/admin/home-rows', label: 'Home', icon: '🏠' },
  { href: '/admin/users', label: 'Usuários', icon: '👤' },
  { href: '/', label: 'Ver plataforma', icon: '▶' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>▶</span>
        <div>
          <div className={styles.logoName}>StreamVault</div>
          <div className={styles.logoSub}>Admin Panel</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`${styles.link} ${pathname === l.href ? styles.linkActive : ''}`}>
            <span className={styles.linkIcon}>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.version}>v1.0.0</div>
      </div>
    </aside>
  );
}
