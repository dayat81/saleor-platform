'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerProfiles } from './customer-profiles'
import { OrderPatterns } from './order-patterns'
import { LoyaltyProgram } from './loyalty-program'
import { CustomerSegmentation } from './customer-segmentation'
import { CommunicationPreferences } from './communication-preferences'

export function CustomerTabs() {
  return (
    <Tabs defaultValue="profiles" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
        <TabsTrigger value="patterns">Order Patterns</TabsTrigger>
        <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
        <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
        <TabsTrigger value="communication">Communication</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profiles" className="space-y-4">
        <CustomerProfiles />
      </TabsContent>
      
      <TabsContent value="patterns" className="space-y-4">
        <OrderPatterns />
      </TabsContent>
      
      <TabsContent value="loyalty" className="space-y-4">
        <LoyaltyProgram />
      </TabsContent>
      
      <TabsContent value="segmentation" className="space-y-4">
        <CustomerSegmentation />
      </TabsContent>
      
      <TabsContent value="communication" className="space-y-4">
        <CommunicationPreferences />
      </TabsContent>
    </Tabs>
  )
}