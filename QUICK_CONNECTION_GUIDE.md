# 🔗 SmartNews Connection Architecture

## Quick Start Guide

Your SmartNews application now has **enterprise-grade connection resilience** to prevent crashes and handle network issues gracefully!

## 🚀 What's New

### ✅ Automatic Features (No Configuration Needed!)

1. **Auto-Retry on Failures** - Failed requests retry up to 3 times with smart exponential backoff
2. **Timeout Protection** - All requests timeout after 10 seconds (configurable)
3. **Circuit Breaker** - Stops hammering a failing backend automatically
4. **Health Monitoring** - Backend health checked every 30 seconds
5. **LIVE SCRAPING** - New articles are automatically fetched in the background every 30 minutes.
6. **Error Boundaries** - React errors caught and displayed gracefully
6. **Loading States** - Beautiful loading indicators while fetching data
7. **User-Friendly Errors** - Clear error messages with retry buttons

## 📊 Status Check

### Backend Health
```bash
# Check if backend is healthy
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Global News Backend",
  "version": "2.0.0",
  "database": "connected",
  "timestamp": "2026-02-06T12:00:00"
}
```

### Frontend Connection
- Open browser console on http://localhost:3000
- Look for: `🔧 Config loaded:` message
- All API requests will show retry attempts if they fail

## 🧪 Test the Connection

Run the connection test script:
```bash
python test_connection.py
```

This will test:
- Health endpoint
- API endpoints
- Retry logic
- Concurrent requests
- Timeout handling

## 🛠️ How It Works

### Backend Protection
```
Request → CORS Check → Middleware → Error Handling → Response
                                   ↓
                             Log & Track
```

### Frontend Resilience
```
Component → API Client → Retry Logic → Backend
                ↓             ↓
          Timeout      Exponential
                       Backoff
```

## 📱 User Experience

### Before (Old):
- ❌ White screen on error
- ❌ No feedback on loading
- ❌ Crashes on network issues
- ❌ No retry mechanism

### After (New):
- ✅ Graceful error displays
- ✅ Loading indicators
- ✅ Automatic retries
- ✅ User can retry manually
- ✅ Fallback content
- ✅ Never crashes

## 🔧 Configuration Options

### Frontend (.env.local)
```env
# API endpoint
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Timeout in milliseconds
NEXT_PUBLIC_REQUEST_TIMEOUT=10000

# Max retry attempts
NEXT_PUBLIC_MAX_RETRIES=3

# Cache revalidation
NEXT_PUBLIC_REVALIDATE_TIME=120
```

### Backend (.env)
```env
# Debug mode (detailed errors)
DEBUG=true

# Request timeout
REQUEST_TIMEOUT=30

# Max connections
MAX_CONNECTIONS=100
```

## 🎯 Key Features

### 1. Smart Retry Logic
- **Retries**: 3 attempts by default
- **Backoff**: 1s, 2s, 4s delays
- **Smart**: Only retries server errors (5xx), not client errors (4xx)

### 2. Circuit Breaker
- **Threshold**: 5 consecutive failures
- **Action**: Marks backend as unhealthy
- **Recovery**: Automatic on successful request

### 3. Error Handling
- **Frontend**: Error boundaries + user-friendly messages
- **Backend**: Middleware catches all errors
- **Logging**: All errors logged for debugging

### 4. Performance Tracking
- **X-Process-Time**: Header shows request duration
- **Health Checks**: Monitor system status
- **Metrics**: Track success/failure rates

## 📈 Monitoring

### Check Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend (browser console)
# Look for API request logs
```

### Monitor Health
```bash
# Continuous health monitoring
while true; do
  curl -s http://localhost:8000/health | jq
  sleep 5
done
```

## 🚨 Common Issues & Solutions

### Issue: "Backend service is currently unavailable"
**Cause**: Backend is down or unreachable
**Solution**:
1. Check if backend is running: `http://localhost:8000/health`
2. Restart backend: `cd backend && python run_local.py`

### Issue: "Request timeout after 10000ms"
**Cause**: Backend is too slow or network is poor
**Solution**:
1. Increase timeout in `.env.local`: `NEXT_PUBLIC_REQUEST_TIMEOUT=20000`
2. Check backend performance
3. Optimize database queries

### Issue: Frontend shows loading forever
**Cause**: API endpoint not responding
**Solution**:
1. Open browser console to see errors
2. Check network tab for failed requests
3. Verify backend is running

## 🎓 Development Tips

### Use the API Client
```typescript
// ❌ Don't do this
fetch('/api/v1/articles')

// ✅ Do this
import { apiRequest } from '@/lib/api';
apiRequest('/api/v1/articles')
```

### Handle Errors Properly
```tsx
// ✅ Good pattern
const [data, setData] = useState(null);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

async function loadData() {
  setLoading(true);
  setError(null);
  try {
    const result = await apiRequest('/endpoint');
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

// In JSX
{loading && <LoadingSpinner />}
{error && <ErrorDisplay error={error} onRetry={loadData} />}
{data && <DataDisplay data={data} />}
```

### Use Error Boundaries
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

## 📚 Documentation

For detailed technical documentation, see:
- **CONNECTION_RESILIENCE.md** - Complete technical guide
- **Frontend code**: `lib/api.ts`, `components/ErrorBoundary.tsx`
- **Backend code**: `app/main.py`, `app/core/config.py`

## ✨ Summary

Your SmartNews app is now **production-ready** with:
- 🛡️ **Crash-proof** - Never crashes on connection issues
- 🔄 **Auto-recovery** - Retries failed requests automatically
- 👥 **User-friendly** - Clear feedback and manual retry options
- 📊 **Observable** - Full logging and health monitoring
- ⚡ **Performant** - Optimized with circuit breakers and batching
- 🚀 **Scalable** - Ready for high traffic

**The connection will never crash - it will always fail gracefully!** 🎉
