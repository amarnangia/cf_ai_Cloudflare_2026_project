# NrityaAI - AI-Powered Indian Classical Dance Instructor

## 🎭 Overview

NrityaAI is an intelligent dance instruction platform that combines the power of Cloudflare's AI infrastructure with specialized multi-agent workflows to provide personalized Indian classical dance education. The system uses a sophisticated 3-agent architecture to deliver contextual, expert-level guidance for Bharatanatyam and Kathak dance forms.

## 🏗️ Architecture

### Multi-Agent Workflow System
The application implements a sophisticated 3-agent pipeline that processes each user query through specialized AI agents:

1. **Intent Classification Agent**: Analyzes user input to determine the type of assistance needed
   - TECHNIQUE: Movement, postures, and technical guidance
   - THEORY: Cultural history and philosophical aspects
   - PRACTICE: Structured routines and exercises
   - RESOURCES: Learning materials and references
   - GENERAL: Conversational interactions

2. **Specialized Response Agent**: Provides expert responses based on classified intent
   - **Technique Expert**: Detailed step-by-step movement instructions
   - **Cultural Historian**: Rich cultural context and historical background
   - **Practice Coach**: Structured practice routines with warm-up and cool-down
   - **Resource Curator**: Curated learning materials and recommendations

3. **Enhancement Agent**: Personalizes responses based on user's skill level and dance style
   - Adds personal encouragement
   - Connects to user's learning journey
   - Provides actionable next steps

### Technical Stack

#### Backend (Cloudflare Workers)
- **Workers AI**: Llama 3.1 8B Instruct model for natural language processing
- **Durable Objects**: Persistent state management for user memory and chat sessions
- **TypeScript**: Type-safe development with comprehensive error handling
- **Multi-agent coordination**: Sequential AI processing pipeline

#### Frontend (React)
- **React 18**: Modern component-based UI framework
- **Framer Motion**: Smooth animations and transitions
- **Tailwind CSS**: Utility-first styling with custom Indian classical theme
- **Lucide Icons**: Beautiful, consistent iconography
- **localStorage**: Client-side user identification persistence

#### Data Layer
- **Persistent Memory**: User preferences, skill level, and conversation history
- **Chat Sessions**: Multiple conversation threads per user
- **Knowledge Base**: Curated dance resources and tutorials
- **Cross-device Sync**: Cloud-based storage accessible from any device

## 🚀 Features

### Core Functionality
- **Intelligent Conversations**: Context-aware responses using conversation history
- **Personalized Learning**: Adapts to user's dance style (Bharatanatyam/Kathak) and skill level
- **Multi-session Support**: Create and manage multiple chat conversations
- **Persistent Memory**: Remembers user preferences and learning progress
- **Resource Integration**: Curated dance tutorials and learning materials

### Advanced Capabilities
- **Intent Recognition**: Automatically classifies user queries for specialized responses
- **Expert Specialization**: Different AI personalities for technique, theory, practice, and resources
- **Progressive Enhancement**: Responses improve based on user's learning journey
- **Cultural Authenticity**: Accurate representation of Indian classical dance traditions
- **Cross-platform Persistence**: Access conversations from any device

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control

### Running the Website

1. **Clone the repository**
   ```bash
   git clone <https://github.com/amarnangia/cf_ai_Cloudflare_2026_project
   cd cf_ai_Cloudflare_2026_project
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Access the Application**
   - Open `http://localhost:3000` in your browser
   - The app is already connected to the deployed Cloudflare Worker
   - Start chatting with NrityaAI immediately!

### If You Want to Modify the AI Workflow

To customize the multi-agent system or deploy your own worker:

1. **Setup Cloudflare Account**
   - Create a Cloudflare account
   - Enable Workers AI in your dashboard

2. **Deploy Your Own Worker**
   ```bash
   cd nrityaai-worker
   npm install
   
   # Login to Cloudflare
   npx wrangler login
   
   # Generate TypeScript types
   npm run cf-typegen
   
   # Deploy your worker
   wrangler deploy
   ```

