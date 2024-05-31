import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface CallState {
  localCallerId: string | null;
  remoteCallerId: string | null;
}

const initialState: CallState = {
  localCallerId: null,
  remoteCallerId: null,
};

const userSlice = createSlice({
  name: 'callerId',
  initialState,
  reducers: {
    generateCallerId: state => {
      state.localCallerId = Math.floor(
        10000 + Math.random() * 90000,
      ).toString();
    },
    setRemoteCallerId: (state, action: PayloadAction<CallState>) => {
      state.remoteCallerId = action.payload.remoteCallerId;
    },
  },
});

export const { generateCallerId } = userSlice.actions;
export default userSlice.reducer;
