import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { generateCallerId } from '../reducers/callerIdReducer';
import { RootState } from '../store';
import { useSocket } from '../socket'; // Import useSocket
import { StackParamList } from '../navigation/types';

const CallMenu = () => {
  const [recipientId, setRecipientId] = useState('');
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const { localCallerId } = useSelector(
    (state: RootState) => state.callersInfo,
  );
  const dispatch = useDispatch();
  const socket = useSocket();

  useEffect(() => {
    dispatch(generateCallerId());
  }, [dispatch]);

  useEffect(() => {
    if (socket) {
      socket.on('newCall', ({ callerId }) => {
        console.log('Received new call from:', callerId);
        navigation.navigate('IncomingCall', { callerId });
      });

      return () => {
        socket.off('newCall');
      };
    }
  }, [socket, navigation]);

  const handleCall = () => {
    if (recipientId && socket) {
      socket.emit('call', { calleeId: recipientId });
      navigation.navigate('Calling', { recipientId });
    } else {
      alert('Please enter a valid recipient ID or check socket connection.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Caller ID</Text>
      <Text style={styles.callerId}>{localCallerId}</Text>
      <Text style={styles.subtitle}>Enter Recipient's Caller ID</Text>
      <TextInput
        style={styles.input}
        value={recipientId}
        onChangeText={setRecipientId}
        placeholder="Recipient's Caller ID"
        keyboardType="number-pad"
      />
      <TouchableOpacity style={styles.button} onPress={handleCall}>
        <Text style={styles.buttonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  callerId: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 20,
    borderRadius: 4,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CallMenu;
