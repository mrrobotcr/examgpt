/**
 * Webhook endpoint to receive answers and processing status from ExamsGPT
 * POST /api/webhook
 */

import { answerEmitter } from '../utils/eventEmitter'

export default defineEventHandler(async (event) => {
  try {
    // Read the POST body
    const body = await readBody(event)

    console.log('[Webhook] Received data:', body)

    const eventType = body.type || 'answer'

    // Handle processing event
    if (eventType === 'processing') {
      answerEmitter.emit({
        type: 'processing',
        timestamp: body.timestamp || new Date().toISOString()
      })

      return {
        success: true,
        message: 'Processing status broadcasted'
      }
    }

    // Handle answer event
    if (!body.answer) {
      return {
        success: false,
        error: 'Missing required field: answer'
      }
    }

    // Emit the answer to all connected clients via SSE
    answerEmitter.emit({
      type: 'answer',
      answer: body.answer,
      timestamp: body.timestamp || new Date().toISOString(),
      model: body.model
    })

    // Return success
    return {
      success: true,
      message: 'Answer received and broadcasted'
    }

  } catch (error) {
    console.error('[Webhook] Error processing request:', error)

    return {
      success: false,
      error: 'Internal server error'
    }
  }
})
