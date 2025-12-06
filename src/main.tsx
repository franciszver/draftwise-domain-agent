import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Amplify } from 'aws-amplify';
import { store } from './store';
import App from './App';
import './index.css';

// Configure Amplify - will be populated by amplify_outputs.json after deployment
const amplifyConfig = {
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || '',
      region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
      defaultAuthMode: 'apiKey' as const,
      apiKey: import.meta.env.VITE_GRAPHQL_API_KEY || '',
    },
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET || '',
      region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
    },
  },
};

// Only configure if we have real endpoints (production/sandbox)
if (amplifyConfig.API.GraphQL.endpoint) {
  Amplify.configure(amplifyConfig);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);


