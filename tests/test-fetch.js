// Legacy ad-hoc manual verification script for AWS API Gateway endpoint
// Usage: node tests/test-fetch.js (requires Node.js environment)
const endpoint = process.env.AWS_API_ENDPOINT || 'https://7ee6gxhkc3.execute-api.us-east-1.amazonaws.com/latest';

console.log(`Testing endpoint: ${endpoint}`);
fetch(endpoint)
  .then(r => r.text().then(t => console.log(`Response Status: ${r.status}\nBody: ${t}`)))
  .catch(err => console.error(`Fetch error: ${err.message}`));
