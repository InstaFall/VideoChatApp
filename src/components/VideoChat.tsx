import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const pc = useRef<RTCPeerConnection | null>(null);
  const socket = useSocket();
  const navigation = useNavigation<NavigationProp<StackParamList>>();

  useEffect(() => {
    const initializePeerConnection = () => {
      pc.current = new RTCPeerConnection(configuration);

      pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit('ICEcandidate', {
            calleeId: recipientId,
            rtcMessage: event.candidate,
          });
        }
      };

      pc.current.ontrack = (event: RTCTrackEvent) => {
        setRemoteStream(event.streams[0]);
      };
    };

    const startLocalStream = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        stream.getTracks().forEach(track => {
          pc.current?.addTrack(track, stream);
        });

        if (isCaller) {
          const offer = await pc.current?.createOffer({});
          await pc.current?.setLocalDescription(offer);
          socket.emit('call', {
            calleeId: recipientId,
            rtcMessage: offer,
          });
        }
      } catch (error) {
        console.error('Failed to get local stream', error);
      }
    };

    startLocalStream();
    initializePeerConnection();

    socket.on('ICEcandidate', ({ rtcMessage }) => {
      const candidate = new RTCIceCandidate(rtcMessage);
      pc.current?.addIceCandidate(candidate);
    });

    socket.on('callAnswered', ({ rtcMessage }) => {
      const description = new RTCSessionDescription(rtcMessage);
      pc.current?.setRemoteDescription(description);
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

      // If camera is to be disabled, stop the tracks
      if (cameraEnabled) {
        videoTracks.forEach(track => track.stop());
        setLocalStream(prevStream => {
          const newStream = new MediaStream(prevStream.getAudioTracks()); // keep audio tracks
          return newStream;
        });
      } else {
        // Camera is to be enabled, restart the video
        mediaDevices
          .getUserMedia({ video: true })
          .then(newStream => {
            newStream.getVideoTracks().forEach(track => {
              localStream.addTrack(track);
            });
            setLocalStream(prevStream => {
              const completeStream = new MediaStream([
                ...prevStream.getTracks(),
                ...newStream.getTracks(),
              ]);
              return completeStream;
            });
          })
          .catch(error => console.error('Failed to get video stream', error));
      }
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

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.video}
            mirror={cameraEnabled}
          />
        )}
        {remoteStream && (
          <RTCView streamURL={remoteStream.toURL()} style={styles.video} />
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          {cameraEnabled ? <VideoOn /> : <VideoOff />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleMicrophone}>
          {microphoneEnabled ? <MicOn /> : <MicOff />}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Text style={styles.endCallButtonText}>End Call</Text>
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
  videoContainer: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
  },
  video: {
    flex: 1,
    height: '30%',
    width: '100%',
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
    backgroundColor: '#FF5D5D',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '50%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default VideoChat;
