'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/browse', label: 'Explorar' },
    { href: '/browse?type=movie', label: 'Filmes' },
    { href: '/browse?type=series', label: 'Séries' },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>▶</span>
          <span className={styles.logoText}>STREAM<span className={styles.logoAccent}>VAULT</span></span>
        </Link>

        <div className={styles.links}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`${styles.link} ${pathname === l.href.split('?')[0] ? styles.linkActive : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          <div className={`${styles.searchWrap} ${showSearch ? styles.searchOpen : ''}`}>
            <button className={styles.iconBtn} onClick={() => setShowSearch(!showSearch)}>
              <SearchIcon />
            </button>
            {showSearch && (
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <Link href="/admin" className={styles.adminBtn}>
            <AdminIcon />
            <span>Admin</span>
          </Link>
          <div className={styles.avatar}>V</div>
        </div>
      </div>
    </nav>
  );
}

const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const AdminIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>;
