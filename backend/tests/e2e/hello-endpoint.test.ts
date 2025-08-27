import request from 'supertest';
import app from '../../src/app';

describe('E2E: Hello Endpoint User Journey', () => {
  let server: any;
  const TEST_PORT = 3001;

  beforeAll((done) => {
    // Start server for E2E testing
    server = app.listen(TEST_PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    // Clean up server after tests
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('User Journey: Simple API Consumer', () => {
    it('should successfully fetch hello message as an API consumer', async () => {
      // Test Steps:
      // 1. API consumer makes GET request to /api/hello
      // 2. Receives successful response with status 200
      // 3. Gets JSON response with Hello World message
      // 4. Can parse and use the message in their application

      const response = await request(app).get('/api/hello');
      
      // Verify complete user experience
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ message: 'Hello World' });
      
      // Simulate client-side usage
      const { message } = response.body;
      expect(message).toBe('Hello World');
      expect(typeof message).toBe('string');
    });

    it('should handle browser-based requests with CORS', async () => {
      // Test Steps:
      // 1. Simulate browser-based fetch request with origin header
      // 2. Verify CORS headers are present for cross-origin requests
      // 3. Check that browser clients can successfully consume API
      // 4. Ensure no CORS errors would occur

      const response = await request(app)
        .get('/api/hello')
        .set('Origin', 'http://localhost:3000')
        .set('Accept', 'application/json')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.body.message).toBe('Hello World');
    });

    it('should work for mobile app clients', async () => {
      // Test Steps:
      // 1. Simulate mobile app API request
      // 2. Verify JSON response is mobile-friendly
      // 3. Check response size is optimal for mobile
      // 4. Ensure consistent behavior across client types

      const response = await request(app)
        .get('/api/hello')
        .set('User-Agent', 'MobileApp/1.0 (iOS 15.0)')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello World' });
      
      // Check response is lightweight for mobile
      const responseSize = JSON.stringify(response.body).length;
      expect(responseSize).toBeLessThan(100); // Very small payload
    });
  });

  describe('Performance and Reliability', () => {
    it('should respond quickly to requests', async () => {
      // Test Steps:
      // 1. Measure response time for the endpoint
      // 2. Verify response is within acceptable limits
      // 3. Check that no heavy processing delays response
      // 4. Ensure good user experience with fast responses

      const startTime = Date.now();
      const response = await request(app).get('/api/hello');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Should respond in less than 100ms
      expect(response.body.message).toBe('Hello World');
    });

    it('should handle multiple concurrent requests', async () => {
      // Test Steps:
      // 1. Send multiple requests simultaneously
      // 2. Verify all requests receive correct responses
      // 3. Check that server handles concurrency properly
      // 4. Ensure no race conditions or errors

      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/hello')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Hello World' });
      });
      
      // All responses should be identical
      const uniqueResponses = new Set(responses.map(r => JSON.stringify(r.body)));
      expect(uniqueResponses.size).toBe(1);
    });

    it('should maintain consistent response across server lifecycle', async () => {
      // Test Steps:
      // 1. Make initial request to endpoint
      // 2. Simulate time passing (server running for a while)
      // 3. Make another request
      // 4. Verify response remains consistent

      const response1 = await request(app).get('/api/hello');
      
      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response2 = await request(app).get('/api/hello');
      
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual({ message: 'Hello World' });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed URLs gracefully', async () => {
      // Test Steps:
      // 1. Send request to similar but wrong endpoints
      // 2. Verify proper 404 handling
      // 3. Check that typos don't crash server
      // 4. Ensure good error messages

      const wrongEndpoints = [
        '/api/helo',     // Typo
        '/api/hello/',   // Trailing slash
        '/api/Hello',    // Wrong case
        '/api//hello',   // Double slash
      ];
      
      for (const endpoint of wrongEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should reject requests with wrong content type in POST', async () => {
      // Test Steps:
      // 1. Attempt POST with various content types
      // 2. Verify all POST attempts are rejected
      // 3. Check proper error handling
      // 4. Ensure endpoint is GET-only

      const response1 = await request(app)
        .post('/api/hello')
        .set('Content-Type', 'application/xml')
        .send('<message>test</message>');
      
      const response2 = await request(app)
        .post('/api/hello')
        .set('Content-Type', 'text/plain')
        .send('Hello');
      
      expect([404, 405]).toContain(response1.status);
      expect([404, 405]).toContain(response2.status);
    });
  });

  describe('Integration with Other Endpoints', () => {
    it('should coexist with health endpoint', async () => {
      // Test Steps:
      // 1. Verify both /api/health and /api/hello work
      // 2. Check that adding hello doesn't break existing endpoints
      // 3. Ensure proper routing configuration
      // 4. Verify no route conflicts

      const healthResponse = await request(app).get('/api/health');
      const helloResponse = await request(app).get('/api/hello');
      
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('status', 'healthy');
      
      expect(helloResponse.status).toBe(200);
      expect(helloResponse.body).toEqual({ message: 'Hello World' });
    });

    it('should follow same patterns as other API endpoints', async () => {
      // Test Steps:
      // 1. Compare hello endpoint behavior with existing endpoints
      // 2. Verify consistent error handling
      // 3. Check similar response structures
      // 4. Ensure architectural consistency

      const helloResponse = await request(app).get('/api/hello');
      const productsResponse = await request(app).get('/api/products');
      
      // Both should return JSON
      expect(helloResponse.headers['content-type']).toMatch(/application\/json/);
      expect(productsResponse.headers['content-type']).toMatch(/application\/json/);
      
      // Both should have proper status codes
      expect([200, 404]).toContain(helloResponse.status);
      expect([200, 404, 500]).toContain(productsResponse.status);
    });
  });

  describe('Documentation and Discoverability', () => {
    it('should be a valid REST endpoint', async () => {
      // Test Steps:
      // 1. Verify endpoint follows REST conventions
      // 2. Check that GET is idempotent
      // 3. Ensure stateless operation
      // 4. Validate RESTful design

      // Make multiple requests to verify idempotency
      const response1 = await request(app).get('/api/hello');
      const response2 = await request(app).get('/api/hello');
      const response3 = await request(app).get('/api/hello');
      
      // All responses should be identical (idempotent)
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual(response3.body);
      expect(response1.status).toBe(response2.status);
      expect(response2.status).toBe(response3.status);
    });

    it('should provide predictable API behavior', async () => {
      // Test Steps:
      // 1. Verify endpoint behavior matches documentation
      // 2. Check that response format is as specified
      // 3. Ensure no hidden parameters or requirements
      // 4. Validate against API contract

      const response = await request(app).get('/api/hello');
      
      // Exact match to specification
      expect(response.body).toEqual({ message: 'Hello World' });
      
      // No extra fields
      expect(Object.keys(response.body)).toEqual(['message']);
      
      // Correct value
      expect(response.body.message).toBe('Hello World');
    });
  });
});