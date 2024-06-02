import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackParamList } from '../navigation/types';
import { REGISTER_USER } from '../queries';
import { setUser } from '../reducers/userReducer';

const Register = () => {
  const [countryCode, setCountryCode] = useState('+');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<StackParamList>>();

  const [register, { data, loading, error }] = useMutation(REGISTER_USER, {
    awaitRefetchQueries: true,
    onError: error => {
      if (error.graphQLErrors) {
        const messages = error.graphQLErrors
          .map(({ message }) => message)
          .join('\n');
        console.error('GraphQL Errors:', messages);
      }
      if (error.networkError) {
        console.error('Network Error:', error.networkError);
      }
    },
    onCompleted: data => {
      console.log('Registration successful:', data);
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      AsyncStorage.setItem(
        'user',
        JSON.stringify({
          phoneNumber: fullPhoneNumber,
          fullName,
          callerId: data.register.callerId,
        }),
      );
      dispatch(
        setUser({
          phoneNumber: fullPhoneNumber,
          fullName,
          callerId: data.register.callerId,
        }),
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    },
  });

  const handleRegister = () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    register({
      variables: {
        phoneNumber: fullPhoneNumber,
        fullName,
      },
    });
  };

  const handleCountryCodeChange = text => {
    setCountryCode(text.startsWith('+') ? text : '+' + text);
  };

  const handlePhoneNumberChange = text => {
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
      {error && <Text>Error: {error.message}</Text>}
      <Button title="Register" onPress={handleRegister} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCodeInput: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
  },
  phoneNumberInput: {
    flex: 3,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
  },
});

export default Register;
