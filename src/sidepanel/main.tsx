import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'jotai'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { store } from '../atoms/store'
import SidePanel from './SidePanel'
import '../index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SidePanel />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>,
)

