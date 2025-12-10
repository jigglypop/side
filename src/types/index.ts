export interface CommandMessage {
  type: 'COMMAND'
  payload?: {
    command?: string
  }
}

export interface UserPreferences {
  theme: 'dark' | 'light'
  apiKey?: string
} 