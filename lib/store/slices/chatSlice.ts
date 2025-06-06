import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  sources?: any[]
  citations?: string[]
  isStreaming?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  streamingMessage: string
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
  streamingMessage: "",
}

export const createChatSession = createAsyncThunk("chat/createSession", async (title?: string) => {
  const response = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  return response.json()
})

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ sessionId, message }: { sessionId: string; message: string }) => {
    const response = await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    })
    return response.json()
  },
)

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const session = state.sessions.find((s) => s.id === state.activeSessionId)
      if (session) {
        session.messages.push(action.payload)
      }
    },
    updateStreamingMessage: (state, action: PayloadAction<string>) => {
      state.streamingMessage = action.payload
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload
    },
    clearStreamingMessage: (state) => {
      state.streamingMessage = ""
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createChatSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload)
        state.activeSessionId = action.payload.id
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false
        const session = state.sessions.find((s) => s.id === state.activeSessionId)
        if (session) {
          session.messages.push(action.payload)
        }
      })
  },
})

export const { setActiveSession, addMessage, updateStreamingMessage, setStreaming, clearStreamingMessage } =
  chatSlice.actions

export default chatSlice.reducer
