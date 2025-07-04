'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

const menuItems = [
  {
    name: 'Classic Burger',
    orders: 45,
    revenue: '$450.00',
    trend: 'up',
    change: '+15%',
  },
  {
    name: 'Margherita Pizza',
    orders: 32,
    revenue: '$384.00',
    trend: 'up',
    change: '+8%',
  },
  {
    name: 'Caesar Salad',
    orders: 28,
    revenue: '$252.00',
    trend: 'down',
    change: '-5%',
  },
  {
    name: 'Chicken Wings',
    orders: 22,
    revenue: '$198.00',
    trend: 'up',
    change: '+12%',
  },
]

export function MenuPerformance() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Top Menu Items</h2>
        <p className="text-sm text-gray-500">Performance over the last 24 hours</p>
      </div>
      
      <div className="divide-y">
        {menuItems.map((item) => {
          const TrendIcon = item.trend === 'up' ? TrendingUp : TrendingDown
          
          return (
            <div key={item.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.orders} orders</p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-900">{item.revenue}</p>
                  <div className="flex items-center justify-end">
                    <TrendIcon 
                      className={`h-4 w-4 ${
                        item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`} 
                    />
                    <span 
                      className={`ml-1 text-sm ${
                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}