'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Zap, Apple, Droplets, Edit, Save, X } from 'lucide-react'

const nutritionalData = [
  {
    id: '1',
    name: 'Classic Burger',
    category: 'Main Course',
    nutrition: {
      calories: 520,
      protein: 28,
      carbs: 35,
      fat: 28,
      fiber: 3,
      sugar: 6,
      sodium: 850,
      cholesterol: 85,
      saturatedFat: 12,
      transFat: 0.5,
    },
    allergens: ['Gluten', 'Dairy', 'Soy'],
    dietaryFlags: ['High Protein'],
    certifications: [],
    ingredientNutrition: [
      { name: 'Beef Patty', calories: 250, protein: 20, fat: 18 },
      { name: 'Burger Bun', calories: 150, protein: 5, carbs: 30 },
      { name: 'Cheese', calories: 80, protein: 5, fat: 7 },
      { name: 'Vegetables', calories: 40, protein: 2, carbs: 8 },
    ],
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    category: 'Main Course',
    nutrition: {
      calories: 285,
      protein: 12,
      carbs: 36,
      fat: 11,
      fiber: 2,
      sugar: 4,
      sodium: 590,
      cholesterol: 25,
      saturatedFat: 6,
      transFat: 0,
    },
    allergens: ['Gluten', 'Dairy'],
    dietaryFlags: ['Vegetarian'],
    certifications: ['Organic'],
    ingredientNutrition: [
      { name: 'Pizza Dough', calories: 150, protein: 5, carbs: 30 },
      { name: 'Tomato Sauce', calories: 25, protein: 1, carbs: 6 },
      { name: 'Mozzarella', calories: 85, protein: 6, fat: 6 },
      { name: 'Basil', calories: 5, protein: 0, carbs: 1 },
    ],
  },
  {
    id: '3',
    name: 'Quinoa Power Bowl',
    category: 'Salad',
    nutrition: {
      calories: 380,
      protein: 18,
      carbs: 45,
      fat: 14,
      fiber: 8,
      sugar: 12,
      sodium: 420,
      cholesterol: 0,
      saturatedFat: 2,
      transFat: 0,
    },
    allergens: ['Nuts'],
    dietaryFlags: ['Vegan', 'Gluten-Free', 'High Fiber', 'Superfood'],
    certifications: ['Organic', 'Non-GMO'],
    ingredientNutrition: [
      { name: 'Quinoa', calories: 180, protein: 8, carbs: 30 },
      { name: 'Mixed Vegetables', calories: 100, protein: 4, carbs: 15 },
      { name: 'Avocado', calories: 80, protein: 2, fat: 8 },
      { name: 'Nuts & Seeds', calories: 120, protein: 4, fat: 10 },
    ],
  },
]

export function NutritionalInfo() {
  const [items, setItems] = useState(nutritionalData)
  const [editingItem, setEditingItem] = useState<any>(null)

  const getDietaryColor = (flag: string) => {
    const colors = {
      'Vegan': 'bg-green-100 text-green-800',
      'Vegetarian': 'bg-green-100 text-green-800',
      'Gluten-Free': 'bg-blue-100 text-blue-800',
      'High Protein': 'bg-purple-100 text-purple-800',
      'High Fiber': 'bg-orange-100 text-orange-800',
      'Superfood': 'bg-pink-100 text-pink-800',
      'Low Calorie': 'bg-teal-100 text-teal-800',
    }
    return colors[flag as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAllergenColor = (allergen: string) => {
    return 'bg-red-100 text-red-800'
  }

  const getNutritionGrade = (nutrition: any) => {
    let score = 0
    
    if (nutrition.calories < 400) score += 2
    else if (nutrition.calories < 600) score += 1
    
    if (nutrition.fiber >= 5) score += 2
    else if (nutrition.fiber >= 3) score += 1
    
    if (nutrition.sodium < 500) score += 2
    else if (nutrition.sodium < 800) score += 1
    
    if (nutrition.saturatedFat < 5) score += 2
    else if (nutrition.saturatedFat < 10) score += 1
    
    if (score >= 7) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 5) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 3) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Avg. Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(items.reduce((sum, item) => sum + item.nutrition.calories, 0) / items.length)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              High Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {items.filter(item => item.nutrition.protein >= 20).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Apple className="h-5 w-5 mr-2" />
              Healthy Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => getNutritionGrade(item.nutrition).grade === 'A').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Droplets className="h-5 w-5 mr-2" />
              Vegan Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.dietaryFlags.includes('Vegan')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((item) => {
          const grade = getNutritionGrade(item.nutrition)
          
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${grade.bg} ${grade.color}`}>
                      Grade {grade.grade}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed</TabsTrigger>
                    <TabsTrigger value="ingredients">Breakdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{item.nutrition.calories}</div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{item.nutrition.protein}g</div>
                        <div className="text-sm text-gray-600">Protein</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{item.nutrition.carbs}g</div>
                        <div className="text-sm text-gray-600">Carbs</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{item.nutrition.fat}g</div>
                        <div className="text-sm text-gray-600">Fat</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Dietary Flags</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.dietaryFlags.map((flag) => (
                            <Badge key={flag} className={getDietaryColor(flag)}>
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Allergens</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.allergens.map((allergen) => (
                            <Badge key={allergen} className={getAllergenColor(allergen)}>
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {item.certifications.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Certifications</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.certifications.map((cert) => (
                              <Badge key={cert} variant="outline">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="detailed" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Fiber:</span>
                        <span className="font-medium">{item.nutrition.fiber}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sugar:</span>
                        <span className="font-medium">{item.nutrition.sugar}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sodium:</span>
                        <span className="font-medium">{item.nutrition.sodium}mg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cholesterol:</span>
                        <span className="font-medium">{item.nutrition.cholesterol}mg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturated Fat:</span>
                        <span className="font-medium">{item.nutrition.saturatedFat}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trans Fat:</span>
                        <span className="font-medium">{item.nutrition.transFat}g</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ingredients" className="space-y-3">
                    {item.ingredientNutrition.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-gray-600">
                          {ingredient.calories} cal • {ingredient.protein}g protein
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}