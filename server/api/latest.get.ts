/**
 * Endpoint to get the latest answer and processing state
 * GET /api/latest
 *
 * Used as fallback when SSE connection is unreliable
 * Returns messageId for deduplication
 */

import { answerEmitter } from '../utils/eventEmitter'

export default defineEventHandler(() => {
  const latest = answerEmitter.getLatest()
  const isProcessing = answerEmitter.getIsProcessing()
  const lastMessageId = answerEmitter.getLastMessageId()
  const listenerCount = answerEmitter.getListenerCount()

  console.log(`[Latest] State - Processing: ${isProcessing}, MessageId: ${lastMessageId}, Listeners: ${listenerCount}`)

  return {
    success: true,
    isProcessing,
    lastMessageId,
    listenerCount,
    answer: latest
  }
})
