/**
 * Simple event emitter for communicating between webhook and SSE
 * Stores the latest answer in memory
 */

interface AnswerData {
  answer: string
  timestamp: string
  model?: string
}

class AnswerEventEmitter {
  private latestAnswer: AnswerData | null = null
  private listeners: Array<(data: AnswerData) => void> = []

  // Emit new answer
  emit(data: AnswerData) {
    this.latestAnswer = data
    console.log(`[EventEmitter] New answer emitted: ${data.answer.substring(0, 50)}...`)

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('[EventEmitter] Error notifying listener:', error)
      }
    })
  }

  // Subscribe to new answers
  on(listener: (data: AnswerData) => void) {
    this.listeners.push(listener)
    console.log(`[EventEmitter] New listener added. Total: ${this.listeners.length}`)

    // Immediately send latest answer if available
    if (this.latestAnswer) {
      try {
        listener(this.latestAnswer)
      } catch (error) {
        console.error('[EventEmitter] Error sending initial data:', error)
      }
    }
  }

  // Unsubscribe
  off(listener: (data: AnswerData) => void) {
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
}

// Singleton instance
export const answerEmitter = new AnswerEventEmitter()
