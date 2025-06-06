import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface Document {
  id: string
  title: string
  content: string
  type: string
  status: "draft" | "review" | "final"
  createdAt: string
  updatedAt: string
  collaborators?: string[]
  comments?: Comment[]
  suggestions?: Suggestion[]
}

interface Comment {
  id: string
  text: string
  author: string
  position: number
  resolved: boolean
  createdAt: string
}

interface Suggestion {
  id: string
  type: "insert" | "delete" | "replace"
  originalText: string
  suggestedText: string
  position: number
  accepted: boolean
  author: string
  createdAt: string
}

interface DocumentState {
  documents: Document[]
  activeDocument: Document | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  editorState: any
  collaborationMode: boolean
}

const initialState: DocumentState = {
  documents: [],
  activeDocument: null,
  isLoading: false,
  isSaving: false,
  error: null,
  editorState: null,
  collaborationMode: false,
}

export const loadDocument = createAsyncThunk("document/load", async (documentId: string) => {
  const response = await fetch(`/api/documents/${documentId}`)
  return response.json()
})

export const saveDocument = createAsyncThunk(
  "document/save",
  async ({ id, content }: { id: string; content: string }) => {
    const response = await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    return response.json()
  },
)

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {
    setActiveDocument: (state, action: PayloadAction<Document>) => {
      state.activeDocument = action.payload
    },
    updateContent: (state, action: PayloadAction<string>) => {
      if (state.activeDocument) {
        state.activeDocument.content = action.payload
      }
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      if (state.activeDocument) {
        state.activeDocument.comments = state.activeDocument.comments || []
        state.activeDocument.comments.push(action.payload)
      }
    },
    addSuggestion: (state, action: PayloadAction<Suggestion>) => {
      if (state.activeDocument) {
        state.activeDocument.suggestions = state.activeDocument.suggestions || []
        state.activeDocument.suggestions.push(action.payload)
      }
    },
    setEditorState: (state, action: PayloadAction<any>) => {
      state.editorState = action.payload
    },
    toggleCollaboration: (state) => {
      state.collaborationMode = !state.collaborationMode
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocument.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loadDocument.fulfilled, (state, action) => {
        state.isLoading = false
        state.activeDocument = action.payload
      })
      .addCase(saveDocument.pending, (state) => {
        state.isSaving = true
      })
      .addCase(saveDocument.fulfilled, (state) => {
        state.isSaving = false
      })
  },
})

export const { setActiveDocument, updateContent, addComment, addSuggestion, setEditorState, toggleCollaboration } =
  documentSlice.actions

export default documentSlice.reducer
