/**
 * SSE (Server-Sent Events) endpoint for real-time answer and processing updates
 * GET /api/stream
 *
 * Includes heartbeat to keep connection alive and detect disconnects
 */

import { answerEmitter } from '../utils/eventEmitter'

const HEARTBEAT_INTERVAL = 15000 // 15 seconds

export default defineEventHandler(async (event) => {
  console.log('[SSE] Client connected')

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  // Create a stream
  const stream = createEventStream(event)

  // Send initial connection message
  console.log('[SSE] Sending connection confirmation')
  stream.push('Connected to ExamsGPT live feed')

  // Send current state immediately
  const isProcessing = answerEmitter.getIsProcessing()
  if (isProcessing) {
    console.log('[SSE] Sending current processing state')
    stream.push(JSON.stringify({
      type: 'processing',
      timestamp: new Date().toISOString(),
      messageId: answerEmitter.getLastMessageId()
    }))
  }

  const latest = answerEmitter.getLatest()
  if (latest) {
    console.log('[SSE] Sending latest answer:', latest.answer.substring(0, 50))
    stream.push(JSON.stringify(latest))
  }

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      stream.push(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        lastMessageId: answerEmitter.getLastMessageId()
      }))
    } catch (error) {
      console.error('[SSE] Heartbeat error:', error)
      clearInterval(heartbeatInterval)
    }
  }, HEARTBEAT_INTERVAL)

  // Listen for new events (both processing and answer)
  const listener = (data: any) => {
    try {
      const preview = data.type === 'answer' ? data.answer.substring(0, 50) : 'processing started'
      console.log('[SSE] Pushing new data to client:', preview, `[${data.messageId}]`)
      stream.push(JSON.stringify(data))
    } catch (error) {
      console.error('[SSE] Error pushing data:', error)
    }
  }

  answerEmitter.on(listener)

  // Cleanup on connection close
  stream.onClosed(() => {
    console.log('[SSE] Client disconnected')
    clearInterval(heartbeatInterval)
    answerEmitter.off(listener)
  })

  return stream.send()
})
