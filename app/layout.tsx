import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { MaterialWebLoader } from '@/components/material-web-loader'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '长庆油气田数据质控平台',
  description: '长庆油气田数据质控平台——一致性、完整性、分布范围与相关性数据质量管控系统',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef7ff' },
    { media: '(prefers-color-scheme: dark)', color: '#141218' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={roboto.variable} translate="no" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* Apply stored theme before first paint to avoid a flash */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <MaterialWebLoader />
        {children}
      </body>
    </html>
  )
}
