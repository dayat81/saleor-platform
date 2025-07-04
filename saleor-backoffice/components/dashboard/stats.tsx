'use client'

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, ChefHat } from 'lucide-react'

const stats = [
  {
    name: 'Total Revenue',
    value: '$12,345',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    name: 'Orders Today',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
  },
  {
    name: 'Active Customers',
    value: '1,234',
    change: '+5.4%',
    trend: 'up',
    icon: Users,
  },
  {
    name: 'Menu Items',
    value: '67',
    change: '-2.1%',
    trend: 'down',
    icon: ChefHat,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
        
        return (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendIcon 
                className={`h-4 w-4 ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`} 
              />
              <span 
                className={`ml-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="ml-1 text-sm text-gray-500">from yesterday</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}