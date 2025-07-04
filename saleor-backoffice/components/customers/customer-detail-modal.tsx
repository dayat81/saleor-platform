'use client'

import { X, Mail, Phone, MapPin, Calendar, Star, Gift, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CustomerDetailModalProps {
  customer: any
  onClose: () => void
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800'
      case 'Gold': return 'bg-yellow-100 text-yellow-800'
      case 'Silver': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={customer.avatar} />
              <AvatarFallback className="text-lg">
                {customer.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <p className="text-gray-600">{customer.id}</p>
              <div className="flex space-x-2 mt-2">
                <Badge className={getTierColor(customer.tier)}>
                  {customer.tier}
                </Badge>
                <Badge variant="outline">
                  {customer.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="loyalty">Loyalty & Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <div>{customer.address.street}</div>
                        <div>{customer.address.city}, {customer.address.state} {customer.address.zip}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Birthday: {customer.birthday}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Customer Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-medium">{customer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Spent:</span>
                      <span className="font-medium">${customer.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value:</span>
                      <span className="font-medium">${customer.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lifetime Value:</span>
                      <span className="font-medium text-green-600">${customer.lifetimeValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Frequency:</span>
                      <span className="font-medium">{customer.orderFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Join Date:</span>
                      <span className="font-medium">{customer.joinDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Order:</span>
                      <span className="font-medium">{customer.lastOrder}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Last 10 orders from this customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customer.orderHistory.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-gray-600">{order.date}</div>
                          <div className="text-sm text-gray-600">
                            Items: {order.items.join(', ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.amount.toFixed(2)}</div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dietary Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Allergies:</span>
                      <div className="mt-1 space-x-2">
                        {customer.allergies.length > 0 ? (
                          customer.allergies.map((allergy: string) => (
                            <Badge key={allergy} variant="destructive">{allergy}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Dietary Preferences:</span>
                      <div className="mt-1 space-x-2">
                        {customer.dietaryPreferences.length > 0 ? (
                          customer.dietaryPreferences.map((pref: string) => (
                            <Badge key={pref} variant="secondary">{pref}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Preferred Categories:</span>
                      <div className="mt-1 space-x-2">
                        {customer.preferredCategories.map((category: string) => (
                          <Badge key={category} variant="outline">{category}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Favorite Items:</span>
                      <div className="mt-1">
                        {customer.favoriteItems.join(', ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Email Notifications</span>
                      <Badge variant={customer.communicationPrefs.email ? "default" : "secondary"}>
                        {customer.communicationPrefs.email ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SMS Notifications</span>
                      <Badge variant={customer.communicationPrefs.sms ? "default" : "secondary"}>
                        {customer.communicationPrefs.sms ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Push Notifications</span>
                      <Badge variant={customer.communicationPrefs.push ? "default" : "secondary"}>
                        {customer.communicationPrefs.push ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gift className="h-5 w-5 mr-2" />
                      Loyalty Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Current Points:</span>
                      <span className="font-medium text-blue-600">{customer.loyaltyPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tier:</span>
                      <Badge className={getTierColor(customer.tier)}>{customer.tier}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Points earned from {customer.totalOrders} orders
                    </div>
                    <Button className="w-full">
                      Issue Reward
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      Reviews & Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customer.reviews.map((review: any, index: number) => (
                      <div key={index} className="border-b pb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${
                                  star <= review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}