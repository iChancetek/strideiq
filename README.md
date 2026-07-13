# StrideIQ Platform

**StrideIQ** is a modern, intelligent platform powered by cutting-edge Agentic AI. This project leverages the latest in AI frameworks to provide an autonomous, context-aware experience for users, pushing beyond simple chatbots into true AI agency.

---

## 🚀 How the Platform Works

StrideIQ is designed as a dynamic, intelligent system where user requests are handled not by static code, but by an autonomous reasoning loop. It combines a robust Next.js frontend with a powerful backend powered by LangGraph, LangChain, and Firebase. 

When a user interacts with the platform, their input is processed by our **Agentic AI System**. The system dynamically retrieves relevant contextual data via our RAG (Retrieval-Augmented Generation) pipeline using Pinecone vector databases, searches the web if necessary, and orchestrates specialized tools to accomplish complex goals.

## 🤖 The Agentic AI System

StrideIQ doesn't just respond; it thinks, plans, and acts. We utilize **Agentic AI**—a paradigm where AI possesses agency to break down problems into steps, decide which tools to use, execute those steps autonomously, and observe the results to ensure success.

### What are AI Agents and Agentic AI?
- **AI Agents**: Software entities powered by Large Language Models (LLMs) that can perceive their environment, make decisions, and use tools to achieve specific goals.
- **Agentic AI**: Systems characterized by their ability to operate in autonomous loops (**Thinking -> Acting -> Observing**). Instead of generating text in a single pass, Agentic AI iterates, correcting its own course and utilizing external tools to synthesize comprehensive solutions.

### The LangGraph Architecture: Supervisor & Worker Agents
Our system's core orchestration is built on **LangGraph**, utilizing a highly scalable **Supervisor-Worker** pattern.

#### The Supervisor Agent (The Orchestrator)
The Supervisor is the reasoning core of StrideIQ. When a task is initiated, the Supervisor:
1. Maintains the conversation state and contextual memory.
2. Analyzes the overarching goal and breaks it down into a strategic plan.
3. Decides which specialized tools or "Worker Agents" are required.
4. Delegates sub-tasks to the Workers and synthesizes their findings into the final output.

#### The Worker Agents (The Tool Nodes)
Worker agents are specialized nodes designed to execute precise tasks delegated by the Supervisor or the Agent Core orchestrator. In StrideIQ, our specific worker agents include:
- **Movement Agent**: Processes GPS position updates and handles auto-pause/resume logic.
- **Coaching Agent**: Tracks mile splits, analyzes pace against historical bests, and delivers audio encouragement and performance updates.
- **Environment Agent**: Fetches real-time weather data for outdoor sessions and generates context-aware announcements.
- **Pulse Agent**: Estimates heart rate (Optical HR) and blood pressure during sessions.
- **Media Agent**: Recommends media and playlists optimized for your current activity and pace.
- **Step Agent**: Tracks and calculates step cadence during your activities.

### How Everything Works Together (The Autonomous Loop)
1. **Perception**: The Supervisor receives a complex prompt and understands the user's intent.
2. **Reasoning & Planning**: It identifies the necessary steps (e.g., fetching internal data AND searching the web).
3. **Delegation (Acting)**: It dispatches the appropriate Worker Agents to execute the required tools.
4. **Observation**: The Supervisor reviews the returned data from the Workers. If the data is insufficient, it may trigger another loop to gather more information.
5. **Synthesis**: It compiles all the gathered intelligence into a cohesive, accurate, and actionable response for the user.

### 🧠 Our Models & Multi-Model Routing
StrideIQ employs a **Multi-Model Support** system, dynamically routing tasks to the most capable model based on the complexity and requirement of the request:
- **OpenAI GPT-5.2 / GPT-4o**: Deployed for complex reasoning, deep context understanding, and driving the core Supervisor logic.
- **Anthropic Claude**: Leveraged for nuanced, human-like writing, extensive context windows, and advanced analytical tasks.
- **Google Gemini**: Utilized for rapid processing and specific multimodal capabilities.

---

## 🌟 Benefits of Using the StrideIQ Platform

1. **Autonomous Problem Solving**: Users don't need to manually string together different queries. Ask StrideIQ a complex question, and the Agentic system handles the planning, research, and synthesis automatically.
2. **Deep Contextual Awareness**: By deeply integrating RAG and Pinecone, the AI remembers past interactions and understands your specific data context, ensuring responses are deeply personalized and relevant.
3. **Frictionless Experience**: From drafting documents to analyzing large datasets, the AI handles the heavy lifting. Features are designed to reduce user cognitive load.
4. **Scalability and Extensibility**: Our MCP-ready architecture means adding new tools, databases, or third-party integrations is seamless, constantly expanding what StrideIQ can do for you.
5. **Reliable & Fast**: Built on Next.js and Firebase, the platform is lightning-fast, secure, and accessible from anywhere.

---

## 🛠 Tech Stack
- **Frontend/Framework**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend/Infrastructure**: Firebase (Auth, Firestore, Storage, App Hosting)
- **AI & Orchestration**: LangGraph, LangChain, OpenAI, Anthropic, Google Gemini
- **Database**: Pinecone (Vector DB)

## 📦 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
