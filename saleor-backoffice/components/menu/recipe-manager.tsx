'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecipeForm } from './recipe-form'
import { RecipeCard } from './recipe-card'

const sampleRecipes = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    prepTime: 15,
    cookTime: 10,
    servings: 1,
    category: 'Main Course',
    difficulty: 'Easy',
    ingredients: [
      { name: 'Beef Patty', quantity: '1', unit: 'piece', cost: 3.50 },
      { name: 'Burger Bun', quantity: '1', unit: 'piece', cost: 0.75 },
      { name: 'Lettuce', quantity: '2', unit: 'leaves', cost: 0.25 },
      { name: 'Tomato', quantity: '2', unit: 'slices', cost: 0.50 },
      { name: 'Special Sauce', quantity: '1', unit: 'tbsp', cost: 0.15 },
    ],
    instructions: [
      'Season the beef patty with salt and pepper',
      'Grill the patty for 4-5 minutes on each side',
      'Toast the burger bun halves',
      'Assemble with lettuce, tomato, patty, and sauce',
    ],
    nutritionalInfo: {
      calories: 520,
      protein: 28,
      carbs: 35,
      fat: 28,
      fiber: 3,
    },
    image: '/placeholder-burger.jpg',
    isActive: true,
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Traditional pizza with fresh mozzarella, basil, and tomato',
    prepTime: 20,
    cookTime: 12,
    servings: 4,
    category: 'Main Course',
    difficulty: 'Medium',
    ingredients: [
      { name: 'Pizza Dough', quantity: '1', unit: 'piece', cost: 2.00 },
      { name: 'Tomato Sauce', quantity: '1/2', unit: 'cup', cost: 1.25 },
      { name: 'Fresh Mozzarella', quantity: '200', unit: 'g', cost: 4.50 },
      { name: 'Fresh Basil', quantity: '10', unit: 'leaves', cost: 0.75 },
      { name: 'Olive Oil', quantity: '1', unit: 'tbsp', cost: 0.25 },
    ],
    instructions: [
      'Preheat oven to 475°F (245°C)',
      'Roll out pizza dough on floured surface',
      'Spread tomato sauce evenly',
      'Add mozzarella and basil',
      'Drizzle with olive oil',
      'Bake for 10-12 minutes until crust is golden',
    ],
    nutritionalInfo: {
      calories: 285,
      protein: 12,
      carbs: 36,
      fat: 11,
      fiber: 2,
    },
    image: '/placeholder-pizza.jpg',
    isActive: true,
  },
]

export function RecipeManager() {
  const [recipes, setRecipes] = useState(sampleRecipes)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddRecipe = () => {
    setEditingRecipe(null)
    setShowForm(true)
  }

  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe)
    setShowForm(true)
  }

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id))
  }

  const handleSaveRecipe = (recipeData: any) => {
    if (editingRecipe) {
      setRecipes(recipes.map(recipe => 
        recipe.id === editingRecipe.id ? { ...recipe, ...recipeData } : recipe
      ))
    } else {
      const newRecipe = {
        id: Date.now().toString(),
        ...recipeData,
        isActive: true,
      }
      setRecipes([...recipes, newRecipe])
    }
    setShowForm(false)
    setEditingRecipe(null)
  }

  if (showForm) {
    return (
      <RecipeForm
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
        onCancel={() => {
          setShowForm(false)
          setEditingRecipe(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes..."
              className="pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAddRecipe} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Recipe</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={() => handleEditRecipe(recipe)}
            onDelete={() => handleDeleteRecipe(recipe.id)}
          />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No recipes found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  )
}