'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

const menuItems = [
  {
    id: '1',
    name: 'Classic Burger',
    category: 'Main Course',
    isAvailable: true,
    isSeasonalItem: false,
    availabilityReason: '',
    estimatedPrepTime: 15,
    ingredientAvailability: {
      beefPatty: { available: true, stock: 150 },
      burgerBun: { available: true, stock: 200 },
      lettuce: { available: true, stock: 50 },
      tomato: { available: false, stock: 0 },
      specialSauce: { available: true, stock: 25 },
    },
    schedule: {
      monday: { start: '11:00', end: '22:00', available: true },
      tuesday: { start: '11:00', end: '22:00', available: true },
      wednesday: { start: '11:00', end: '22:00', available: true },
      thursday: { start: '11:00', end: '22:00', available: true },
      friday: { start: '11:00', end: '23:00', available: true },
      saturday: { start: '11:00', end: '23:00', available: true },
      sunday: { start: '12:00', end: '21:00', available: true },
    },
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    category: 'Main Course',
    isAvailable: true,
    isSeasonalItem: false,
    availabilityReason: '',
    estimatedPrepTime: 20,
    ingredientAvailability: {
      pizzaDough: { available: true, stock: 50 },
      tomatoSauce: { available: true, stock: 30 },
      mozzarella: { available: true, stock: 25 },
      basil: { available: true, stock: 15 },
    },
    schedule: {
      monday: { start: '11:00', end: '22:00', available: true },
      tuesday: { start: '11:00', end: '22:00', available: true },
      wednesday: { start: '11:00', end: '22:00', available: true },
      thursday: { start: '11:00', end: '22:00', available: true },
      friday: { start: '11:00', end: '23:00', available: true },
      saturday: { start: '11:00', end: '23:00', available: true },
      sunday: { start: '12:00', end: '21:00', available: true },
    },
  },
  {
    id: '3',
    name: 'Seasonal Pumpkin Soup',
    category: 'Soup',
    isAvailable: false,
    isSeasonalItem: true,
    availabilityReason: 'Out of season',
    estimatedPrepTime: 10,
    ingredientAvailability: {
      pumpkin: { available: false, stock: 0 },
      cream: { available: true, stock: 10 },
      seasonalSpices: { available: false, stock: 0 },
    },
    schedule: {
      monday: { start: '11:00', end: '22:00', available: false },
      tuesday: { start: '11:00', end: '22:00', available: false },
      wednesday: { start: '11:00', end: '22:00', available: false },
      thursday: { start: '11:00', end: '22:00', available: false },
      friday: { start: '11:00', end: '23:00', available: false },
      saturday: { start: '11:00', end: '23:00', available: false },
      sunday: { start: '12:00', end: '21:00', available: false },
    },
  },
]

export function MenuAvailability() {
  const [items, setItems] = useState(menuItems)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const toggleAvailability = (itemId: string) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, isAvailable: !item.isAvailable }
        : item
    ))
  }

  const getIngredientStatus = (ingredients: any) => {
    const total = Object.keys(ingredients).length
    const available = Object.values(ingredients).filter((ing: any) => ing.available).length
    return { available, total, percentage: (available / total) * 100 }
  }

  const getAvailabilityColor = (item: any) => {
    if (!item.isAvailable) return 'bg-red-500'
    const status = getIngredientStatus(item.ingredientAvailability)
    if (status.percentage === 100) return 'bg-green-500'
    if (status.percentage >= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Available Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.isAvailable).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Unavailable Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {items.filter(item => !item.isAvailable).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ingredient Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(item => {
                const status = getIngredientStatus(item.ingredientAvailability)
                return status.percentage < 100
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((item) => {
          const ingredientStatus = getIngredientStatus(item.ingredientAvailability)
          
          return (
            <Card key={item.id} className="relative">
              <div className="absolute top-4 right-4">
                <div className={`w-3 h-3 rounded-full ${getAvailabilityColor(item)}`} />
              </div>
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>
                      {item.category} • {item.estimatedPrepTime} min prep time
                    </CardDescription>
                  </div>
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => toggleAvailability(item.id)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant={item.isAvailable ? "default" : "secondary"}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                  {item.isSeasonalItem && (
                    <Badge variant="outline">Seasonal</Badge>
                  )}
                </div>
                
                {item.availabilityReason && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{item.availabilityReason}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ingredient Availability</span>
                    <span className="text-sm text-gray-600">
                      {ingredientStatus.available}/{ingredientStatus.total}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        ingredientStatus.percentage === 100 ? 'bg-green-500' :
                        ingredientStatus.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${ingredientStatus.percentage}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(item.ingredientAvailability).map(([ingredient, info]: [string, any]) => (
                      <div key={ingredient} className="flex items-center space-x-2">
                        {info.available ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="capitalize">{ingredient.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-gray-500">({info.stock})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today's Schedule</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {item.schedule.monday.start} - {item.schedule.monday.end}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}