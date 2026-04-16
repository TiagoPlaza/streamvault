'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './intro.module.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: 'O que é StreamVault?',
    answer:
      'StreamVault é um serviço de streaming que oferece uma ampla variedade de séries, filmes e documentários. Assista a quantos títulos quiser, quando e onde quiser – tudo por um preço mensal acessível.',
  },
  {
    id: 2,
    question: 'Quanto custa?',
    answer:
      'Oferecemos planos acessíveis a partir de R$ 25,90 por mês. Escolha o plano que melhor se adequa ao seu orçamento, sem compromisso de longo prazo.',
  },
  {
    id: 3,
    question: 'Onde posso assistir?',
    answer:
      'Assista em qualquer aparelho: celular, tablet, Smart TV, notebook ou streaming device. Esteja conectado à internet ou baixe seus títulos favoritos para assistir offline.',
  },
  {
    id: 4,
    question: 'Como faço para cancelar?',
    answer:
      'StreamVault é flexível. Você pode cancelar sua assinatura online com apenas dois cliques. Sem taxa de cancelamento, inicie e encerre quando quiser.',
  },
  {
    id: 5,
    question: 'Posso compartilhar minha conta?',
    answer:
      'Sim! Crie perfis separados para cada membro da família. Todos podem assistir simultaneamente em aparelhos diferentes com um único plano.',
  },
  {
    id: 6,
    question: 'Existe alguma taxa oculta?',
    answer:
      'Não. Sem taxas ocultas, sem compromissos de contrato. Pague apenas pela assinatura mensal que escolheu. Cancele quando desejar, sem penalidades.',
  },
];

const trendingShows = [
  { id: 1, title: 'Stranger Things', rank: '1' },
  { id: 2, title: 'Bridgerton', rank: '2' },
  { id: 3, title: 'The Crown', rank: '3' },
  { id: 4, title: 'The Witcher', rank: '4' },
  { id: 5, title: 'The Last of Us', rank: '5' },
  { id: 6, title: 'Narcos', rank: '6' },
  { id: 7, title: 'You', rank: '7' },
  { id: 8, title: 'Wednesday', rank: '8' },
  { id: 9, title: 'The Boys', rank: '9' },
  { id: 10, title: 'Squid Game', rank: '10' },
];

const benefits = [
  {
    id: 1,
    title: 'Aproveite na TV',
    description: 'Assista em Smart TVs, PlayStation, Xbox, Chromecast, Apple TV e muito mais.',
    icon: '📺',
  },
  {
    id: 2,
    title: 'Baixe para assistir offline',
    description: 'Salve seus títulos favoritos e leve StreamVault para qualquer lugar.',
    icon: '📱',
  },
  {
    id: 3,
    title: 'Assista onde quiser',
    description: 'Celular, tablet, laptop ou TV. Transmita ilimitadamente em qualquer lugar.',
    icon: '🌍',
  },
  {
    id: 4,
    title: 'Crie perfis para crianças',
    description: 'Um espaço seguro para as crianças com controle parental e conteúdo apropriado.',
    icon: '👨‍👩‍👧‍👦',
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email for subscription:', email);
    // TODO: Integrar com API de inscrição
    alert(`Email registrado: ${email}`);
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>▶</span>
            <span className={styles.logoText}>STREAM<span className={styles.logoAccent}>VAULT</span></span>
          </div>
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>
              Português
            </a>
            <Link href="/login" className={styles.signInBtn}>
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Filmes, séries e muito mais, sem limites
          </h1>
          <p className={styles.heroSubtitle}>
            A partir de R$ 25,90. Cancele quando quiser.
          </p>

          {/* Email CTA */}
          <div className={styles.ctaSection}>
            <h2 className={styles.ctaHeading}>
              Quer assistir? Informe seu email para criar ou reiniciar sua assinatura.
            </h2>
            <form onSubmit={handleSubscribe} className={styles.emailForm}>
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={styles.emailInput}
              />
              <button type="submit" className={styles.ctaButton}>
                Vamos lá
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className={styles.trendingSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Em alta</h2>

          <div className={styles.trendingGrid}>
            {trendingShows.map(show => (
              <div key={show.id} className={styles.trendingItem}>
                <div className={styles.trendingNumber}>{show.rank}</div>
                <div className={styles.trendingContent}>
                  <h3 className={styles.trendingTitle}>{show.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefitsSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Mais motivos para assinar</h2>

          <div className={styles.benefitsGrid}>
            {benefits.map(benefit => (
              <div key={benefit.id} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>

          <div className={styles.faqList}>
            {faqItems.map(item => (
              <div key={item.id} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={expandedFAQ === item.id}
                >
                  <span>{item.question}</span>
                  <span className={styles.faqIcon}>+</span>
                </button>
                {expandedFAQ === item.id && (
                  <div className={styles.faqAnswer}>{item.answer}</div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Email Again */}
          <div className={styles.ctaSection2}>
            <h3 className={styles.ctaHeading2}>
              Quer assistir? Informe seu email para criar ou reiniciar sua assinatura.
            </h3>
            <form onSubmit={handleSubscribe} className={styles.emailForm2}>
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={styles.emailInput2}
              />
              <button type="submit" className={styles.ctaButton2}>
                Vamos lá
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <p className={styles.footerText}>Dúvidas? Ligue para 0800-123-4567</p>
          </div>

          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>
              Perguntas frequentes
            </a>
            <a href="#" className={styles.footerLink}>
              Central de Ajuda
            </a>
            <a href="#" className={styles.footerLink}>
              Conta
            </a>
            <a href="#" className={styles.footerLink}>
              Media Center
            </a>
            <a href="#" className={styles.footerLink}>
              Carreiras
            </a>
            <a href="#" className={styles.footerLink}>
              Formas de assistir
            </a>
            <a href="#" className={styles.footerLink}>
              Termos de Uso
            </a>
            <a href="#" className={styles.footerLink}>
              Privacidade
            </a>
            <a href="#" className={styles.footerLink}>
              Preferências de cookies
            </a>
            <a href="#" className={styles.footerLink}>
              Informações corporativas
            </a>
            <a href="#" className={styles.footerLink}>
              Entre em contato
            </a>
            <a href="#" className={styles.footerLink}>
              Só na StreamVault
            </a>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              StreamVault © 2025 · Construído com Next.js + TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}