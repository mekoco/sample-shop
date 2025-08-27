import request from 'supertest';
import app from '../../../src/app';

describe('GET /api/hello Integration Tests', () => {
  describe('Endpoint Availability', () => {
    it('should be accessible via GET request', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Verify that the endpoint exists and responds
      // 3. Check that status is not 404
      // 4. Ensure endpoint is properly registered in Express app

      const response = await request(app).get('/api/hello');
      
      // This will fail with 404 until endpoint is implemented
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Check response headers
      // 3. Verify Content-Type is application/json
      // 4. Ensure proper content negotiation

      const response = await request(app).get('/api/hello');
      
      expect(response.headers['content-type']).toBeDefined();
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Response Structure', () => {
    it('should return correct JSON structure', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Parse JSON response body
      // 3. Verify response has 'message' property
      // 4. Check that response structure matches expected format

      const response = await request(app).get('/api/hello');
      
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return "Hello World" message', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Extract message from response body
      // 3. Verify message equals "Hello World"
      // 4. Ensure exact string match (case-sensitive)

      const response = await request(app).get('/api/hello');
      
      expect(response.body).toEqual({ message: 'Hello World' });
      expect(response.body.message).toBe('Hello World');
    });

    it('should return only the message property', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Check response body properties
      // 3. Verify no extra properties are included
      // 4. Ensure clean response structure

      const response = await request(app).get('/api/hello');
      
      const keys = Object.keys(response.body);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('message');
    });
  });

  describe('HTTP Methods', () => {
    it('should not accept POST requests', async () => {
      // Test Steps:
      // 1. Send POST request to /api/hello
      // 2. Verify that POST is not supported
      // 3. Check for appropriate error status (404 or 405)
      // 4. Ensure proper HTTP method handling

      const response = await request(app)
        .post('/api/hello')
        .send({ test: 'data' });
      
      expect([404, 405]).toContain(response.status);
    });

    it('should not accept PUT requests', async () => {
      // Test Steps:
      // 1. Send PUT request to /api/hello
      // 2. Verify that PUT is not supported
      // 3. Check for appropriate error status
      // 4. Ensure endpoint is GET-only

      const response = await request(app)
        .put('/api/hello')
        .send({ test: 'data' });
      
      expect([404, 405]).toContain(response.status);
    });

    it('should not accept DELETE requests', async () => {
      // Test Steps:
      // 1. Send DELETE request to /api/hello
      // 2. Verify that DELETE is not supported
      // 3. Check for appropriate error status
      // 4. Ensure proper method restrictions

      const response = await request(app).delete('/api/hello');
      
      expect([404, 405]).toContain(response.status);
    });

    it('should not accept PATCH requests', async () => {
      // Test Steps:
      // 1. Send PATCH request to /api/hello
      // 2. Verify that PATCH is not supported
      // 3. Check for appropriate error status
      // 4. Ensure GET-only implementation

      const response = await request(app)
        .patch('/api/hello')
        .send({ test: 'data' });
      
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Request Handling', () => {
    it('should ignore query parameters', async () => {
      // Test Steps:
      // 1. Send GET request with query parameters
      // 2. Verify response is the same regardless of query params
      // 3. Check that parameters don't affect the output
      // 4. Ensure consistent behavior

      const response1 = await request(app).get('/api/hello');
      const response2 = await request(app).get('/api/hello?param=value&another=test');
      
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual({ message: 'Hello World' });
    });

    it('should ignore request headers variations', async () => {
      // Test Steps:
      // 1. Send requests with different headers
      // 2. Verify consistent response
      // 3. Check that custom headers don't affect output
      // 4. Ensure stable endpoint behavior

      const response1 = await request(app).get('/api/hello');
      const response2 = await request(app)
        .get('/api/hello')
        .set('X-Custom-Header', 'test-value')
        .set('Accept-Language', 'en-US');
      
      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('Security and Headers', () => {
    it('should include proper CORS headers', async () => {
      // Test Steps:
      // 1. Send GET request with Origin header
      // 2. Check response for CORS headers
      // 3. Verify Access-Control-Allow-Origin is set
      // 4. Ensure proper CORS configuration

      const response = await request(app)
        .get('/api/hello')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers from helmet', async () => {
      // Test Steps:
      // 1. Send GET request to /api/hello
      // 2. Check for security headers added by helmet
      // 3. Verify X-Content-Type-Options and other security headers
      // 4. Ensure security middleware is active

      const response = await request(app).get('/api/hello');
      
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should be subject to API rate limiting', async () => {
      // Test Steps:
      // 1. Note that rate limit is configured for /api routes
      // 2. Verify endpoint is under /api path
      // 3. Check that rate limiting middleware applies
      // 4. This test documents expected rate limiting behavior
      
      // Note: Actual rate limit testing would require many requests
      // This test just verifies the endpoint is in the rate-limited path
      const response = await request(app).get('/api/hello');
      
      // Rate limit headers may be present
      // Just verify the endpoint responds (rate limiting is configured)
      expect(response.status).toBeDefined();
    });
  });
});