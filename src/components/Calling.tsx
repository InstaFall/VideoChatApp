import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CallEnd from '../../asset/CallEnd'; // Adjust the import path as necessary
import {
  NavigationProp,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import { StackParamList } from '../navigation/types';
import { useSocket } from '../socket';

interface CallingProps {
  route: RouteProp<StackParamList, 'Calling'>;
}

const Calling: React.FC<CallingProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const { recipientId } = route.params;
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('callAnswered', () => {
        navigation.navigate('VideoChat', { isCaller: true, recipientId });
      });

      socket.on('callEnded', () => {
        navigation.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: 'CallMenu' }],
        });
      });

      return () => {
        socket.off('callAnswered');
      };
    }
  }, [socket, navigation, recipientId]);

  const handleEndCall = () => {
    if (socket) {
      socket.emit('endCall');
      console.log('Ending call...');
    }
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'CallMenu' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.callingText}>Calling to...</Text>
        <Text style={styles.recipientId}>{recipientId}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleEndCall} style={styles.endCallButton}>
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
    fontSize: 16,
    color: '#D0D4DD',
  },
  recipientId: {
    fontSize: 36,
    marginTop: 12,
    color: '#ffff',
    letterSpacing: 6,
  },
  buttonContainer: {
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

export default Calling;
