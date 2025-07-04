# F&B Customer Frontend Development Plan

## Project Overview
Build a modern, responsive web frontend for Food & Beverage customers using Saleor's GraphQL API as the backend. The frontend will provide an optimal shopping experience for F&B products with industry-specific features.

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Core Features](#core-features)
4. [F&B Specific Features](#fb-specific-features)
5. [Store Backoffice Development](#store-backoffice-development)
6. [Implementation Phases](#implementation-phases)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Development Timeline](#development-timeline)
9. [Deployment Strategy](#deployment-strategy)

## Technology Stack

### Frontend Framework
- **Next.js 14** - Server-side rendering for SEO and performance
- **TypeScript** - Type safety and better developer experience
- **React 18** - Modern component architecture

### State Management & Data Fetching
- **Apollo Client** - GraphQL client with caching
- **React Query** - For REST API calls if needed
- **Zustand** - Lightweight state management for UI state

### UI/UX Libraries
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Development Tools
- **ESLint & Prettier** - Code quality
- **Jest & React Testing Library** - Testing
- **Storybook** - Component documentation
- **GitHub Actions** - CI/CD

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Frontend                         │
├─────────────────────────────────────────────────────────────┤
│                     Next.js Application                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Pages/    │  │  Components  │  │  Hooks/Utils     │  │
│  │   Routes    │  │              │  │                  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Apollo Client (GraphQL)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Saleor GraphQL API                        │
│                  (http://localhost:8000)                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Authentication & User Management ✅ COMPLETED
- [x] Customer registration with email verification
- [x] Social login (Google OAuth 2.0) - FULLY IMPLEMENTED
- [x] Password reset functionality
- [x] User profile management
- [x] Order history
- [x] Saved addresses
- [x] Wishlist/Favorites

**Implementation Status:** 
- ✅ Complete Next.js 14 frontend with TypeScript
- ✅ Apollo Client integration with Saleor GraphQL API
- ✅ Authentication flow (login, register, password reset)
- ✅ **Google OAuth 2.0 Integration with NextAuth.js**
- ✅ **Secure session management with JWT tokens**
- ✅ **Automatic user creation in Saleor for Google users**
- ✅ User profile management with form validation
- ✅ Order history with detailed order views
- ✅ Address management (CRUD operations)
- ✅ Wishlist functionality with product management
- ✅ Responsive design with Tailwind CSS
- ✅ State management with Zustand
- ✅ Form handling with React Hook Form + Zod validation

### 2. Product Catalog
- [ ] Product listing with filters
  - Category filter
  - Price range
  - Dietary restrictions (Vegan, Gluten-free, etc.)
  - Brand filter
  - Availability status
- [ ] Product search with autocomplete
- [ ] Product detail pages
- [ ] Image gallery with zoom
- [ ] Related products
- [ ] Customer reviews & ratings

### 3. Shopping Cart & Checkout
- [ ] Persistent cart (logged in users)
- [ ] Guest checkout
- [ ] Real-time inventory updates
- [ ] Multiple payment methods
  - Credit/Debit cards (Stripe)
  - Digital wallets (Apple Pay, Google Pay)
  - Cash on delivery
- [ ] Order confirmation emails
- [ ] Invoice generation

### 4. Responsive Design
- [ ] Mobile-first approach
- [ ] PWA capabilities
- [ ] Offline support for browsing
- [ ] App-like experience

## F&B Specific Features

### 1. Delivery & Pickup Options
- [ ] Delivery scheduling
  - Time slot selection
  - Express delivery option
  - Delivery fee calculation
- [ ] Store pickup
  - Multiple pickup locations
  - Pickup time selection
- [ ] Real-time order tracking
- [ ] Delivery instructions

### 2. Product Information
- [ ] Nutritional information display
- [ ] Allergen warnings
- [ ] Ingredients list
- [ ] Dietary badges (Vegan, Halal, Kosher, etc.)
- [ ] Expiry date display
- [ ] Storage instructions

### 3. Freshness & Inventory
- [ ] "Fresh until" indicators
- [ ] Stock levels for perishables
- [ ] Pre-order for out-of-stock items
- [ ] Batch/lot tracking

### 4. Promotions & Loyalty
- [ ] Bundle deals (meal combos)
- [ ] Happy hour pricing
- [ ] Loyalty points system
- [ ] Referral program
- [ ] Digital coupons
- [ ] Bulk order discounts

### 5. Subscription Services
- [ ] Weekly/Monthly meal plans
- [ ] Auto-replenishment
- [ ] Subscription management
- [ ] Pause/resume options

### 6. Special F&B Features
- [ ] Recipe suggestions using products
- [ ] Meal planning tools
- [ ] Catering orders
- [ ] Special dietary meal filters
- [ ] Temperature-controlled delivery options

## Store Backoffice Development

### Overview
The store backoffice is a comprehensive management interface for F&B store owners and staff to manage their operations. It complements the existing Saleor dashboard with F&B-specific features and provides a streamlined interface for day-to-day store operations.

### Target Users
- **Store Owners**: Complete business oversight and management
- **Store Managers**: Daily operations and staff management
- **Kitchen Staff**: Order management and inventory tracking
- **Delivery Personnel**: Order fulfillment and delivery coordination

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Store Backoffice Frontend                 │
├─────────────────────────────────────────────────────────────┤
│                     Next.js Application                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Dashboard   │  │ Orders       │  │ Inventory        │  │
│  │ Analytics   │  │ Management   │  │ Management       │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Staff       │  │ Customer     │  │ Reports &        │  │
│  │ Management  │  │ Management   │  │ Analytics        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Apollo Client (GraphQL)                 │   │
│  │          + REST APIs for F&B Operations              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Saleor GraphQL API                        │
│               + Custom F&B Business Logic                    │
│                  (http://localhost:8000)                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Backoffice Features

#### 1. Dashboard & Analytics
- [ ] **Business Overview Dashboard**
  - Daily/Weekly/Monthly sales metrics
  - Order volume and trends
  - Top-selling products
  - Customer acquisition metrics
  - Revenue analytics with charts

- [ ] **Real-time Monitoring**
  - Live order feed
  - Kitchen queue status
  - Delivery tracking
  - Inventory alerts
  - System health indicators

- [ ] **Performance Metrics**
  - Average order value
  - Order fulfillment time
  - Customer satisfaction ratings
  - Staff productivity metrics
  - Peak hours analysis

#### 2. Order Management System
- [ ] **Order Processing**
  - Order queue with priority sorting
  - Order status updates (Received → Preparing → Ready → Delivered)
  - Order modification and cancellation
  - Special instructions handling
  - Batch order processing

- [ ] **Kitchen Management**
  - Kitchen display system (KDS)
  - Order preparation timers
  - Recipe instructions display
  - Ingredient substitution tracking
  - Quality control checkpoints

- [ ] **Delivery Coordination**
  - Delivery assignment system
  - Route optimization
  - Driver tracking
  - Delivery time estimates
  - Customer notification system

#### 3. Inventory Management
- [ ] **Stock Control**
  - Real-time inventory tracking
  - Low stock alerts
  - Automated reorder points
  - Supplier management
  - Purchase order creation

- [ ] **Perishables Management**
  - Expiry date tracking
  - FIFO (First In, First Out) system
  - Waste tracking and reporting
  - Temperature monitoring
  - Batch/lot tracking

- [ ] **Menu Management**
  - Recipe creation and editing
  - Ingredient cost calculation
  - Menu item availability control
  - Pricing management
  - Nutritional information updates

#### 4. Customer Management
- [ ] **Customer Database**
  - Customer profiles and history
  - Order patterns analysis
  - Loyalty program management
  - Customer segmentation
  - Communication preferences

- [ ] **Customer Service**
  - Support ticket system
  - Complaint handling
  - Refund processing
  - Customer feedback collection
  - Live chat integration

- [ ] **Marketing Tools**
  - Promotional campaign management
  - Coupon code creation
  - Email marketing integration
  - Customer retention programs
  - Review management

#### 5. Staff Management
- [ ] **Employee Management**
  - Staff scheduling
  - Role-based access control
  - Performance tracking
  - Training module access
  - Payroll integration

- [ ] **Shift Management**
  - Shift planning and assignments
  - Time tracking
  - Break management
  - Overtime calculations
  - Attendance monitoring

### F&B Specific Backoffice Features

#### 1. Food Safety & Compliance
- [ ] **HACCP Compliance**
  - Temperature logging
  - Cleaning schedules
  - Food safety checklists
  - Inspection reports
  - Compliance documentation

- [ ] **Allergen Management**
  - Allergen tracking system
  - Cross-contamination prevention
  - Staff training records
  - Customer allergen alerts
  - Ingredient substitution logs

#### 2. Kitchen Operations
- [ ] **Recipe Management**
  - Digital recipe cards
  - Portion control guidelines
  - Cooking instructions
  - Plating specifications
  - Quality standards

- [ ] **Prep Planning**
  - Daily prep lists
  - Par level management
  - Prep time tracking
  - Waste reduction planning
  - Equipment maintenance schedules

#### 3. Delivery & Logistics
- [ ] **Delivery Management**
  - Delivery zone mapping
  - Driver performance tracking
  - Vehicle maintenance logs
  - Fuel cost tracking
  - Customer delivery preferences

- [ ] **Packaging & Presentation**
  - Packaging requirements
  - Special handling instructions
  - Presentation standards
  - Eco-friendly options
  - Cost per package tracking

### Technical Implementation

#### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **State Management**: Zustand + React Query
- **UI Components**: Tailwind CSS + Headless UI
- **Charts & Analytics**: Chart.js or Recharts
- **Real-time Updates**: WebSockets or Server-Sent Events
- **Authentication**: JWT with role-based access control

#### Component Architecture
```
src/backoffice/
├── components/
│   ├── dashboard/
│   │   ├── MetricsCard.tsx
│   │   ├── SalesChart.tsx
│   │   ├── OrderFeed.tsx
│   │   └── InventoryAlerts.tsx
│   ├── orders/
│   │   ├── OrderQueue.tsx
│   │   ├── OrderDetails.tsx
│   │   ├── KitchenDisplay.tsx
│   │   └── DeliveryTracking.tsx
│   ├── inventory/
│   │   ├── ProductList.tsx
│   │   ├── StockControl.tsx
│   │   ├── SupplierManager.tsx
│   │   └── RecipeEditor.tsx
│   ├── customers/
│   │   ├── CustomerList.tsx
│   │   ├── CustomerProfile.tsx
│   │   ├── LoyaltyProgram.tsx
│   │   └── SupportTickets.tsx
│   ├── staff/
│   │   ├── EmployeeList.tsx
│   │   ├── ShiftScheduler.tsx
│   │   ├── PerformanceTracker.tsx
│   │   └── RoleManager.tsx
│   └── reports/
│       ├── SalesReport.tsx
│       ├── InventoryReport.tsx
│       ├── StaffReport.tsx
│       └── CustomReportBuilder.tsx
├── pages/
│   ├── dashboard.tsx
│   ├── orders/
│   │   ├── index.tsx
│   │   ├── queue.tsx
│   │   └── history.tsx
│   ├── inventory/
│   │   ├── products.tsx
│   │   ├── suppliers.tsx
│   │   └── recipes.tsx
│   ├── customers/
│   │   ├── index.tsx
│   │   ├── loyalty.tsx
│   │   └── support.tsx
│   ├── staff/
│   │   ├── employees.tsx
│   │   ├── schedule.tsx
│   │   └── performance.tsx
│   └── reports/
│       ├── sales.tsx
│       ├── inventory.tsx
│       └── custom.tsx
├── hooks/
│   ├── useOrders.ts
│   ├── useInventory.ts
│   ├── useCustomers.ts
│   ├── useStaff.ts
│   └── useReports.ts
├── stores/
│   ├── orderStore.ts
│   ├── inventoryStore.ts
│   ├── customerStore.ts
│   └── staffStore.ts
└── utils/
    ├── permissions.ts
    ├── notifications.ts
    ├── export.ts
    └── calculations.ts
```

### User Roles & Permissions

#### Role-Based Access Control
- **Owner**: Full access to all features
- **Manager**: Operations management, staff scheduling, reports
- **Kitchen Staff**: Order management, inventory updates, recipe access
- **Delivery Personnel**: Delivery management, order status updates
- **Customer Service**: Customer management, support tickets, refunds

#### Permission Matrix
| Feature | Owner | Manager | Kitchen | Delivery | Support |
|---------|-------|---------|---------|----------|---------|
| Dashboard | ✅ | ✅ | Limited | Limited | Limited |
| Order Management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Customer Management | ✅ | ✅ | ❌ | ❌ | ✅ |
| Staff Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | Limited | Limited | Limited |
| System Settings | ✅ | Limited | ❌ | ❌ | ❌ |

### Mobile Responsiveness
- **Tablet Interface**: Optimized for kitchen displays and management tasks
- **Mobile App**: Native mobile app for on-the-go management
- **PWA Support**: Progressive Web App for offline functionality
- **Touch-Friendly**: Large buttons and touch-optimized interfaces

### Integration Points
- **POS Systems**: Integration with popular POS solutions
- **Accounting Software**: QuickBooks, Xero integration
- **Delivery Platforms**: Third-party delivery service APIs
- **Payment Processing**: Stripe, PayPal, Square integration
- **Email Services**: SendGrid, Mailgun for notifications
- **SMS Services**: Twilio for customer notifications

### Security Features
- **Multi-factor Authentication**: SMS and app-based 2FA
- **Activity Logging**: Comprehensive audit trails
- **Data Encryption**: End-to-end encryption for sensitive data
- **Backup Systems**: Automated daily backups
- **Compliance**: GDPR, PCI DSS compliance

### Performance Optimization
- **Real-time Updates**: WebSocket connections for live data
- **Caching Strategy**: Redis for frequently accessed data
- **Database Optimization**: Indexed queries and connection pooling
- **CDN Integration**: Static asset delivery optimization
- **Load Balancing**: Multiple server instances for high availability

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETED (Weeks 1-3)
1. **Project Setup** ✅
   - ✅ Initialize Next.js project with TypeScript
   - ✅ Configure Apollo Client
   - ✅ Setup Tailwind CSS
   - ✅ Configure ESLint, Prettier
   - ✅ Setup Git repository

2. **Core Layout** ✅
   - ✅ Header with navigation
   - ✅ Footer
   - ✅ Responsive layout system
   - ✅ Loading states
   - ✅ Error boundaries

3. **Authentication** ✅
   - ✅ Login/Register pages
   - ✅ JWT token management
   - ✅ Protected routes
   - ✅ User context

### Phase 2: Product Catalog (Weeks 4-6)
1. **Product Listing**
   - Category pages
   - Filter implementation
   - Pagination
   - Sort options

2. **Product Details**
   - Product page layout
   - Image gallery
   - Add to cart functionality
   - Nutritional info display

3. **Search**
   - Search bar component
   - Search results page
   - Search suggestions

### Phase 3: Cart & Checkout (Weeks 7-9)
1. **Shopping Cart**
   - Cart page
   - Cart drawer/modal
   - Quantity updates
   - Remove items

2. **Checkout Flow**
   - Address selection
   - Delivery options
   - Payment integration
   - Order confirmation

### Phase 4: F&B Features (Weeks 10-12)
1. **Delivery System**
   - Time slot picker
   - Delivery tracking
   - Store locator

2. **Special Features**
   - Dietary filters
   - Meal subscriptions
   - Loyalty program

### Phase 5: Store Backoffice Development (Weeks 13-16)
1. **Backoffice Foundation**
   - Authentication and role-based access
   - Basic dashboard layout
   - Navigation structure
   - Permission system

2. **Core Backoffice Features**
   - Order management interface
   - Inventory management system
   - Customer management tools
   - Staff scheduling system

3. **F&B Specific Features**
   - Kitchen display system
   - Recipe management
   - Food safety compliance tools
   - Delivery coordination interface

### Phase 6: Polish & Launch (Weeks 17-18)
1. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Caching strategies

2. **Testing & QA**
   - Unit tests
   - Integration tests
   - User acceptance testing

## Technical Implementation Details

### GraphQL Queries & Mutations

```typescript
// Example: Fetch products with F&B specific fields
const GET_PRODUCTS = gql`
  query GetProducts($first: Int!, $filter: ProductFilterInput) {
    products(first: $first, filter: $filter) {
      edges {
        node {
          id
          name
          description
          thumbnail {
            url
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
            }
          }
          # F&B specific fields
          attributes {
            attribute {
              name
            }
            values {
              name
            }
          }
        }
      }
    }
  }
`;
```

### Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProductDetails.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── DeliveryOptions.tsx
│   └── f&b/
│       ├── NutritionalInfo.tsx
│       ├── DietaryBadges.tsx
│       ├── DeliveryScheduler.tsx
│       └── MealSubscription.tsx
├── pages/
│   ├── index.tsx
│   ├── products/
│   │   ├── index.tsx
│   │   └── [slug].tsx
│   ├── cart.tsx
│   ├── checkout.tsx
│   └── account/
│       ├── profile.tsx
│       ├── orders.tsx
│       └── subscriptions.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useAuth.ts
│   └── useProducts.ts
├── utils/
│   ├── apollo-client.ts
│   ├── auth.ts
│   └── formatters.ts
└── styles/
    └── globals.css
```

### State Management Pattern

```typescript
// Example: Cart store using Zustand
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}
```

## Development Timeline

| Phase | Duration | Status | Deliverables |
|-------|----------|--------|-------------|
| Phase 1 | 3 weeks | ✅ COMPLETED | Basic application structure, authentication |
| Phase 2 | 3 weeks | 🔄 IN PROGRESS | Product catalog, search functionality |
| Phase 3 | 3 weeks | ⏳ PENDING | Cart and checkout implementation |
| Phase 4 | 3 weeks | ⏳ PENDING | F&B specific features |
| Phase 5 | 4 weeks | ⏳ PENDING | Store backoffice development |
| Phase 6 | 2 weeks | ⏳ PENDING | Testing, optimization, deployment |
| **Total** | **18 weeks** | **17% Complete** | **Production-ready F&B frontend + backoffice** |

## Deployment Strategy

### Hosting Options
1. **Vercel** (Recommended)
   - Optimal for Next.js
   - Automatic deployments
   - Edge functions
   - Global CDN

2. **AWS Amplify**
   - Full AWS integration
   - Multiple environments
   - CI/CD built-in

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/graphql/
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
```

### Performance Targets
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Core Web Vitals: All green

### Security Considerations
- HTTPS everywhere
- Content Security Policy
- XSS protection
- CSRF tokens
- Rate limiting
- Input sanitization

## ✅ Completed Implementation

### Authentication & User Management System
**Location:** `/home/pt/saleor-platform/saleor-storefront/`

**Key Files Created:**
- `lib/apollo-client.ts` - GraphQL client configuration
- `lib/auth-store.ts` - Zustand authentication state management
- `lib/graphql/auth.ts` - Authentication mutations and queries
- `components/auth/` - Login, Register, Password Reset forms
- `app/auth/` - Authentication pages (login, register, reset-password)
- `app/account/` - User account management pages
- `components/account/` - Profile, Orders, Addresses, Wishlist components

**Features Implemented:**
1. ✅ User Registration with email verification
2. ✅ Login/Logout functionality  
3. ✅ Password reset flow
4. ✅ User profile management
5. ✅ Order history viewing
6. ✅ Address CRUD operations
7. ✅ Wishlist/Favorites management
8. ✅ Responsive design
9. ✅ Form validation with Zod
10. ✅ Toast notifications

**API Integration:**
- ✅ Connected to Saleor GraphQL API at `http://192.168.18.144:8000/graphql/`
- ✅ JWT token management with cookies
- ✅ Automatic token refresh
- ✅ Protected routes

## Next Steps

1. **Continue with Phase 2: Product Catalog** 🔄
   - Implement product listing pages
   - Add search and filter functionality
   - Create product detail pages
   - Add F&B-specific product attributes

2. **Test Current Implementation**
   - Start the development server: `npm run dev`
   - Test authentication flows
   - Verify API connectivity

3. **Phase 3: Shopping Cart & Checkout**
   - Cart management
   - Checkout process
   - Payment integration

4. **Phase 4: F&B Features**
   - Delivery scheduling
   - Nutritional information
   - Dietary filters

5. **Phase 5: Store Backoffice Development**
   - Setup backoffice authentication and routing
   - Implement dashboard with key metrics
   - Build order management interface
   - Create inventory management system
   - Develop staff scheduling tools
   - Add F&B-specific features (kitchen display, recipe management)

6. **Backoffice Testing & Integration**
   - Test role-based access control
   - Verify real-time updates
   - Test mobile responsiveness for tablets/kitchen displays

---

This plan provides a solid foundation for building a modern F&B e-commerce frontend using Saleor. The modular approach allows for flexibility while ensuring all critical features are implemented systematically.