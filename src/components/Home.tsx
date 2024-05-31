import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { StackParamList } from '../navigation/types';

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const user = useSelector((state: RootState) => state.user);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('ProfileSettings')}>
        <Text style={styles.profileButtonText}>Profile</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Hello, {user.fullName}!</Text>
      <TouchableOpacity
        style={styles.videoChatButton}
        onPress={() => navigation.navigate('CallMenu')}>
        <Text style={styles.buttonText}>Start Video Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('AppSettings')}>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 50,
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  videoChatButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 25,
    borderRadius: 300,
    marginVertical: 10,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 10,
    marginVertical: 20,
    width: '40%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default HomeScreen;
