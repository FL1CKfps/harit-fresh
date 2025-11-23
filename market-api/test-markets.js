const { default: handler } = require('./pages/api/markets');
const httpMocks = require('node-mocks-http');

(async () => {
  const req = httpMocks.createRequest({ method: 'GET', query: { state: 'Delhi' } });
  const res = httpMocks.createResponse();
  await handler(req, res);
  console.log('Status:', res._getStatusCode());
  console.log('Body:', res._getData());
})();
