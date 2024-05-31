import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import AppNavigator from './navigation/AppNavigator';
import { SocketProvider } from './socket';

const App = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <AppNavigator />
      </SocketProvider>
    </Provider>
  );
};

export default App;
