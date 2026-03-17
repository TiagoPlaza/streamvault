import type { Metadata } from 'next';
import { ContentProvider } from '@/context/ContentContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamVault',
  description: 'Plataforma de streaming com conteúdo curado',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ContentProvider>
          {children}
        </ContentProvider>
      </body>
    </html>
  );
}
