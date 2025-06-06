import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authSlice from "./slices/authSlice"
import chatSlice from "./slices/chatSlice"
import documentSlice from "./slices/documentSlice"
import uiSlice from "./slices/uiSlice"
import agentSlice from "./slices/agentSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    document: documentSlice,
    ui: uiSlice,
    agent: agentSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
