import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import AppNavigator from './navigation/AppNavigator';
import { SocketProvider } from './socket';
import client from './apolloClient';
import { ApolloProvider } from '@apollo/client';

const App = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <ApolloProvider client={client}>
          <AppNavigator />
        </ApolloProvider>
      </SocketProvider>
    </Provider>
  );
};

export default App;
