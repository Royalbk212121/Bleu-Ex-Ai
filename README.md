# Legal AI Platform

A comprehensive legal research and document analysis platform powered by AI, built with Next.js, Supabase, and Google AI.

## Features

- **Document Management**: Upload, organize, and analyze legal documents
- **AI-Powered Research**: Search through legal databases with natural language queries
- **Document Analysis**: Automated risk assessment, contract review, and compliance checking
- **Legal Chat Assistant**: Interactive AI assistant for legal questions
- **Citation Management**: Automatic citation extraction and formatting
- **Multi-Source Search**: Integration with Google Scholar, Justia, CourtListener, and more
- **RAG System**: Retrieval-Augmented Generation for accurate legal responses

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI/ML**: Google Generative AI, Vector Embeddings
- **Authentication**: NextAuth.js
- **File Storage**: Vercel Blob
- **UI Components**: shadcn/ui, Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google AI API key
- Vercel account (for deployment)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd legal-ai-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your environment variables in `.env.local`.

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL scripts in the `scripts/` folder in order:
     - `001-create-database-schema.sql`
     - `002-seed-initial-data.sql`
     - `003-create-supabase-functions.sql`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Configuration

### Database Setup

1. Go to `/admin/database` to initialize the database schema
2. Use the database setup component to create tables and seed initial data
3. Verify the connection status in the admin panel

### RAG System Setup

1. Navigate to `/admin/rag` to configure the RAG system
2. Seed the system with sample legal documents
3. Test the search functionality

### Legal Sources

Configure external legal data sources in `/admin/legal-sources`:
- Google Scholar integration
- Justia API setup
- CourtListener configuration

## Usage

### Document Upload
- Go to `/documents` to upload legal documents
- Supported formats: PDF, DOCX, TXT, MD
- Automatic text extraction and analysis

### Legal Research
- Use `/research` for comprehensive legal research
- Combine RAG database search with live source queries
- Filter by jurisdiction, practice area, and document type

### AI Chat Assistant
- Access the chat interface at `/chat`
- Ask legal questions in natural language
- Get responses with citations and sources

### Document Analysis
- Upload documents for automated analysis
- Risk assessment and compliance checking
- Contract review and privilege analysis

## API Endpoints

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document details
- `POST /api/documents/analyze` - Analyze document

### Search
- `POST /api/legal-search/live` - Live source search
- `POST /api/rag/search` - RAG database search
- `POST /api/rag/enhanced-search` - Combined search

### Chat
- `POST /api/chat` - Chat with AI assistant
- `POST /api/v1/chat/query` - Advanced chat queries

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXTAUTH_SECRET`

Optional for enhanced features:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SERP_API_KEY`
- `COURT_LISTENER_API_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`
