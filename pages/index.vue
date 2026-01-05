<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1>ExamsGPT Live</h1>
      <div class="status">
        <span :class="['status-dot', connected ? 'connected' : 'disconnected']"></span>
        <span>{{ connected ? 'Connected' : 'Connecting...' }}</span>
      </div>
    </header>

    <!-- Main Answer Display -->
    <main class="main">
      <!-- Processing indicator -->
      <div v-if="isProcessing" class="processing-indicator">
        <div class="spinner"></div>
        <p>Analizando pregunta...</p>
      </div>

      <!-- Waiting state (no answer yet and not processing) -->
      <div v-if="!currentAnswer && !isProcessing" class="waiting">
        <div class="pulse-ring"></div>
        <p>Waiting for exam question...</p>
        <small>Press "\" in ExamsGPT to capture and analyze</small>
      </div>

      <!-- Answer display (show even while processing new one) -->
      <div v-if="currentAnswer" class="answer-container" :class="{ 'dimmed': isProcessing }">
        <div class="answer-box">
          <h2 class="answer-text">{{ currentAnswer.answer }}</h2>

          <div class="metadata">
            <span class="timestamp">{{ formatTimestamp(currentAnswer.timestamp) }}</span>
            <span v-if="currentAnswer.model" class="model">{{ currentAnswer.model }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>Powered by GPT-5.2 • Microsoft Azure Exam Assistant</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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

const currentAnswer = ref<AnswerData | null>(null)
const isProcessing = ref(false)
const connected = ref(false)
let eventSource: EventSource | null = null
let processingTimeout: ReturnType<typeof setTimeout> | null = null

// Processing timeout (60 seconds) - resets if no answer received
const PROCESSING_TIMEOUT_MS = 60000

// Format timestamp
const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timestamp
  }
}

// Connect to SSE stream
const connectSSE = () => {
  console.log('[Frontend] Connecting to SSE stream...')

  eventSource = new EventSource('/api/stream')

  eventSource.onopen = () => {
    console.log('[Frontend] SSE connection opened')
    connected.value = true
  }

  eventSource.onmessage = (event) => {
    console.log('[Frontend] Raw event data:', event.data)
    try {
      const data = JSON.parse(event.data) as EventData
      console.log('[Frontend] Parsed event data:', data)

      // Handle processing event
      if (data.type === 'processing') {
        isProcessing.value = true
        console.log('[Frontend] ✓ Processing started')

        // Set timeout to auto-clear processing state (in case of backend error)
        if (processingTimeout) clearTimeout(processingTimeout)
        processingTimeout = setTimeout(() => {
          if (isProcessing.value) {
            console.log('[Frontend] ⚠ Processing timeout - clearing state')
            isProcessing.value = false
          }
        }, PROCESSING_TIMEOUT_MS)
        return
      }

      // Handle answer event
      if (data.type === 'answer' && data.answer) {
        // Clear timeout since we got an answer
        if (processingTimeout) {
          clearTimeout(processingTimeout)
          processingTimeout = null
        }
        currentAnswer.value = data
        isProcessing.value = false
        console.log('[Frontend] ✓ Answer updated in UI')
      }
    } catch (error) {
      console.log('[Frontend] Non-JSON message (probably connection confirm):', event.data)
    }
  }

  eventSource.onerror = (error) => {
    console.error('[Frontend] SSE error:', error)
    connected.value = false

    // Reconnect after 3 seconds
    setTimeout(() => {
      console.log('[Frontend] Attempting to reconnect...')
      connectSSE()
    }, 3000)
  }
}

// Lifecycle
onMounted(() => {
  connectSSE()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
  if (processingTimeout) {
    clearTimeout(processingTimeout)
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  padding: 1.5rem 2rem;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.connected {
  background: #10b981;
}

.status-dot.disconnected {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Main Content */
.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* Processing State */
.processing-indicator {
  text-align: center;
  margin-bottom: 2rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(96, 165, 250, 0.3);
  border-top-color: #60a5fa;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.processing-indicator p {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
}

/* Waiting State */
.waiting {
  text-align: center;
}

.pulse-ring {
  width: 120px;
  height: 120px;
  border: 4px solid #60a5fa;
  border-radius: 50%;
  margin: 0 auto 2rem;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.95);
    opacity: 1;
  }
}

.waiting p {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #e2e8f0;
}

.waiting small {
  color: #94a3b8;
  font-size: 1rem;
}

/* Answer Display */
.answer-container {
  width: 100%;
  max-width: 1200px;
  animation: fadeIn 0.5s ease-in;
  transition: opacity 0.3s ease;
}

.answer-container.dimmed {
  opacity: 0.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-box {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
}

.answer-text {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 2rem;
  color: #f1f5f9;
  text-align: center;
}

.metadata {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.timestamp, .model {
  font-size: 0.875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer */
.footer {
  padding: 1.5rem 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .answer-text {
    font-size: 2rem;
  }

  .answer-box {
    padding: 2rem;
  }

  .header h1 {
    font-size: 1.25rem;
  }
}
</style>
