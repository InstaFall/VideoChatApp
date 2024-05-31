import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Register from '../components/Register';
import HomeScreen from '../components/Home';
import VideoChat from '../components/VideoChat';
import Main from '../components/Main';
import ProfileSettingsScreen from '../components/ProfileSettings';
import AppSettingsScreen from '../components/AppSettingsScreen';
import CallMenu from '../components/CallMenu';
import Calling from '../components/Calling';
import IncomingCall from '../components/IncomingCall';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={Main}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="CallMenu" component={CallMenu} />
        <Stack.Screen name="Calling" component={Calling} />
        <Stack.Screen name="IncomingCall" component={IncomingCall} />
        <Stack.Screen name="VideoChat" component={VideoChat} />
        <Stack.Screen
          name="ProfileSettings"
          component={ProfileSettingsScreen}
        />
        <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
