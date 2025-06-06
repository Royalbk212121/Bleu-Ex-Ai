import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface Agent {
  id: string
  name: string
  type: string
  status: "idle" | "active" | "busy" | "error"
  confidence: number
  lastActivity: string
  currentTask?: string
}

interface AgentSession {
  id: string
  agents: Agent[]
  status: "initializing" | "active" | "completed" | "error"
  createdAt: string
  tasks: Task[]
}

interface Task {
  id: string
  type: string
  description: string
  assignedAgent: string
  status: "pending" | "in_progress" | "completed" | "failed"
  result?: any
  createdAt: string
  completedAt?: string
}

interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  availableAgents: Agent[]
  isLoading: boolean
  error: string | null
}

const initialState: AgentState = {
  sessions: [],
  activeSessionId: null,
  availableAgents: [],
  isLoading: false,
  error: null,
}

export const createAgentSession = createAsyncThunk("agent/createSession", async (agentTypes: string[]) => {
  const response = await fetch("/api/agents/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentTypes }),
  })
  return response.json()
})

export const executeTask = createAsyncThunk(
  "agent/executeTask",
  async ({ sessionId, task }: { sessionId: string; task: any }) => {
    const response = await fetch("/api/agents/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, task }),
    })
    return response.json()
  },
)

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload
    },
    updateAgentStatus: (state, action: PayloadAction<{ agentId: string; status: Agent["status"] }>) => {
      const session = state.sessions.find((s) => s.id === state.activeSessionId)
      if (session) {
        const agent = session.agents.find((a) => a.id === action.payload.agentId)
        if (agent) {
          agent.status = action.payload.status
          agent.lastActivity = new Date().toISOString()
        }
      }
    },
    addTask: (state, action: PayloadAction<Task>) => {
      const session = state.sessions.find((s) => s.id === state.activeSessionId)
      if (session) {
        session.tasks.push(action.payload)
      }
    },
    updateTask: (state, action: PayloadAction<{ taskId: string; updates: Partial<Task> }>) => {
      const session = state.sessions.find((s) => s.id === state.activeSessionId)
      if (session) {
        const task = session.tasks.find((t) => t.id === action.payload.taskId)
        if (task) {
          Object.assign(task, action.payload.updates)
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAgentSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createAgentSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessions.push(action.payload)
        state.activeSessionId = action.payload.id
      })
      .addCase(executeTask.fulfilled, (state, action) => {
        const session = state.sessions.find((s) => s.id === state.activeSessionId)
        if (session) {
          const task = session.tasks.find((t) => t.id === action.payload.taskId)
          if (task) {
            task.status = "completed"
            task.result = action.payload.result
            task.completedAt = new Date().toISOString()
          }
        }
      })
  },
})

export const { setActiveSession, updateAgentStatus, addTask, updateTask } = agentSlice.actions

export default agentSlice.reducer
