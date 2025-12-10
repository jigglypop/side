import React from 'react'
import { useAtom } from 'jotai'
import styles from './SidePanel.module.css'
import { ChatHeader } from '../components/ChatHeader'
import { MessageList } from '../components/MessageList'
import { ChatInput } from '../components/ChatInput'
import { useAIChat } from '../hooks/useAIChat'
import { messagesAtom, inputAtom } from '../atoms/chatAtoms'
import { useSettings } from '../hooks/useSettings'
import { useAtom as useJotai } from 'jotai'
import { aiModelsAtom, selectedModelAtom } from '../atoms/settingsAtoms'
import { SettingsTab } from '../components/SettingsTab'

const SidePanel: React.FC = () => {
  const [messages] = useAtom(messagesAtom)
  const [input, setInput] = useAtom(inputAtom)
  const { sendMessage, isLoading, isConnected } = useAIChat()

  const {isSetting, toggleSetting } = useSettings()
  const [models] = useJotai(aiModelsAtom)
  const [selectedModel] = useJotai(selectedModelAtom)
  const activeModelName = models.find(m => m.id === selectedModel)?.name

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  return (
   <div className={styles.sidepanel} data-theme="dark">
    <ChatHeader isConnected={isConnected} onCloseClick={() => window.close()} activeModelName={activeModelName} />
    {isSetting ? (
     <SettingsTab />
    ) : (
     <>
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} activeModelName={activeModelName} onSelectModel={toggleSetting} />
     </>
    )}
   </div>
  )
}

export default SidePanel

