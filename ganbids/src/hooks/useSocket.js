// ============================================================
// GANBIDS — Shared WebSocket Hook
// Single socket connection shared across all pages
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let sharedSocket = null
let listenerCount = 0

function getSharedSocket() {
  if (!sharedSocket) {
    sharedSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    })
  }
  return sharedSocket
}

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef(new Map())

  useEffect(() => {
    const socket = getSharedSocket()
    listenerCount++

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)

      // Remove all handlers registered by this hook instance
      handlersRef.current.forEach((handler, event) => {
        socket.off(event, handler)
      })
      handlersRef.current.clear()

      listenerCount--
      if (listenerCount <= 0) {
        sharedSocket.disconnect()
        sharedSocket = null
        listenerCount = 0
      }
    }
  }, [])

  const on = useCallback((event, handler) => {
    const socket = getSharedSocket()
    // Remove previous handler for this event if any
    if (handlersRef.current.has(event)) {
      socket.off(event, handlersRef.current.get(event))
    }
    socket.on(event, handler)
    handlersRef.current.set(event, handler)
  }, [])

  const off = useCallback((event) => {
    const socket = getSharedSocket()
    if (handlersRef.current.has(event)) {
      socket.off(event, handlersRef.current.get(event))
      handlersRef.current.delete(event)
    }
  }, [])

  const emit = useCallback((event, data) => {
    const socket = getSharedSocket()
    if (socket.connected) {
      socket.emit(event, data)
    }
  }, [])

  return { connected, on, off, emit }
}

export default useSocket
