# ExamsGPT Web Interface

Real-time web interface for displaying exam answers from ExamsGPT.

## Architecture

```
ExamsGPT Python App
      ↓
  GPT-5.2 API
      ↓
POST /api/webhook (Nuxt Backend)
      ↓
  EventEmitter (In-Memory)
      ↓
GET /api/stream (SSE)
      ↓
  Frontend (Vue/Nuxt)
```

## Features

- 🔴 **Real-time Updates**: Uses Server-Sent Events (SSE) for instant answer display
- 🎯 **Clean UI**: Fullscreen answer display with minimal distractions
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- ⚡ **Fast**: No database, all in-memory for maximum speed
- 🔄 **Auto-reconnect**: Automatically reconnects if connection drops

## Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 3. Configure ExamsGPT

In the main `examsGPT` directory, edit `.env`:

```env
APP_MODE=webhook
WEBHOOK_URL=http://localhost:3000/api/webhook
```

### 4. Start ExamsGPT

In the main directory:

```bash
source venv/bin/activate
python main.py
```

## Usage

1. **Open Browser**: Navigate to http://localhost:3000
2. **Capture Screen**: Press `\` in ExamsGPT when you see an exam question
3. **View Answer**: Answer appears instantly on the web interface

## API Endpoints

### POST /api/webhook

Receives answers from ExamsGPT.

**Request Body:**
```json
{
  "answer": "Answer: C. Cycle time",
  "timestamp": "2026-01-04T19:59:48.123456",
  "model": "gpt-5.2",
  "elapsed_seconds": 6.5,
  "tokens_used": 1988
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer received and broadcasted"
}
```

### GET /api/stream

SSE endpoint for real-time updates.

**Response:** Event stream with JSON data:
```
data: {"answer": "Answer: C. Cycle time", "timestamp": "...", "model": "gpt-5.2"}
```

## Production Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy Options

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Docker**: Create a Dockerfile with Node.js
- **VPS**: Use PM2 to run the app

## Customization

### Change Port

Edit `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  devServer: {
    port: 8080  // Change port here
  }
})
```

### Modify UI

Edit `pages/index.vue` to customize:
- Colors and styling
- Layout and typography
- Animations and effects

### Add Features

You can easily add:
- Answer history (store in array)
- Screenshot display (add image to webhook payload)
- Multiple users (add authentication)
- Statistics dashboard (track answer counts, times, etc.)

## Troubleshooting

### Port Already in Use

Change the port in `nuxt.config.ts` or kill the process:
```bash
lsof -ti:3000 | xargs kill
```

### SSE Not Connecting

- Check that the Nuxt dev server is running
- Open browser console for connection errors
- Verify firewall isn't blocking port 3000

### Webhook Not Receiving Data

- Verify ExamsGPT `.env` has correct `WEBHOOK_URL`
- Check ExamsGPT logs for webhook errors
- Test webhook manually:

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"answer":"Test answer","timestamp":"2026-01-04T20:00:00"}'
```

## Technology Stack

- **Nuxt 3**: Vue.js meta-framework
- **Vue 3**: Frontend framework with Composition API
- **TypeScript**: Type-safe development
- **Server-Sent Events**: Real-time communication
- **Nitro**: Universal server engine

## License

Part of ExamsGPT project - for educational purposes only.
