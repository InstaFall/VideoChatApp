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
import { useSocket } from '../socket'; // Import the socket instance from context
import { StackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ],
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
  const socket = useSocket(); // Use the socket from context

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

    socket.on('newCall', async ({ rtcMessage }) => {
      const description = new RTCSessionDescription(rtcMessage);
      await pc.current?.setRemoteDescription(description);
      const answer = await pc.current?.createAnswer();
      await pc.current?.setLocalDescription(answer);
      socket.emit('answerCall', {
        callerId: recipientId,
        rtcMessage: answer,
      });
    });

    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };
  }, [isCaller, recipientId, socket]);

  const handleEndCall = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !cameraEnabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMicrophone = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !microphoneEnabled;
      });
      setMicrophoneEnabled(!microphoneEnabled);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Chat</Text>
      <View style={styles.videoContainer}>
        {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.video}
            mirror
          />
        )}
        {remoteStream && (
          <RTCView streamURL={remoteStream.toURL()} style={styles.video} />
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>
            {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleMicrophone}>
          <Text style={styles.buttonText}>
            {microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          </Text>
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#ccc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  endCallButton: {
    backgroundColor: '#FF5D5D',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
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
