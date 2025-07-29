# Saleor Platform Repository Analysis

## Project Overview

This repository contains a complete Saleor e-commerce platform implementation with additional custom services for a food & beverage business. The platform is designed for deployment on Google Cloud Platform (GCP).

### Core Components

1. **Standard Saleor Services**:
   - Core GraphQL API (`/`)
   - Dashboard (`/saleor-dashboard`)
   - PostgreSQL database
   - Redis cache
   - Mailpit for email testing
   - Jaeger for distributed tracing

2. **Custom Services**:
   - **Storefront** (`/saleor-storefront`): A Next.js-based customer-facing e-commerce site
   - **Backoffice** (`/saleor-backoffice`): A Next.js-based administrative interface for managing the business
   - **Chat Service** (`/saleor-chat-service`): An AI-powered chat service using Google's Gemini API to assist customers with food ordering and backoffice tasks

### Key Features

1. **AI-Powered Chat Service**:
   - Dual-purpose chatbot for both customer service (storefront) and administrative tasks (backoffice)
   - Supports both English and Indonesian languages
   - Integrates with Gemini AI for natural conversation
   - Communicates with Saleor backend via GraphQL
   - Uses Redis for session and message storage
   - Supports actions like product search, cart management, order processing, and order status checking

2. **Multi-Environment Deployment**:
   - Local Docker Compose setup for development
   - Kubernetes configurations for development and production
   - Full GCP deployment scripts for production

3. **Infrastructure as Code**:
   - Terraform configurations for GCP infrastructure provisioning
   - Includes Cloud SQL (PostgreSQL), Redis, VPC networks, storage buckets, and Secret Manager

4. **Modern Tech Stack**:
   - Next.js for frontend applications
   - TypeScript for type safety
   - Express.js for the chat service
   - GraphQL for API communication
   - Redis for caching and session management
   - Docker for containerization

### Deployment Architecture

The deployment is designed for GCP with the following components:
- Cloud Run for containerized services (API, Dashboard, Storefront, Backoffice, Chat Service)
- Cloud SQL for PostgreSQL database
- Cloud Memorystore (Redis) for caching
- Cloud Storage for media and static files
- Secret Manager for sensitive configuration
- VPC networking for secure service communication

### Custom Functionality

The chat service is particularly noteworthy as it:
1. Provides different conversation flows for storefront (customer service) and backoffice (administrative tasks)
2. Understands both English and Indonesian languages
3. Can perform actions like searching products, managing carts, processing orders, and checking order status
4. Integrates with Saleor's GraphQL API for all e-commerce operations
5. Maintains conversation context and user preferences using Redis

## Repository Structure Summary

- Root directory contains standard Saleor platform Docker Compose setup
- `/saleor-storefront` - Customer-facing e-commerce application
- `/saleor-backoffice` - Administrative interface
- `/saleor-chat-service` - AI-powered chat service with Gemini integration
- `/k8s` - Kubernetes deployment configurations
- `/terraform` - Infrastructure as code for GCP deployment
- Various deployment and setup scripts in the root and `/scripts` directories

This is a comprehensive, production-ready implementation of an e-commerce platform tailored for the food & beverage industry, with AI-powered chat capabilities for both customers and administrators.