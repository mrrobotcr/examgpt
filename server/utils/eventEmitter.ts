/**
 * Simple event emitter for communicating between webhook and SSE
 * Stores the latest answer in memory and supports processing status
 *
 * Uses globalThis to persist across HMR (Hot Module Replacement) in development
 */

interface AnswerData {
  type: 'answer'
  answer: string
  timestamp: string
  model?: string
}

interface ProcessingData {
  type: 'processing'
  timestamp: string
}

type EventData = AnswerData | ProcessingData

class AnswerEventEmitter {
  private latestAnswer: AnswerData | null = null
  private isProcessing: boolean = false
  private listeners: Array<(data: EventData) => void> = []

  // Emit new event (processing or answer)
  emit(data: EventData) {
    if (data.type === 'processing') {
      this.isProcessing = true
      console.log(`[EventEmitter] Processing started. Active listeners: ${this.listeners.length}`)
    } else {
      this.latestAnswer = data
      this.isProcessing = false
      console.log(`[EventEmitter] New answer emitted: ${data.answer.substring(0, 50)}... Active listeners: ${this.listeners.length}`)
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('[EventEmitter] Error notifying listener:', error)
      }
    })
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
