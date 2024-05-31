export type StackParamList = {
  Main: undefined;
  Register: undefined;
  Home: undefined;
  CallMenu: undefined;
  Calling: { recipientId: string };
  IncomingCall: { callerId: string };
  VideoChat: { isCaller: boolean; recipientId: string };
  ProfileSettings: undefined;
  AppSettings: undefined;
  DebugVideoChat: { isCaller: boolean; recipientId: string };
};
