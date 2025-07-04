import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { MenuPerformance } from '@/components/dashboard/menu-performance'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              F&B Dashboard
            </h1>
            
            <div className="grid gap-6 mb-8">
              <DashboardStats />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentOrders />
              <MenuPerformance />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}