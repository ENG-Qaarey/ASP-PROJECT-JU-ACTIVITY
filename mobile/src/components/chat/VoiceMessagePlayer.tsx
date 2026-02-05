import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Pause, Play, Mic } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getAvatarUrl } from '@/src/lib/media';
import { IMAGE_BASE } from '@/src/lib/config';

export interface VoiceMessagePlayerProps {
  messageId: string;
  url: string;
  isMe: boolean;
  theme: any;
  avatar?: string;
  colorScheme: 'light' | 'dark';
  activeId: string | null;
  onPlay: (id: string | null) => void;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  messageId,
  url,
  isMe,
  theme,
  avatar,
  colorScheme,
  activeId,
  onPlay,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Stop playback if another message becomes active
  useEffect(() => {
    if (activeId !== messageId && isPlaying) {
      if (sound) {
        sound.pauseAsync();
      }
      setIsPlaying(false);
    }
  }, [activeId]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        onPlay(null);
        if (sound) {
          sound.stopAsync().catch(() => {});
          sound.setPositionAsync(0).catch(() => {});
        }
      }
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playPause = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          onPlay(null);
        } else {
          onPlay(messageId);
          const status = await sound.getStatusAsync();
          if (
            status.isLoaded &&
            (status.didJustFinish ||
              (status.positionMillis >= (status.durationMillis || 0) - 100))
          ) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        onPlay(messageId);
        const fullUrl = url.startsWith('http') ? url : `${IMAGE_BASE}${url}`;
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true, volume: 1.0 },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play audio', error);
    }
  };

  const accentColor = isMe ? '#FFF' : theme.primary;

  return (
    <View style={styles.voicePlayerContainer}>
      <TouchableOpacity
        onPress={playPause}
        style={[
          styles.voicePlayBtn,
          {
            backgroundColor: isMe
              ? 'rgba(255,255,255,0.2)'
              : colorScheme === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        {isPlaying ? (
          <Pause size={18} color={accentColor} fill={accentColor} />
        ) : (
          <Play
            size={18}
            color={accentColor}
            fill={accentColor}
            style={{ marginLeft: 2 }}
          />
        )}
      </TouchableOpacity>

      <View style={styles.voiceSliderContainer}>
        <View style={styles.voiceSliderTrackOutter}>
          <View
            style={[
              styles.voiceSliderTrackDotted,
              {
                borderColor: isMe
                  ? 'rgba(255,255,255,0.3)'
                  : colorScheme === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.1)',
              },
            ]}
          />
          <View
            style={[
              styles.voiceSliderThumb,
              {
                backgroundColor: accentColor,
                left: duration
                  ? `${Math.min(100, (position / duration) * 100)}%`
                  : '0%',
                width: 8,
                height: 8,
                borderRadius: 4,
                marginLeft: -4,
              },
            ]}
          />
        </View>
        <View style={styles.voiceMetaRow}>
          <Text
            style={[
              styles.voiceDurationText,
              {
                color: isMe
                  ? 'rgba(255,255,255,0.7)'
                  : theme.textSecondary,
              },
            ]}
          >
            {isPlaying
              ? formatDuration(position)
              : duration
                ? formatDuration(duration)
                : '0:00'}
          </Text>
        </View>
      </View>

      <View style={styles.voiceAvatarContainer}>
        <Image
          source={getAvatarUrl(avatar || '')}
          style={styles.voiceAvatar}
          contentFit="cover"
        />
        <View
          style={[
            styles.voiceMicIcon,
            {
              backgroundColor: isMe ? '#22C55E' : '#3B82F6',
              borderColor: isMe ? '#10B98100' : '#FFF0',
            },
          ]}
        >
          <Mic size={7} color="#FFF" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  voicePlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 220,
    paddingVertical: 4,
    gap: 10,
  },
  voiceAvatarContainer: {
    position: 'relative',
  },
  voiceAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEE',
  },
  voiceMicIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSliderContainer: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  voiceSliderTrackOutter: {
    height: 12,
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  voiceSliderTrackDotted: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 1,
    width: '100%',
  },
  voiceSliderThumb: {
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  voiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  voiceDurationText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 0,
  },
});

export default VoiceMessagePlayer;

