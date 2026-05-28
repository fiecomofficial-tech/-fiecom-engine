import React from 'react'
import BaselineNavbar from './BaselineNavbar'
import BaselineFooter from './BaselineFooter'
import type { NavData, FooterData } from './types'

export default function BaselineLayout({
  nav,
  footer,
  children,
}: {
  nav: NavData
  footer: FooterData
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BaselineNavbar data={nav} />
      <main className="flex-1 pt-24">{children}</main>
      <BaselineFooter data={footer} />
    </div>
  )
}