3. **Connect Frontend to Your Worker**
   ```bash
   # Update src/config.js with your worker URL
   # Replace: https://nrityaai-worker.amarvivaknangia.workers.dev
   # With: https://your-worker.your-subdomain.workers.dev
   ```

### Production Deployment

#### Backend Deployment
The Cloudflare Worker is automatically deployed to the edge network:
```bash
cd nrityaai-worker
wrangler deploy
```

#### Frontend Deployment
Deploy to Cloudflare Pages:
```bash
cd frontend
npm run build
# Deploy build folder to Cloudflare Pages
```

## 🔗 Live Demo

**Deployed Application**: [https://nrityaai-worker.amarvivaknangia.workers.dev](https://nrityaai-worker.amarvivaknangia.workers.dev)

**Frontend Interface**: Access through the deployed Pages URL or run locally on `http://localhost:3000`

## 📖 Usage Guide

### Getting Started
1. **Access the Application**: Navigate to the deployed URL or local development server
2. **Start Chatting**: Begin with a greeting or specific dance question
3. **Explore Features**: Try different types of questions to see specialized agents in action

### Example Interactions

#### Technique Questions
```
User: "Show me the basic Bharatanatyam hand positions"
→ Triggers Technique Expert Agent
→ Provides detailed hand gesture instructions with positioning tips
```

#### Cultural/Theory Questions
```
User: "What's the history behind Kathak dance?"
→ Triggers Cultural Historian Agent  
→ Explains rich cultural heritage and philosophical foundations
```

#### Practice Guidance
```
User: "Give me a beginner practice routine"
→ Triggers Practice Coach Agent
→ Creates structured routine with warm-up, exercises, and cool-down
```

#### Resource Requests
```
User: "What videos should I watch to learn?"
→ Triggers Resource Curator Agent
→ Recommends curated learning materials based on skill level
```

### Advanced Features
- **Multiple Chat Sessions**: Create separate conversations for different topics
- **Persistent Learning**: Your progress and preferences are remembered across sessions
- **Contextual Responses**: AI remembers previous conversations for better assistance
- **Progressive Difficulty**: Recommendations adapt as your skill level improves

## 🏛️ System Architecture Details

### Workflow Coordination
The multi-agent system demonstrates sophisticated AI orchestration:

```
User Input → Intent Classification → Specialized Processing → Enhancement → Response
     ↓              ↓                      ↓                  ↓           ↓
  Raw Query    TECHNIQUE/THEORY/      Expert Agent      Personalization  Final
              PRACTICE/RESOURCES      Processing         & Encouragement  Output
```

#### Technical Implementation Details

**Agent 1: Intent Classification Agent**
```typescript
const intentPrompt = `Classify this dance learning request into one of these categories:
- TECHNIQUE: asking about specific moves, postures, or techniques
- THEORY: asking about history, philosophy, or cultural aspects  
- PRACTICE: asking for exercises, routines, or practice guidance
- RESOURCES: asking for videos, books, or learning materials
- GENERAL: general conversation or greeting

User message: "${message}"

Respond with just the category name.`;

const intentRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: intentPrompt });
const intent = intentRes.response?.trim() || "GENERAL";
```

**Agent 2: Specialized Response Agents**
Based on the classified intent, one of five specialized agents is activated:

- **Technique Expert**: `You are a dance technique expert specializing in ${memory.style}...`
- **Cultural Historian**: `You are a dance historian and cultural expert in ${memory.style}...`
- **Practice Coach**: `You are a dance practice coach for ${memory.style}...`
- **Resource Curator**: `You are a dance education curator...`
- **General Assistant**: `You are NrityaAI, a friendly dance instructor...`

**Agent 3: Enhancement Agent**
```typescript
const enhancePrompt = `You are a master dance instructor. Take this response and enhance it with:
1. Personal encouragement based on their ${memory.level} level
2. Connection to their ${memory.style} journey
3. A specific next step or practice suggestion

Original response: ${specializedRes.response}

Enhance this response to be more personal and actionable:`;
```

#### Sequential Execution Flow
1. **Input Processing**: User message + memory context loaded
2. **Agent 1 Execution**: Intent classification via LLM call
3. **Agent 2 Execution**: Specialized response generation based on intent
4. **Agent 3 Execution**: Response enhancement and personalization
5. **Output Delivery**: Final enhanced response returned to user

Each agent is implemented as a separate LLM call with specialized prompts, creating a true multi-agent workflow system that demonstrates advanced AI coordination and specialization.

### Data Flow
1. **User Authentication**: Persistent user ID generation and storage
2. **Memory Retrieval**: Load user's dance learning profile and history
3. **Context Building**: Combine user memory with relevant dance resources
4. **Multi-Agent Processing**: Sequential AI agent execution
5. **Response Enhancement**: Personalization based on user's journey
6. **State Persistence**: Save updated conversation and learning progress

### Scalability Features
- **Edge Computing**: Cloudflare Workers provide global low-latency access
- **Durable Objects**: Consistent state management across the edge network
- **Efficient Memory**: Only recent conversation history used for context
- **Resource Optimization**: Minimal bundle size and optimized API calls

## 🧪 API Testing

### Quick Smoke Test
```bash
# Test the deployed worker
curl -X POST https://nrityaai-worker.amarvivaknangia.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me Bharatanatyam tutorials",
    "userId": "test_user_123"
  }'
```

### Expected Response Format
```json
{
  "reply": "Here are excellent Bharatanatyam tutorials for you:\n\n**Beginner Bharatanatyam Full Class – Kalakshetra Style**\nhttps://www.youtube.com/watch?v=Y9LZbM8cpvA\nComplete beginner class in traditional Kalakshetra style..."
}
```

### Test Different Intents
```bash
# Test technique query
curl -X POST https://nrityaai-worker.amarvivaknangia.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I do aramandi position?", "userId": "test_user_123"}'

# Test resource query  
curl -X POST https://nrityaai-worker.amarvivaknangia.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"message": "Recommend Kathak videos", "userId": "test_user_123"}'
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in frontend directory:
```env
REACT_APP_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

### Worker Configuration
Exact `wrangler.jsonc` configuration:
```json
{
  "name": "nrityaai-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "ai": {
    "binding": "AI"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "CHAT",
        "class_name": "ChatDO"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": [
        "ChatDO"
      ]
    }
  ]
}
```

### AI Model Used
**Model**: `@cf/meta/llama-3.1-8b-instruct`
- Used consistently across all 3 agents
- Binding: `env.AI`
- All AI calls: `await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt })`

### Updating Dance Resources

To add or modify dance tutorials and resources:

1. **Edit the Resource File**
   ```bash
   # Edit the dance resources in TypeScript format
   vim nrityaai-worker/src/dance_resources.ts
   ```

2. **Generate SQL from Resources**
   ```bash
   cd nrityaai-worker
   node generate_sql.js
   ```

3. **Upload to Database**
   ```bash
   wrangler d1 execute nrityaai-db --remote --file=./populate.sql
   ```

4. **Deploy Worker** (if needed)
   ```bash
   wrangler deploy
   ```

**Resource Format**:
```typescript
{
  title: "Tutorial Title",
  type: "Video" | "Playlist" | "Website" | "Article",
  url: "https://example.com",
  category: "technique" | "theory" | "practice" | "resources",
  description: "Brief description of the resource"
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for consistent formatting
- Comprehensive error handling
- Clear documentation and comments

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare**: For providing the AI and edge computing infrastructure
- **Indian Classical Dance Community**: For inspiration and cultural guidance
- **Open Source Libraries**: React, Framer Motion, Tailwind CSS, and others
- **AI Research Community**: For advancing natural language processing capabilities

---

**Built with ❤️ for the preservation and teaching of Indian classical dance traditions**