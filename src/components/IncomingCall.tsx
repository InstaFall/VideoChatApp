import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CallAnswer from '../../asset/CallAnswer';
import CallEnd from '../../asset/CallEnd';
import {
  NavigationProp,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import { StackParamList } from '../navigation/types';
import { useSocket } from '../socket';

interface IncomingCallScreenProps {
  route: RouteProp<StackParamList, 'IncomingCall'>;
}

const IncomingCall: React.FC<IncomingCallScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const { callerId } = route.params;

  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      const handleCallEnded = () => {
        console.log('Call ended by the other party');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }, { name: 'CallMenu' }],
        });
      };

      socket.on('callEnded', handleCallEnded);

      return () => {
        socket.off('callEnded', handleCallEnded);
      };
    }
  }, [socket, navigation]);

  const handleAcceptCall = () => {
    socket.emit('answerCall', { callerId });
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'VideoChat',
          params: {
            isCaller: false,
            recipientId: callerId,
          },
        },
      ],
    });
  };

  const handleRejectCall = () => {
    socket.emit('endCall');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }, { name: 'CallMenu' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.callingText}>{callerId} is calling...</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleAcceptCall}
          style={styles.answerCallButton}>
          <CallAnswer width={50} height={50} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRejectCall}
          style={styles.endCallButton}>
          <CallEnd width={50} height={50} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#050A0E',
  },
  infoContainer: {
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  callingText: {
    fontSize: 24,
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  answerCallButton: {
    backgroundColor: 'green',
    borderRadius: 30,
    height: 60,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF5D5D',
    borderRadius: 30,
    height: 60,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IncomingCall;
