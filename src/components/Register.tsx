import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../reducers/userReducer';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Register = () => {
  const [countryCode, setCountryCode] = useState('+');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<StackParamList>>();

  const handleRegister = async () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    await AsyncStorage.setItem(
      'user',
      JSON.stringify({ phoneNumber: fullPhoneNumber, fullName }),
    );
    dispatch(setUser({ phoneNumber: fullPhoneNumber, fullName }));
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleCountryCodeChange = (text: string) => {
    if (text.startsWith('+')) {
      setCountryCode(text);
    } else {
      setCountryCode('+' + text);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const sanitizedText = text.replace(/[^0-9]/g, '');
    if (sanitizedText.length <= 10) {
      setPhoneNumber(sanitizedText);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to VideoChatApp</Text>
      <Text>Please enter your full name and phone number to register:</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full Name"
      />
      <View style={styles.phoneContainer}>
        <TextInput
          style={styles.countryCodeInput}
          value={countryCode}
          onChangeText={handleCountryCodeChange}
          placeholder="+"
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.phoneNumberInput}
          value={phoneNumber}
          onChangeText={handlePhoneNumberChange}
          placeholder="Phone Number"
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countryCodeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    width: 80,
    marginRight: 8,
  },
  phoneNumberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
});

export default Register;
