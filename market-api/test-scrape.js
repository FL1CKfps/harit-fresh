const { default: handler } = require('./pages/api/market');
const httpMocks = require('node-mocks-http');

(async () => {
  // Create a mock request and response
  const req = httpMocks.createRequest({
    method: 'GET',
    query: { commodity: 'Rice', state: 'Delhi', market: 'Delhi' }
  });
  const res = httpMocks.createResponse();

  await handler(req, res);

  const status = res._getStatusCode();
  const data = res._getData();

  console.log('Status:', status);
  try {
    console.log('Body:', JSON.parse(data));
  } catch (e) {
    console.log('Body (raw):', data);
  }
})();
