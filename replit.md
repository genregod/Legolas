# ArnieAI - AI-Powered Legal Document Processing Platform

## Overview

ArnieAI is a comprehensive legal AI platform designed to democratize access to legal services through advanced AI-powered document processing and case management. The platform integrates GPT-4 technology for sophisticated legal reasoning, document analysis, and automated legal document generation. Built following Azure cloud architecture principles, the system provides enterprise-grade OCR, semantic search, and retrieval-augmented generation (RAG) capabilities for accurate legal analysis.

## Recent Changes (January 13, 2025)

### Document Generation System
- Implemented AI-powered document generator with real-time progress tracking
- Added WebSocket support for live generation updates
- Created canvas-like interface with sliding chat panel
- Integrated state/federal jurisdiction formatting detection
- Added export functionality for PDF/DOCX formats
- Dark mode support in document generator

### API Integration
- Successfully integrated OpenAI API for document generation
- Added GPT-4o model support (newest model as of May 13, 2024)
- Implemented jurisdiction-specific formatting rules

### Document Processing Enhancements
- **MAJOR UPDATE**: Wildcard file type support - accepts ANY file type
- Integrated OpenAI Vision API for image processing (phone photos, scanned docs)
- Removed file type restrictions - processes PDF, DOC, TXT, RTF, images, etc.
- Increased file size limit to 50MB to accommodate images
- Field name agnostic - accepts files with any form field name
- AI Vision extracts ALL text without skipping any details
- Enhanced document processor to handle images and PDFs
- Implemented comprehensive text extraction pipeline

### Semantic Search & Legal Research
- Created semantic search service with OpenAI embeddings
- Implemented intelligent document retrieval across cases
- Added legal research service for case strategy and defense recommendations
- Integrated search functionality with interactive UI dialog

### API Endpoints Added
- `/api/search` - Semantic search across all case content
- `/api/cases/:id/similar` - Find similar cases using AI
- `/api/legal-research` - Research legal topics with AI
- `/api/cases/:id/defense-recommendations` - AI-powered defense suggestions
- `/api/cases/:id/strategy` - Comprehensive case strategy generation
- `/api/procedural-requirements` - Jurisdiction-specific filing requirements

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **Authentication**: Replit Auth integration with session-based authentication

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL session store
- **File Handling**: Multer for file uploads with validation
- **Payment Processing**: Stripe integration for subscription management
- **Database**: PostgreSQL with Drizzle ORM

## Key Components

### Authentication System
- **Implementation**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **User Management**: Mandatory user and session tables for Replit Auth compliance
- **Authorization**: Route-level protection with authentication middleware

### Database Schema
- **Users**: Core user information with Stripe integration fields
- **Cases**: Legal case management with metadata
- **Documents**: File storage and processing tracking
- **Allegations**: Case-specific allegations with response tracking
- **Affirmative Defenses**: Legal defense strategies
- **Case Timeline**: Event tracking for case progress
- **Sessions**: Required for Replit Auth session management

### File Processing
- **Upload**: Multer-based file upload with type validation (PDF, DOC, DOCX)
- **Storage**: Local file system storage with 10MB size limit
- **Processing**: AI-powered document analysis and case creation
- **Validation**: File type restrictions and size limits

### Payment Integration
- **Provider**: Stripe for subscription management
- **Features**: Customer creation, subscription management, payment processing
- **UI**: Stripe Elements for payment forms
- **Webhooks**: Payment status updates and subscription management

## Data Flow

1. **User Authentication**: Users authenticate through Replit Auth
2. **Document Upload**: Files are uploaded and validated
3. **AI Processing**: Documents are processed to extract legal information
4. **Case Creation**: Processed data creates structured case records
5. **Case Management**: Users can manage allegations, defenses, and responses
6. **Document Generation**: AI generates legal response documents
7. **Filing Instructions**: Platform provides court filing guidance

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries and migrations
- **@stripe/stripe-js**: Payment processing
- **@radix-ui/***: UI component primitives
- **@tanstack/react-query**: Server state management

### Authentication
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **tsx**: TypeScript execution
- **vite**: Build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development
- **Server**: tsx for TypeScript execution
- **Client**: Vite development server with HMR
- **Database**: Drizzle migrations with push command
- **Environment**: NODE_ENV=development

### Production
- **Build Process**: 
  1. Vite builds client-side assets
  2. esbuild bundles server code
  3. Output stored in dist/ directory
- **Server**: Node.js execution of bundled server code
- **Static Assets**: Served from dist/public
- **Database**: PostgreSQL with connection pooling

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **STRIPE_SECRET_KEY**: Stripe API key
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Replit authentication domains
- **ISSUER_URL**: OpenID Connect issuer URL

### File Structure
- **client/**: React frontend application
- **server/**: Express.js backend API
- **shared/**: Shared TypeScript types and schema
- **migrations/**: Database migration files
- **dist/**: Production build output

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment workflows.