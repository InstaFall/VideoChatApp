import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCView,
  MediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import { useSocket } from '../socket';
import { StackParamList } from '../navigation/types';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import VideoOn from '../../asset/VideoOn';
import VideoOff from '../../asset/VideoOff';
import MicOn from '../../asset/MicOn';
import MicOff from '../../asset/MicOff';
import CallEnd from '../../asset/CallEnd';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
  }
}

const fetchIceServers = async () => {
  const response = await fetch(
    'https://trkcllturn.metered.live/api/v1/turn/credentials?apiKey=87275a8c14f93aef84d24ca0c2826862484f',
  );
  return await response.json();
};

interface VideoChatProps {
  route: RouteProp<StackParamList, 'VideoChat'>;
}

const VideoChat: React.FC<VideoChatProps> = ({ route }) => {
  const { isCaller, recipientId } = route.params;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [buttonVisible, setButtonVisible] = useState(false);

  const endCallButtonPosition = useRef(new Animated.Value(100)).current;
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const socket = useSocket();
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const iceCandidates = useRef<any[]>([]);

  useEffect(() => {
    async function setupMedia() {
      await requestPermissions();
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    }

    setupMedia();
  }, []);

  useEffect(() => {
    const initializePeerConnection = async () => {
      const iceServers = await fetchIceServers();
      pc.current = new RTCPeerConnection({ iceServers: iceServers });

      pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit('ICEcandidate', {
            calleeId: recipientId,
            rtcMessage: event.candidate,
          });
        }
      };

      pc.current.ontrack = event => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          const remoteStream = new MediaStream([event.track]);
          setRemoteStream(remoteStream);
        }
      };

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      stream.getTracks().forEach(track => {
        pc.current?.addTrack(track, stream);
      });

      if (isCaller) {
        const offer = await pc.current?.createOffer();
        await pc.current?.setLocalDescription(offer);
        socket.emit('call', {
          calleeId: recipientId,
          rtcMessage: offer,
        });
      }
    };

    initializePeerConnection();

    socket.on('newCall', async data => {
      const rtcMessage = data.rtcMessage;
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(rtcMessage),
      );
      const answer = await pc.current?.createAnswer();
      await pc.current?.setLocalDescription(answer);
      socket.emit('answerCall', {
        callerId: data.callerId,
        rtcMessage: answer,
      });

      iceCandidates.current.forEach(async candidate => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidates.current = [];
    });

    socket.on('ICEcandidate', async data => {
      const rtcMessage = data.rtcMessage;
      if (pc.current?.remoteDescription) {
        await pc.current?.addIceCandidate(new RTCIceCandidate(rtcMessage));
      } else {
        iceCandidates.current.push(rtcMessage);
      }
    });

    socket.on('callAnswered', async data => {
      const rtcMessage = data.rtcMessage;
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(rtcMessage),
      );

      iceCandidates.current.forEach(async candidate => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidates.current = [];
    });

    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };
  }, [isCaller, recipientId, socket]);

  // Handle end call basically copy endCall from Calling and IncomingCall
  useEffect(() => {
    const handleCallEnded = () => {
      console.log('Call Ended');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    };

    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket, navigation]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !cameraEnabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMicrophone = () => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !microphoneEnabled;
    });
    setMicrophoneEnabled(!microphoneEnabled);
  };

  const handleEndCall = () => {
    socket.emit('endCall');
    pc.current?.close();
  };

  const toggleButtonVisibility = () => {
    if (!buttonVisible) {
      setButtonVisible(true);
      Animated.timing(endCallButtonPosition, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Set a timeout to automatically hide the button after 3 seconds
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      visibilityTimeoutRef.current = setTimeout(() => {
        Animated.timing(endCallButtonPosition, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setButtonVisible(false);
      }, 3000); // Adjust the timeout as needed
    } else {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      Animated.timing(endCallButtonPosition, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setButtonVisible(false));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={toggleButtonVisibility}>
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          {localStream && (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.video}
              mirror={cameraEnabled}
            />
          )}
          {remoteStream ? (
            <RTCView streamURL={remoteStream.toURL()} style={styles.video} />
          ) : (
            <ActivityIndicator
              size="large"
              style={{ height: '45%', transform: [{ scale: 1.5 }] }}
            />
          )}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={toggleCamera}>
            {cameraEnabled ? (
              <VideoOn width={24} height={23} />
            ) : (
              <VideoOff width={44} height={35} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleMicrophone}>
            {microphoneEnabled ? (
              <MicOn width={24} height={24} />
            ) : (
              <MicOff width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.endCallButton,
            {
              transform: [{ translateY: endCallButtonPosition }],
            },
          ]}>
          <TouchableOpacity onPress={handleEndCall}>
            <CallEnd width={30} height={30} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    marginVertical: 10,
    backgroundColor: '#5d5e5e',
  },
  buttonRow: {
    height: 45,
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endCallButton: {
    position: 'absolute',
    backgroundColor: '#FF5D5D',
    borderRadius: 10,
    width: '20%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    bottom: 10,
  },
});

export default VideoChat;
