import React from 'react';

export const metadata = {
  title: 'Data Analyst Agent API',
  description: 'AI-powered data analysis agent that can source, prepare, analyze, and visualize any data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
