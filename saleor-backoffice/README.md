# Saleor F&B Backoffice

A comprehensive Food & Beverage management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Menu Management
- **Recipe Creation & Editing**: Complete recipe management with ingredients, instructions, and nutritional information
- **Ingredient Cost Calculation**: Track ingredient costs, suppliers, and stock levels with real-time pricing updates
- **Menu Item Availability Control**: Manage item availability based on ingredient stock and scheduling
- **Pricing Management**: Dynamic pricing with competitor analysis and profit margin optimization
- **Nutritional Information**: Comprehensive nutrition tracking with dietary flags and allergen management

### Customer Management
- **Customer Profiles & History**: Detailed customer profiles with order history and preferences
- **Order Patterns Analysis**: Insights into customer ordering behavior and trends
- **Loyalty Program Management**: Multi-tier loyalty system with points and rewards
- **Customer Segmentation**: Advanced analytics for customer categorization
- **Communication Preferences**: Manage customer communication settings across channels

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React hooks with Zustand
- **GraphQL**: Apollo Client for Saleor integration
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running Saleor API instance

### Installation

1. Navigate to the backoffice directory:
```bash
cd saleor-backoffice
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variables:
```bash
export NEXT_PUBLIC_SALEOR_API_URL=http://localhost:8000/graphql/
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
saleor-backoffice/
├── app/                    # Next.js app router pages
│   ├── customers/         # Customer management pages
│   ├── menu/              # Menu management pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── customers/         # Customer-related components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   ├── menu/              # Menu management components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## Key Components

### Menu Management
- `RecipeManager`: CRUD operations for recipes
- `IngredientCostCalculator`: Cost tracking and supplier management
- `MenuAvailability`: Real-time availability control
- `PricingManager`: Dynamic pricing optimization
- `NutritionalInfo`: Nutrition and dietary information

### Customer Management
- `CustomerProfiles`: Comprehensive customer database
- `OrderPatterns`: Analytics and behavior insights
- `LoyaltyProgram`: Tier management and rewards
- `CustomerSegmentation`: Advanced customer analytics
- `CommunicationPreferences`: Multi-channel communication settings

## Integration with Saleor

The backoffice integrates with Saleor's GraphQL API to:
- Fetch product and customer data
- Manage inventory and pricing
- Process orders and payments
- Handle customer relationships

## Customization

The application is built with modularity in mind:
- UI components use Tailwind CSS for easy styling
- Radix UI provides accessible component primitives
- TypeScript ensures type safety
- Apollo Client handles GraphQL state management

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new components
3. Follow the established naming conventions
4. Write tests for new features
5. Update documentation as needed

## License

This project is part of the Saleor Platform ecosystem.