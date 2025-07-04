'use client'

import { Clock, DollarSign } from 'lucide-react'

const recentOrders = [
  {
    id: '#1234',
    customer: 'John Doe',
    items: ['Burger', 'Fries', 'Coke'],
    total: '$24.99',
    status: 'preparing',
    time: '5 min ago',
  },
  {
    id: '#1235',
    customer: 'Jane Smith',
    items: ['Pizza', 'Garlic Bread'],
    total: '$18.50',
    status: 'ready',
    time: '12 min ago',
  },
  {
    id: '#1236',
    customer: 'Bob Johnson',
    items: ['Salad', 'Soup'],
    total: '$16.75',
    status: 'delivered',
    time: '25 min ago',
  },
]

const statusColors = {
  preparing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
}

export function RecentOrders() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
      </div>
      
      <div className="divide-y">
        {recentOrders.map((order) => (
          <div key={order.id} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-900">{order.id}</span>
                <span 
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[order.status as keyof typeof statusColors]
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {order.time}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                <p className="text-sm text-gray-500">{order.items.join(', ')}</p>
              </div>
              <div className="flex items-center text-sm font-medium text-gray-900">
                <DollarSign className="h-4 w-4 mr-1" />
                {order.total}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}