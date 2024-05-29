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
import MessageEvent from 'react-native-webrtc/lib/typescript/MessageEvent';

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

const signalingServerUrl = 'ws://localhost:8080';

const VideoChatScreen = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const pc = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    startLocalStream();
  }, []);

  useEffect(() => {
    if (localStream) {
      initializePeerConnection();
    }
  }, [localStream]);

  useEffect(() => {
    ws.current = new WebSocket(signalingServerUrl);
    ws.current.onmessage = handleSignalingMessage;

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleSignalingMessage = async (message: MessageEvent) => {
    const data = JSON.parse(message.data);

    if (data.offer) {
      if (pc.current) {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        ws.current?.send(JSON.stringify({ answer }));
      }
    } else if (data.answer) {
      if (pc.current) {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
      }
    } else if (data.candidate) {
      if (pc.current) {
        await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  };

  const startLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Failed to get local stream', error);
    }
  };

  const initializePeerConnection = () => {
    if (pc.current) {
      return;
    }

    pc.current = new RTCPeerConnection(configuration);
    pc.current.onicecandidate = event => {
      if (event.candidate) {
        ws.current?.send(JSON.stringify({ candidate: event.candidate }));
      }
    };

    pc.current.ontrack = event => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.current?.addTrack(track, localStream);
      });
    }
  };

  const handleStartCall = async () => {
    if (!pc.current) {
      return;
    }

    try {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      ws.current?.send(JSON.stringify({ offer }));
    } catch (error) {
      console.error('Failed to start call', error);
    }
  };

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
            streamURL={cameraEnabled ? localStream.toURL() : ''}
            style={styles.video}
            mirror
          />
        )}
        {remoteStream && (
          <RTCView streamURL={remoteStream.toURL()} style={styles.video} />
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleStartCall}>
        <Text style={styles.buttonText}>Start Call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleEndCall}>
        <Text style={styles.buttonText}>End Call</Text>
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default VideoChatScreen;
