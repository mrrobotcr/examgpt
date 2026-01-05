/**
 * SSE (Server-Sent Events) endpoint for real-time answer updates
 * GET /api/stream
 */

import { answerEmitter } from '../utils/eventEmitter'

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

  // Send latest answer immediately if available
  const latest = answerEmitter.getLatest()
  if (latest) {
    console.log('[SSE] Sending latest answer immediately:', latest.answer.substring(0, 50))
    stream.push(JSON.stringify(latest))
  }

  // Listen for new answers
  const listener = (data: any) => {
    try {
      console.log('[SSE] Pushing new data to client:', data.answer.substring(0, 50))
      stream.push(JSON.stringify(data))
    } catch (error) {
      console.error('[SSE] Error pushing data:', error)
    }
  }

  answerEmitter.on(listener)

  // Cleanup on connection close
  stream.onClosed(() => {
    console.log('[SSE] Client disconnected')
    answerEmitter.off(listener)
  })

  return stream.send()
})
