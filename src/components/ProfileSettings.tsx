import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUser } from '../reducers/userReducer';
import Separator from './Separator';

const ProfileSettingsScreen = () => {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.fullName || '');

  const handleSaveName = () => {
    dispatch(setUser({ phoneNumber: user.phoneNumber, fullName: name }));
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      <View style={styles.profileContainer}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onBlur={handleSaveName}
            autoFocus
          />
        ) : (
          <Pressable onPress={() => setIsEditing(true)}>
            <Text style={styles.profileName}>{name || 'No Name'}</Text>
          </Pressable>
        )}
      </View>
      <Separator />
      <View style={styles.settingsContainer}>
        <Pressable style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Change Email</Text>
        </Pressable>
        <Pressable style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Privacy Settings</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  input: {
    fontSize: 18,
    padding: 8,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    padding: 8,
    color: '#000000',
    fontWeight: '900',
  },
  settingsContainer: {
    marginTop: 20,
  },
  settingButton: {
    paddingHorizontal: 8,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#0a3632',
  },
});

export default ProfileSettingsScreen;
