'use client'

import { Clock, Users, Edit, Trash2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RecipeCardProps {
  recipe: {
    id: string
    name: string
    description: string
    prepTime: number
    cookTime: number
    servings: number
    category: string
    difficulty: string
    ingredients: Array<{
      name: string
      quantity: string
      unit: string
      cost: number
    }>
    isActive: boolean
    image?: string
  }
  onEdit: () => void
  onDelete: () => void
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const totalCost = recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0)
  const costPerServing = totalCost / recipe.servings

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 flex items-center justify-center">
        {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-sm">No image</div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {recipe.prepTime + recipe.cookTime} min
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {recipe.servings} servings
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            ${costPerServing.toFixed(2)}/serving
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Badge variant="secondary">{recipe.category}</Badge>
            <Badge variant="outline">{recipe.difficulty}</Badge>
          </div>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full ${recipe.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="ml-2 text-sm text-gray-600">
              {recipe.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Ingredients:</span>{' '}
            {recipe.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
            {recipe.ingredients.length > 3 && ` +${recipe.ingredients.length - 3} more`}
          </p>
        </div>
      </div>
    </div>
  )
}