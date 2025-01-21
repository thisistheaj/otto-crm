# AutoCRM Project Description

## Overview
AutoCRM is an AI-enhanced customer relationship management system built with React/Remix and Supabase, designed for small to medium businesses. It leverages LangChain for AI capabilities, focusing on reducing manual support workload through intelligent automation.

## Core Features
- Multi-workspace support with role-based access control
- AI-powered ticket management and routing
- Knowledge base management with RAG capabilities
- Real-time chat integration
- Customer self-service portal

## Technical Stack

### Frontend
- React 18+ with TypeScript
- Remix for server-side rendering and API routes
- TailwindCSS for styling
- Supabase Client for real-time features

### Backend & Infrastructure
- Remix API routes for server-side logic
- Supabase for:
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Vector store (pgvector) for RAG implementation
- AWS Amplify for:
  - Hosting and deployment
  - CI/CD pipeline
  - File storage (S3)
  - Lambda functions (if needed)

### AI & Search
- LangChain for AI orchestration
- Supabase pgvector for embeddings storage
- OpenAI API for:
  - GPT-4 for response generation
  - Ada-2 for embeddings

## Architecture Overview

### Multi-tenant Design
- Workspace-based isolation
- Role-based access control (Admin/Agent)
- Supabase Row Level Security (RLS) policies

### Real-time Architecture
- Supabase Realtime for live updates
- WebSocket connections for chat
- Event-driven state management

### AI Integration
- RAG pipeline using Supabase pgvector
- Async job processing for long-running tasks
- Streaming responses for chat

### Deployment Architecture
- AWS Amplify for hosting and CI/CD
- Edge-optimized content delivery
- Automatic branch deployments
- Preview deployments for PRs

## Development Priorities
1. Core authentication and workspace management
2. Ticket management system
3. Knowledge base CRUD operations
4. AI integration for ticket routing and responses
5. Customer-facing portal
6. Real-time chat integration

## Performance Goals
- Initial page load < 2s
- Real-time updates < 100ms
- AI response generation < 3s
- Search results < 500ms
- Time to first byte < 200ms

## Infrastructure Considerations
- Supabase connection pooling
- Vector store optimization
- AWS Amplify build settings
- Asset optimization and caching
- Database indexing strategy

This document serves as the primary reference for development decisions and should be consulted when making architectural choices.