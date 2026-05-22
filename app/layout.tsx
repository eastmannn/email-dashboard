import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '이메일 티켓 대시보드',
  description: 'Google Sheets 기반 이메일 티켓 현황',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
