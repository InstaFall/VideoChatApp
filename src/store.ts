import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/userReducer';
import callerIdReducer from './reducers/callerIdReducer';

const store = configureStore({
  reducer: {
    user: userReducer,
    callersInfo: callerIdReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
