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

// const configuration = {
//   iceServers: [
//     { urls: 'stun:stun.l.google.com:19302' },
//     { urls: 'stun:stun1.l.google.com:19302' },
//     {
//       urls: 'turn:numb.viagenie.ca',
//       credential: 'muazkh',
//       username: 'webrtc@live.com',
//     },
//   ],
// };

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
  const iceCandidates = useRef<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const iceServers = await fetchIceServers();
      pc.current = new RTCPeerConnection({ iceServers: iceServers });

      pc.current.onicecandidate = event => {
        if (event.candidate) {
          //console.log('Sending ICE candidate:', event.candidate);
          socket.emit('ICEcandidate', {
            calleeId: recipientId,
            rtcMessage: JSON.stringify(event.candidate),
          });
        }
      };

      pc.current.ontrack = event => {
        console.log('Received remote track:', event.track);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          // console.log(
          //   'Remote stream set from ontrack event.streams[0]',
          //   event.streams[0],
          // );
        } else {
          const remoteStream = new MediaStream([event.track]);
          setRemoteStream(remoteStream);
          console.log(
            'Remote stream set from new MediaStream([event.track])',
            remoteStream,
          );
        }
      };

      pc.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.current?.iceConnectionState);
        if (pc.current?.iceConnectionState === 'failed') {
          console.log('ICE connection failed, TURN server might be needed.');
        }
      };

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      stream.getTracks().forEach(track => {
        //console.log('Adding local track:', track);
        pc.current?.addTrack(track, stream);
      });

      if (isCaller) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        //console.log('Sending offer:', offer);
        socket.emit('call', {
          calleeId: recipientId,
          rtcMessage: JSON.stringify(offer),
        });
      }
    };

    init();

    socket.on('newCall', async data => {
      //console.log('Received new call:', data);
      const rtcMessage = JSON.parse(data.rtcMessage);
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(rtcMessage),
      );
      //console.log('Local SDP Offer:', pc.current.localDescription?.sdp);
      //console.log('Remote SDP Answer:', pc.current.remoteDescription?.sdp);
      const answer = await pc.current?.createAnswer();
      await pc.current?.setLocalDescription(answer);
      //console.log('Sending answer:', answer);
      socket.emit('answerCall', {
        callerId: data.callerId,
        rtcMessage: JSON.stringify(answer),
      });

      // Process any stored ICE candidates
      iceCandidates.current.forEach(async candidate => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidates.current = [];
    });

    socket.on('callAnswered', async data => {
      //console.log('Call answered:', data);
      const rtcMessage = JSON.parse(data.rtcMessage);
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(rtcMessage),
      );
      //console.log('Local SDP Offer:', pc.current.localDescription?.sdp);
      //console.log('Remote SDP Answer:', pc.current.remoteDescription?.sdp);

      // Process any stored ICE candidates
      iceCandidates.current.forEach(async candidate => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidates.current = [];
    });

    socket.on('ICEcandidate', async data => {
      console.log('Received ICE candidate:', data);
      const rtcMessage = JSON.parse(data.rtcMessage);
      if (pc.current?.remoteDescription) {
        await pc.current?.addIceCandidate(new RTCIceCandidate(rtcMessage));
      } else {
        iceCandidates.current.push(rtcMessage);
      }
    });

    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };
  }, [isCaller, recipientId, socket]);

  useEffect(() => {
    socket.on('callEnded', () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });

    return () => {
      socket.off('callEnded');
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
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.video} />
        ) : (
          <Text>Waiting for remote stream...</Text>
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
