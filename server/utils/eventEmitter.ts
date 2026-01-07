/**
 * Simple event emitter for communicating between webhook and SSE
 * Stores the latest answer in memory and supports processing status
 *
 * Uses globalThis to persist across HMR (Hot Module Replacement) in development
 * Includes messageId for deduplication and reliable delivery
 */

interface AnswerData {
  type: 'answer'
  answer: string
  timestamp: string
  model?: string
  messageId?: string
}

interface ProcessingData {
  type: 'processing'
  timestamp: string
  messageId?: string
}

type EventData = AnswerData | ProcessingData

// Generate unique message ID
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

class AnswerEventEmitter {
  private latestAnswer: AnswerData | null = null
  private isProcessing: boolean = false
  private listeners: Array<(data: EventData) => void> = []
  private lastMessageId: string | null = null

  // Emit new event (processing or answer)
  emit(data: EventData) {
    // Add unique messageId if not present
    const messageId = data.messageId || generateMessageId()
    const dataWithId = { ...data, messageId }

    if (dataWithId.type === 'processing') {
      this.isProcessing = true
      this.lastMessageId = messageId
      console.log(`[EventEmitter] Processing started [${messageId}]. Active listeners: ${this.listeners.length}`)
    } else {
      this.latestAnswer = dataWithId as AnswerData
      this.isProcessing = false
      this.lastMessageId = messageId
      console.log(`[EventEmitter] New answer emitted [${messageId}]: ${dataWithId.answer.substring(0, 50)}... Active listeners: ${this.listeners.length}`)
    }

    // Notify all listeners
    let successCount = 0
    let errorCount = 0

    this.listeners.forEach(listener => {
      try {
        listener(dataWithId)
        successCount++
      } catch (error) {
        errorCount++
        console.error('[EventEmitter] Error notifying listener:', error)
      }
    })

    console.log(`[EventEmitter] Notified ${successCount} listeners successfully, ${errorCount} errors`)
  }

  // Subscribe to future events (initial state is handled separately by stream.get.ts)
  on(listener: (data: EventData) => void) {
    this.listeners.push(listener)
    console.log(`[EventEmitter] New listener added. Total: ${this.listeners.length}`)
  }

  // Unsubscribe
  off(listener: (data: EventData) => void) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
      console.log(`[EventEmitter] Listener removed. Total: ${this.listeners.length}`)
    }
  }

  // Get latest answer
  getLatest(): AnswerData | null {
    return this.latestAnswer
  }

  // Check if currently processing
  getIsProcessing(): boolean {
    return this.isProcessing
  }

  // Get last message ID (for polling comparison)
  getLastMessageId(): string | null {
    return this.lastMessageId
  }

  // Get listener count (for debugging)
  getListenerCount(): number {
    return this.listeners.length
  }
}

// Use globalThis to persist singleton across HMR in development
// This ensures all SSE connections use the same emitter instance
const globalKey = '__examsgpt_answer_emitter__'

function getAnswerEmitter(): AnswerEventEmitter {
  if (!(globalThis as any)[globalKey]) {
    console.log('[EventEmitter] Creating new singleton instance')
    ;(globalThis as any)[globalKey] = new AnswerEventEmitter()
  }
  return (globalThis as any)[globalKey]
}

export const answerEmitter = getAnswerEmitter()
