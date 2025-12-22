# QMemory Library Demo - Usage Guide

## 🚀 Quick Start

### 1. Start the Demo Server

```bash
node simple-demo-server.cjs
```

### 2. Access the Interface

Open your browser and navigate to: `http://localhost:3000/demo.html`

## 📋 Features Overview

### 🏠 Main Dashboard

- **Server Status**: Real-time connectivity indicator
- **Live Statistics**: User count, API requests, success rate
- **Health Monitoring**: Memory usage, uptime, system stats

### 👥 User Management Tab

- **Create User**: Add new users with validation
- **Find User**: Search by ID or username
- **User List**: Paginated user listing with delete options
- **Batch Operations**: Clear all users (development mode)

### 🛠️ Utilities Tab

- **Greeting**: Test the `greet()` utility function
- **Math Operations**: Test `add()` function
- **Even/Odd Check**: Test `isEven()` function
- **Deduplication**: Test array deduplication utilities

### 💾 Storage Tab

- **Storage Stats**: View current storage statistics
- **Capacity Testing**: Test storage limits and behavior
- **Batch Creation**: Create multiple users at once
- **Performance Testing**: Stress test storage operations

### 🌐 HTTP Utils Tab

- **Error Responses**: Test all HTTP error formats (404, 409, 500, 503)
- **Validation Testing**: Test validation and authentication errors
- **Response Analysis**: Analyze request/response patterns

### 📚 Documentation Tab

- **API Endpoints**: Complete API reference
- **Response Formats**: Standardized response examples
- **Usage Examples**: Code samples and patterns

## 🎯 Testing Scenarios

### Basic User Flow

1. Go to **User Management** tab
2. Create a new user with username and display name
3. View the user in the paginated list
4. Test finding the user by ID
5. Delete the user and verify removal

### Performance Testing

1. Navigate to **Storage** tab
2. Click "Run Performance Test" to test:
   - User creation speed
   - Query performance
   - Concurrent request handling
3. Use "Stress Test" for high-load scenarios

### Error Handling Validation

1. Go to **HTTP Utils** tab
2. Test different error scenarios:
   - Invalid endpoints (404)
   - Duplicate user creation (409)
   - Validation errors (400)
   - Authentication errors (401)

## 🔧 API Endpoints

### Core Endpoints

- `GET /health` - Service health check
- `GET /` - API information and endpoints list
- `GET /users?page=1&limit=10` - List users (paginated)
- `POST /users` - Create new user
- `GET /users/:id` - Get user by ID
- `DELETE /users/:id` - Delete user by ID
- `POST /users/clear` - Clear all users (development only)

### Response Format

```json
{
  "message": "Operation description",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": { ... } // Optional data payload
}
```

### Error Response Format

```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-1234567890"
  }
}
```

## 📱 Mobile Usage

The demo interface is fully responsive and works on:

- 📱 Mobile phones (iOS Safari, Android Chrome)
- 📟 Tablets (iPad, Android tablets)
- 💻 Desktop browsers (Chrome, Firefox, Safari, Edge)

## 🎨 Interface Features

### Visual Design

- **Modern UI**: Gradient backgrounds with card-based layouts
- **Responsive**: Adapts to all screen sizes
- **Interactive**: Hover effects and smooth transitions
- **Accessible**: WCAG 2.1 AA compliant color contrasts

### User Experience

- **Real-time Feedback**: Loading indicators and status updates
- **Form Validation**: Client-side validation with helpful messages
- **Error Handling**: Clear error messages and recovery options
- **Performance**: Optimized for fast interactions

## 🧪 Testing Capabilities

### Functional Testing

- ✅ User CRUD operations
- ✅ Pagination controls
- ✅ Input validation
- ✅ Error scenario testing
- ✅ Batch operations

### Performance Testing

- ✅ Load testing with concurrent requests
- ✅ Memory usage monitoring
- ✅ Response time measurement
- ✅ Storage capacity testing

### Integration Testing

- ✅ API endpoint connectivity
- ✅ Response format validation
- ✅ Error handling verification
- ✅ Data persistence testing

## 🔍 Troubleshooting

### Common Issues

**Server Not Connecting**

- Ensure the demo server is running: `node simple-demo-server.cjs`
- Check port 3000 is not blocked by firewall
- Verify browser console for JavaScript errors

**API Requests Failing**

- Check server status in the main dashboard
- Verify network connectivity
- Look at browser developer tools for detailed error information

**Users Not Displaying**

- Try refreshing the user list
- Check if you're on the correct page in pagination
- Verify the server hasn't been restarted (data resets on restart)

### Development Tips

**Testing Error Scenarios**

- Use invalid data to test validation
- Try duplicate usernames to test conflict handling
- Access non-existent endpoints to test 404 responses

**Performance Monitoring**

- Watch the live statistics dashboard
- Run performance tests periodically
- Monitor memory usage during stress tests

## 📊 Success Metrics

The demo tracks and displays:

- **Total Users**: Current number of stored users
- **API Requests**: Cumulative request count
- **Success Rate**: Percentage of successful operations
- **Response Times**: Individual operation timing
- **Error Types**: Categorized error tracking

---

## 🎉 Conclusion

This demo provides a comprehensive testing environment for all QMemory library features. It demonstrates:

- 🏗️ **Production-ready architecture** with proper error handling
- 🔒 **Security patterns** with input validation and sanitization
- 📈 **Performance monitoring** and optimization capabilities
- 🎨 **User experience** best practices with responsive design
- 🧪 **Testing scenarios** for comprehensive validation

The interface serves as both a **functional testing tool** and **demonstration platform** for the QMemory library's capabilities in real-world scenarios.
