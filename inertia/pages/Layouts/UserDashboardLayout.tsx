import type { ReactNode } from 'react'

interface UserDashboardLayoutProps {
  children: ReactNode
}

export default function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  return (
    <div className="collection-gallery collection-salon min-h-screen font-sans overflow-x-hidden flex flex-col relative">
      {children}
    </div>
  )
}
