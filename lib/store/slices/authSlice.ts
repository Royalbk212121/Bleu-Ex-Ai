import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "professional" | "admin"
  subscriptionTier: "free" | "professional" | "enterprise"
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
}

export const loginUser = createAsyncThunk("auth/login", async (credentials: { email: string; password: string }) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error("Login failed")
  }

  return response.json()
})

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await fetch("/api/auth/logout", { method: "POST" })
})

export const refreshToken = createAsyncThunk("auth/refresh", async () => {
  const response = await fetch("/api/auth/refresh", { method: "POST" })
  return response.json()
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    updateSubscription: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.subscriptionTier = action.payload as any
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Login failed"
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError, setUser, updateSubscription } = authSlice.actions
export default authSlice.reducer
