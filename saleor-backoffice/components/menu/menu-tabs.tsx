'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecipeManager } from './recipe-manager'
import { IngredientCostCalculator } from './ingredient-cost-calculator'
import { MenuAvailability } from './menu-availability'
import { PricingManager } from './pricing-manager'
import { NutritionalInfo } from './nutritional-info'

export function MenuTabs() {
  return (
    <Tabs defaultValue="recipes" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="recipes">Recipes</TabsTrigger>
        <TabsTrigger value="costs">Ingredient Costs</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
      </TabsList>
      
      <TabsContent value="recipes" className="space-y-4">
        <RecipeManager />
      </TabsContent>
      
      <TabsContent value="costs" className="space-y-4">
        <IngredientCostCalculator />
      </TabsContent>
      
      <TabsContent value="availability" className="space-y-4">
        <MenuAvailability />
      </TabsContent>
      
      <TabsContent value="pricing" className="space-y-4">
        <PricingManager />
      </TabsContent>
      
      <TabsContent value="nutrition" className="space-y-4">
        <NutritionalInfo />
      </TabsContent>
    </Tabs>
  )
}