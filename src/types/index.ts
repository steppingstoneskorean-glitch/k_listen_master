export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface Lesson {
  id: string
  title: string
  titleKo: string
  level: 'beginner' | 'intermediate' | 'advanced'
  audioUrl: string
  transcript: string
  createdAt: Date
}
