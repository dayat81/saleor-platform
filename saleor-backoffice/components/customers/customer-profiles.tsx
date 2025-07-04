'use client'

import { useState } from 'react'
import { Search, Filter, MoreHorizontal, Phone, Mail, Calendar, DollarSign, TrendingUp, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CustomerDetailModal } from './customer-detail-modal'

const customerData = [
  {
    id: 'CUST001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    joinDate: '2023-03-15',
    lastOrder: '2024-01-16',
    totalOrders: 45,
    totalSpent: 1250.75,
    averageOrderValue: 27.81,
    lifetimeValue: 1850.00,
    tier: 'Gold',
    status: 'Active',
    preferredCategories: ['Main Course', 'Beverages'],
    allergies: ['Peanuts'],
    dietaryPreferences: ['Gluten-Free'],
    favoriteItems: ['Classic Burger', 'Caesar Salad'],
    orderFrequency: 'Weekly',
    communicationPrefs: {
      email: true,
      sms: false,
      push: true,
    },
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
    birthday: '1985-07-20',
    orderHistory: [
      { id: 'ORD001', date: '2024-01-16', amount: 28.50, items: ['Classic Burger', 'Fries'] },
      { id: 'ORD002', date: '2024-01-09', amount: 32.75, items: ['Pizza', 'Salad'] },
    ],
    loyaltyPoints: 1250,
    reviews: [
      { rating: 5, comment: 'Great food and service!', date: '2024-01-16' },
      { rating: 4, comment: 'Love the new menu items', date: '2024-01-02' },
    ],
  },
  {
    id: 'CUST002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 987-6543',
    avatar: '',
    joinDate: '2023-08-22',
    lastOrder: '2024-01-15',
    totalOrders: 32,
    totalSpent: 890.25,
    averageOrderValue: 27.82,
    lifetimeValue: 1340.00,
    tier: 'Silver',
    status: 'Active',
    preferredCategories: ['Salads', 'Healthy Options'],
    allergies: ['Dairy'],
    dietaryPreferences: ['Vegan', 'Organic'],
    favoriteItems: ['Quinoa Bowl', 'Green Smoothie'],
    orderFrequency: 'Bi-weekly',
    communicationPrefs: {
      email: true,
      sms: true,
      push: false,
    },
    address: {
      street: '456 Oak Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
    },
    birthday: '1990-12-03',
    orderHistory: [
      { id: 'ORD003', date: '2024-01-15', amount: 24.90, items: ['Quinoa Bowl', 'Kombucha'] },
      { id: 'ORD004', date: '2024-01-01', amount: 18.75, items: ['Green Salad'] },
    ],
    loyaltyPoints: 890,
    reviews: [
      { rating: 5, comment: 'Amazing healthy options!', date: '2024-01-15' },
    ],
  },
  {
    id: 'CUST003',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 (555) 456-7890',
    avatar: '',
    joinDate: '2023-01-10',
    lastOrder: '2024-01-10',
    totalOrders: 78,
    totalSpent: 2145.50,
    averageOrderValue: 27.51,
    lifetimeValue: 3200.00,
    tier: 'Platinum',
    status: 'VIP',
    preferredCategories: ['Pizza', 'Italian'],
    allergies: [],
    dietaryPreferences: [],
    favoriteItems: ['Margherita Pizza', 'Pasta Carbonara'],
    orderFrequency: 'Multiple times per week',
    communicationPrefs: {
      email: true,
      sms: true,
      push: true,
    },
    address: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
    },
    birthday: '1988-04-15',
    orderHistory: [
      { id: 'ORD005', date: '2024-01-10', amount: 45.20, items: ['Large Pizza', 'Garlic Bread', 'Wine'] },
      { id: 'ORD006', date: '2024-01-08', amount: 29.80, items: ['Pasta', 'Salad'] },
    ],
    loyaltyPoints: 2145,
    reviews: [
      { rating: 5, comment: 'Best pizza in town!', date: '2024-01-10' },
      { rating: 5, comment: 'Consistently great quality', date: '2023-12-20' },
    ],
  },
]

export function CustomerProfiles() {
  const [customers, setCustomers] = useState(customerData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status.toLowerCase() === statusFilter
    const matchesTier = tierFilter === 'all' || customer.tier.toLowerCase() === tierFilter
    
    return matchesSearch && matchesStatus && matchesTier
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800'
      case 'Gold': return 'bg-yellow-100 text-yellow-800'
      case 'Silver': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-purple-100 text-purple-800'
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'Active' || c.status === 'VIP').length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageLTV = customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg. LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageLTV.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              className="pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>
        <Button>
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={customer.avatar} />
                    <AvatarFallback>
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription>{customer.id}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Badge className={getTierColor(customer.tier)}>
                  {customer.tier}
                </Badge>
                <Badge className={getStatusColor(customer.status)}>
                  {customer.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{customer.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Joined {customer.joinDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{customer.orderFrequency}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">{customer.totalOrders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">${customer.totalSpent}</div>
                  <div className="text-xs text-gray-500">Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">${customer.averageOrderValue.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Avg Order</div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Loyalty Points</span>
                  <span className="font-medium">{customer.loyaltyPoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Order</span>
                  <span className="font-medium">{customer.lastOrder}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    ({customer.reviews.length} reviews)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}