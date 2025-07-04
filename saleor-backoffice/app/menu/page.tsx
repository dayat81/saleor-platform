import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MenuTabs } from '@/components/menu/menu-tabs'

export default function MenuPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Menu Management
              </h1>
            </div>
            
            <MenuTabs />
          </div>
        </main>
      </div>
    </div>
  )
}