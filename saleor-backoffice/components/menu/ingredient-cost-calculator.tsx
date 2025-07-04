'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const sampleIngredients = [
  {
    id: '1',
    name: 'Beef Patty (1/4 lb)',
    category: 'Protein',
    unit: 'piece',
    costPerUnit: 3.50,
    supplier: 'Premium Meats Co.',
    lastUpdated: '2024-01-15',
    trend: 'up',
    change: '+0.25',
    stock: 150,
    minStock: 50,
  },
  {
    id: '2',
    name: 'Fresh Mozzarella',
    category: 'Dairy',
    unit: 'kg',
    costPerUnit: 18.50,
    supplier: 'Artisan Cheese Ltd.',
    lastUpdated: '2024-01-14',
    trend: 'down',
    change: '-0.50',
    stock: 25,
    minStock: 10,
  },
  {
    id: '3',
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    costPerUnit: 4.25,
    supplier: 'Farm Fresh Produce',
    lastUpdated: '2024-01-16',
    trend: 'up',
    change: '+0.15',
    stock: 80,
    minStock: 20,
  },
  {
    id: '4',
    name: 'Burger Buns',
    category: 'Bakery',
    unit: 'piece',
    costPerUnit: 0.75,
    supplier: 'Golden Bakery',
    lastUpdated: '2024-01-15',
    trend: 'stable',
    change: '0.00',
    stock: 200,
    minStock: 100,
  },
]

export function IngredientCostCalculator() {
  const [ingredients, setIngredients] = useState(sampleIngredients)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<any>(null)

  const categories = ['all', 'Protein', 'Dairy', 'Vegetables', 'Bakery', 'Condiments', 'Beverages']

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalInventoryValue = ingredients.reduce((sum, ingredient) => 
    sum + (ingredient.costPerUnit * ingredient.stock), 0
  )

  const lowStockItems = ingredients.filter(ingredient => ingredient.stock <= ingredient.minStock)

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ingredients..."
              className="pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Ingredient Cost Management
          </CardTitle>
          <CardDescription>
            Track ingredient costs, suppliers, and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Ingredient</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Unit Cost</th>
                  <th className="text-left py-3 px-4">Stock</th>
                  <th className="text-left py-3 px-4">Supplier</th>
                  <th className="text-left py-3 px-4">Trend</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-gray-500">per {ingredient.unit}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {ingredient.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">${ingredient.costPerUnit.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        Updated {ingredient.lastUpdated}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium ${ingredient.stock <= ingredient.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {ingredient.stock}
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: {ingredient.minStock}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{ingredient.supplier}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {renderTrendIcon(ingredient.trend)}
                        <span className={`text-sm ${
                          ingredient.trend === 'up' ? 'text-red-600' : 
                          ingredient.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {ingredient.change}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIngredient(ingredient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Low Stock Alert</CardTitle>
            <CardDescription className="text-red-700">
              The following items are running low on stock:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      Current: {item.stock} | Minimum: {item.minStock}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}