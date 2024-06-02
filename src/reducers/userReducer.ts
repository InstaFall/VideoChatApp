import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  phoneNumber: string | null;
  fullName: string | null;
  callerId: string | null;  // Added callerId to the user state
}

const initialState: UserState = {
  phoneNumber: null,
  fullName: null,
  callerId: null,  // Initialize callerId as null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ phoneNumber: string; fullName: string; callerId: string }>,
    ) => {
      state.phoneNumber = action.payload.phoneNumber;
      state.fullName = action.payload.fullName;
      state.callerId = action.payload.callerId;
      
      AsyncStorage.setItem('user', JSON.stringify({
        phoneNumber: action.payload.phoneNumber,
        fullName: action.payload.fullName,
        callerId: action.payload.callerId,
      }));
    },
    loadUser: (state, action) => {
      AsyncStorage.getItem('user', )
      state.phoneNumber = action.payload.phoneNumber;
      state.fullName = action.payload.fullName;
      state.callerId = action.payload.callerId; 
    },
    logout: state => {
      state.phoneNumber = null;
      state.fullName = null;
      state.callerId = null;  
      (async () => {
        try {
          await AsyncStorage.removeItem('user');
        } catch (error) {
          console.error('Failed to remove user data:', error);
        }
      })();
    },
  },
});

export const { setUser, loadUser, logout } = userSlice.actions;
export default userSlice.reducer;
