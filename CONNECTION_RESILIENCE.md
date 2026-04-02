# Frontend-Backend Connection Resilience Guide

## Overview
This SmartNews application now includes a **robust connection architecture** designed to prevent crashes and handle network issues gracefully.

## 🔧 Backend Improvements

### 1. **Enhanced CORS Configuration** (`backend/app/main.py`)
- Specific allowed origins instead of wildcard `*`
- Proper credentials handling
- Better security for production deployment

### 2. **Error Handling Middleware**
- Automatic error catching and logging
- Process time tracking (X-Process-Time header)
- Graceful 500 error responses
- Debug mode support

### 3. **Enhanced Health Check** (`/health` endpoint)
```json
{
  "status": "ok",
  "service": "Global News Backend",
  "version": "2.0.0",
  "timestamp": "2026-02-06T12:00:00",
  "database": "connected"
}
```

### 4. **Configuration** (`backend/app/core/config.py`)
- `DEBUG`: Enable detailed error messages in development
- `REQUEST_TIMEOUT`: 30 seconds default timeout
- `MAX_CONNECTIONS`: Connection pool limit

## 🌐 Frontend Improvements

### 1. **Robust API Client** (`frontend/lib/api.ts`)

#### Features:
- **Automatic Retry with Exponential Backoff**: 3 retries by default
- **Request Timeout**: 10 seconds default, configurable
- **Circuit Breaker**: Stops requests after 5 consecutive failures
- **Health Monitoring**: Periodic backend health checks
- **Batch Request Support**: Prevents overwhelming the backend

#### Usage Examples:

```typescript
import { apiRequest, safeApiRequest, checkBackendHealth } from '@/lib/api';

// Standard request with retries and error handling
const data = await apiRequest('/api/v1/articles');

// Safe request that returns null instead of throwing
const data = await safeApiRequest('/api/v1/articles');

// Check backend health
const isHealthy = await checkBackendHealth();
```

### 2. **Error Boundary Component** (`frontend/components/ErrorBoundary.tsx`)

Catches React component errors and displays a user-friendly fallback:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 3. **Enhanced Configuration** (`frontend/lib/config.ts`)

Environment variables:
```env
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_REQUEST_TIMEOUT=10000
NEXT_PUBLIC_MAX_RETRIES=3
NEXT_PUBLIC_REVALIDATE_TIME=120
```

### 4. **Component Error Handling**

All data-fetching components now include:
- Loading states
- Error displays with retry buttons
- Graceful degradation

Example (Sidebar component):
```tsx
// Loading state
{isLoading && <LoadingSpinner />}

// Error state with retry
{error && <ApiErrorDisplay error={error} onRetry={loadData} />}

// Success state
{data && <DataDisplay data={data} />}
```

## 🛡️ Connection Resilience Features

### 1. **Retry Logic**
- Initial retry delay: 1 second
- Exponential backoff: delay × 2^attempt
- Max retries: 3 (configurable)
- Smart retry: Only retries server errors (5xx), not client errors (4xx)

### 2. **Timeout Handling**
- Request timeout: 10 seconds (frontend)
- Server timeout: 30 seconds (backend)
- Configurable per request

### 3. **Circuit Breaker Pattern**
- Tracks consecutive failures
- After 5 failures, marks backend as unhealthy
- Prevents unnecessary requests
- Auto-recovery after successful request

### 4. **Health Monitoring**
- Periodic health checks (every 30 seconds)
- Database connectivity verification
- Service status tracking

### 5. **Error Recovery**
- User-friendly error messages
- Retry buttons in UI
- Fallback content
- Graceful degradation

## 📊 Monitoring & Debugging

### Backend Logs
```bash
# View backend logs
tail -f backend/logs/app.log
```

### Frontend Debug Mode
Open browser console to see:
- API request attempts
- Retry information
- Health check status
- Configuration loaded

### Health Check
```bash
curl http://localhost:8000/health
```

## 🚀 Best Practices

### 1. **Always use the API client**
❌ Don't: `fetch(url)`
✅ Do: `apiRequest(endpoint)` or `safeApiRequest(endpoint)`

### 2. **Wrap components in Error Boundaries**
```tsx
<ErrorBoundary>
  <DataFetchingComponent />
</ErrorBoundary>
```

### 3. **Show loading and error states**
```tsx
{isLoading && <LoadingFallback />}
{error && <ApiErrorDisplay error={error} onRetry={retry} />}
{data && <Content data={data} />}
```

### 4. **Use safe requests for non-critical data**
```typescript
// Returns null on error instead of throwing
const stats = await safeApiRequest<Stats>('/news/stats');
if (stats) {
  // Use stats
}
```

### 5. **Batch requests to avoid overwhelming backend**
```typescript
import { batchRequests } from '@/lib/api';

const urls = ['/api/v1/articles', '/news/stats', '/news/quick-feed'];
const results = await batchRequests(urls, {}, 3); // 3 at a time
```

## 🔥 Production Deployment

### Backend Configuration
1. Set `DEBUG=false` in production
2. Configure specific CORS origins:
   ```python
   origins = [
       "https://yourapp.com",
       "https://www.yourapp.com"
   ]
   ```
3. Set proper `REQUEST_TIMEOUT` based on your needs
4. Enable error reporting/monitoring (Sentry, etc.)

### Frontend Configuration
1. Set production API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourapp.com
   ```
2. Adjust timeouts for production network:
   ```env
   NEXT_PUBLIC_REQUEST_TIMEOUT=15000
   ```
3. Enable error reporting:
   ```env
   NEXT_PUBLIC_ERROR_REPORTING=true
   ```

## 🧪 Testing Connection Resilience

### Test Scenarios:

1. **Backend Down**
   - Stop backend server
   - Frontend should show error message with retry button
   - Circuit breaker should activate after 5 failures

2. **Slow Network**
   - Use Chrome DevTools to throttle network
   - Requests should timeout appropriately
   - Retries should work

3. **Intermittent Failures**
   - Backend responds randomly
   - Retry logic should handle this

4. **Database Issues**
   - Stop database
   - Health check should report database disconnected
   - App should continue functioning where possible

## 📝 Summary

Your SmartNews application now has:
- ✅ Automatic retry with exponential backoff
- ✅ Request timeout handling
- ✅ Circuit breaker pattern
- ✅ Comprehensive error handling
- ✅ Health monitoring
- ✅ User-friendly error displays
- ✅ Loading states
- ✅ Graceful degradation
- ✅ Debug mode for development
- ✅ Production-ready configuration

The connection should never crash unexpectedly - it will always fail gracefully with proper user feedback!
