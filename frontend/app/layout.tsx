import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SettleFlow',
  description: 'Payment orchestration platform for iGaming merchants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
