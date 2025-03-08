import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import favicon from "@/public/logo.png"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "moodmix",
  description: "Create and listen to mood-based playlists",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="@/public/logo.png" type="image/x-icon" />
        {/* <link rel="shortcut icon" href={favicon} type="image/x-icon" /> */}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}



import './globals.css'