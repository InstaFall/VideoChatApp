import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  phoneNumber: string | null;
  fullName: string | null;
}

const initialState: UserState = {
  phoneNumber: null,
  fullName: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ phoneNumber: string; fullName: string }>,
    ) => {
      state.phoneNumber = action.payload.phoneNumber;
      state.fullName = action.payload.fullName;
      // set the user again if name gets changed in the app
      AsyncStorage.setItem('user', JSON.stringify(action.payload));
    },
    loadUser: (state, action: PayloadAction<UserState>) => {
      state.phoneNumber = action.payload.phoneNumber;
      state.fullName = action.payload.fullName;
    },
    logout: state => {
      state.phoneNumber = null;
      state.fullName = null;
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
