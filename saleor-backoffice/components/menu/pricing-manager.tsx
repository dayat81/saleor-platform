'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Target, Calculator, Percent } from 'lucide-react'

const pricingData = [
  {
    id: '1',
    name: 'Classic Burger',
    category: 'Main Course',
    costPrice: 5.15,
    sellingPrice: 12.99,
    markup: 152.2,
    profitMargin: 60.4,
    competitorPrice: 13.50,
    recommendedPrice: 12.75,
    priceHistory: [
      { date: '2024-01-01', price: 11.99 },
      { date: '2024-01-15', price: 12.99 },
    ],
    demandElasticity: 'medium',
    salesVolume: 150,
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    category: 'Main Course',
    costPrice: 8.75,
    sellingPrice: 16.99,
    markup: 94.2,
    profitMargin: 48.5,
    competitorPrice: 17.50,
    recommendedPrice: 17.25,
    priceHistory: [
      { date: '2024-01-01', price: 15.99 },
      { date: '2024-01-10', price: 16.99 },
    ],
    demandElasticity: 'low',
    salesVolume: 120,
  },
  {
    id: '3',
    name: 'Caesar Salad',
    category: 'Salad',
    costPrice: 4.25,
    sellingPrice: 9.99,
    markup: 135.1,
    profitMargin: 57.5,
    competitorPrice: 10.50,
    recommendedPrice: 10.25,
    priceHistory: [
      { date: '2024-01-01', price: 9.99 },
    ],
    demandElasticity: 'high',
    salesVolume: 80,
  },
]

export function PricingManager() {
  const [items, setItems] = useState(pricingData)
  const [selectedItem, setSelectedItem] = useState(null)

  const calculateMetrics = (costPrice: number, sellingPrice: number) => {
    const markup = ((sellingPrice - costPrice) / costPrice) * 100
    const profitMargin = ((sellingPrice - costPrice) / sellingPrice) * 100
    return { markup, profitMargin }
  }

  const getElasticityColor = (elasticity: string) => {
    switch (elasticity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updatePrice = (itemId: string, newPrice: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const metrics = calculateMetrics(item.costPrice, newPrice)
        return {
          ...item,
          sellingPrice: newPrice,
          markup: metrics.markup,
          profitMargin: metrics.profitMargin,
        }
      }
      return item
    }))
  }

  const totalRevenue = items.reduce((sum, item) => sum + (item.sellingPrice * item.salesVolume), 0)
  const totalCost = items.reduce((sum, item) => sum + (item.costPrice * item.salesVolume), 0)
  const totalProfit = totalRevenue - totalCost
  const averageMargin = items.reduce((sum, item) => sum + item.profitMargin, 0) / items.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Percent className="h-5 w-5 mr-2" />
              Avg. Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.category}</CardDescription>
                </div>
                <Badge className={getElasticityColor(item.demandElasticity)}>
                  {item.demandElasticity} demand
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Cost Price</Label>
                  <div className="text-lg font-semibold">${item.costPrice.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Selling Price</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                      className="w-24"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Markup</Label>
                  <div className="text-lg font-semibold text-blue-600">
                    {item.markup.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Profit Margin</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {item.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-600">Market Analysis</Label>
                  <Button size="sm" variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Optimize
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Competitor Price:</span>
                    <span className="ml-2 font-medium">${item.competitorPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Recommended:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      ${item.recommendedPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Sales:</span>
                    <span className="ml-2 font-medium">{item.salesVolume}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="ml-2 font-medium">
                      ${(item.sellingPrice * item.salesVolume).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Last updated: {item.priceHistory[item.priceHistory.length - 1]?.date || 'Never'}
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">
                    Price History
                  </Button>
                  <Button size="sm">
                    Update Price
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}