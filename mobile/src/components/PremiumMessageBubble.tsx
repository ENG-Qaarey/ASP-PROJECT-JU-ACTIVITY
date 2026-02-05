
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { FileText, Clock, Pin, Ban } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';

import { IMAGE_BASE } from '@/src/lib/config';

const SentTail = ({ color }: { color: string }) => (
  <View style={styles.sentTail}>
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Path
        d="M0 15V0C0 0 1.5 10 15 15H0Z"
        fill={color}
      />
    </Svg>
  </View>
);

const ReceivedTail = ({ color }: { color: string }) => (
  <View style={styles.receivedTail}>
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Path
        d="M15 15V0C15 0 13.5 10 0 15H15Z"
        fill={color}
      />
    </Svg>
  </View>
);

interface MessageBubbleProps {
  msgItem: any;
  isMe: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  theme: any;
  colorScheme: 'light' | 'dark';
  formatTime: (ts: any) => string;
  getFormattedReplyText: (reply: any) => string;
  setViewerImageUrl: (url: string) => void;
  handleOpenFile: (url: string) => void;
  VoiceMessageComponent: any;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  userAvatar?: string;
  contactAvatar?: string;
  isGroup?: boolean;
}

export const PremiumMessageBubble = ({
  msgItem,
  isMe,
  isFirstInGroup,
  isLastInGroup,
  theme,
  colorScheme,
  formatTime,
  getFormattedReplyText,
  setViewerImageUrl,
  handleOpenFile,
  VoiceMessageComponent,
  playingAudioId,
  setPlayingAudioId,
  userAvatar,
  contactAvatar,
  isGroup,
}: MessageBubbleProps) => {
  const bubbleColor = isMe 
    ? theme.primary 
    : (colorScheme === 'dark' ? '#333336' : '#E9E9EB');
  
  const textColor = isMe 
    ? '#FFF' 
    : (colorScheme === 'dark' ? '#FFF' : '#000');

  return (
    <View style={[
      styles.bubble,
      isMe ? styles.myBubble : styles.theirBubble,
      { 
        backgroundColor: bubbleColor,
        borderBottomRightRadius: isMe && isLastInGroup ? 4 : 18,
        borderTopRightRadius: isMe && !isFirstInGroup ? 4 : 18,
        borderBottomLeftRadius: !isMe && isLastInGroup ? 4 : 18,
        borderTopLeftRadius: !isMe && !isFirstInGroup ? 4 : 18,
      }
    ]}>
      {isMe && isLastInGroup && <SentTail color={bubbleColor} />}
      {!isMe && isLastInGroup && <ReceivedTail color={bubbleColor} />}

      {isGroup && !isMe && msgItem.senderName && (
        <Text style={[styles.senderName, { color: colorScheme === 'dark' ? theme.primary : theme.primary }]}>
          {msgItem.senderName}
        </Text>
      )}

      {msgItem.replyTo && (
        <View style={[
          styles.replyContainer, 
          { 
            backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
            borderLeftColor: isMe ? '#FFF' : theme.primary,
          }
        ]}>
          <Text style={[styles.replySender, { color: isMe ? '#FFF' : theme.primary }]}>
            {msgItem.replyTo.senderName}
          </Text>
          <Text style={[styles.replyText, { color: isMe ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]} numberOfLines={1}>
            {getFormattedReplyText(msgItem.replyTo)}
          </Text>
        </View>
      )}

      {msgItem.isDeleted ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.7 }}>
          <Ban size={14} color={textColor} />
          <Text style={{ color: textColor, fontStyle: 'italic', fontSize: 14 }}>
            This message was deleted
          </Text>
        </View>
      ) : msgItem.type === 'audio' ? (
        <VoiceMessageComponent 
          messageId={msgItem.id}
          url={msgItem.text} 
          isMe={isMe} 
          theme={theme}
          avatar={isMe ? userAvatar : contactAvatar}
          colorScheme={colorScheme}
          activeId={playingAudioId}
          onPlay={setPlayingAudioId}
        />
      ) : msgItem.type === 'image' ? (
        <TouchableOpacity onPress={() => setViewerImageUrl(msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}`)}>
          <Image 
            source={{ uri: msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}` }} 
            style={styles.image}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : msgItem.type === 'file' ? (
        <TouchableOpacity 
          style={styles.fileContainer}
          onPress={() => handleOpenFile(msgItem.text)}
        >
          <View style={[styles.fileIconBox, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.primary + '20' }]}>
            <FileText size={20} color={isMe ? '#FFF' : theme.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
              {msgItem.fileName || 'Document'}
            </Text>
            <Text style={[styles.fileMeta, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
              {msgItem.fileSize || 'Unknown size'} • {msgItem.fileExt?.toUpperCase() || 'FILE'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.messageText, { color: textColor }]}>
          {msgItem.text}
        </Text>
      )}

      <View style={styles.footer}>
        {msgItem.pinned && <Pin size={10} color={isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary} style={{ marginRight: 4 }} fill={isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary} />}
        <Text style={[styles.time, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
          {formatTime(msgItem.timestamp)}
        </Text>
        {isMe && (
          <View style={{ marginLeft: 4 }}>
            {msgItem.status === 'sending' ? (
              <Clock size={10} color="rgba(255,255,255,0.5)" />
            ) : (
              <Text style={[styles.status, { color: msgItem.status === 'read' ? '#38BDF8' : 'rgba(255,255,255,0.7)' }]}>
                {msgItem.status === 'read' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
    position: 'relative',
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: {
    fontSize: 10,
  },
  status: {
    fontSize: 12,
    marginLeft: 2,
    marginTop: -2,
  },
  sentTail: {
    position: 'absolute',
    bottom: 0,
    right: -8,
  },
  receivedTail: {
    position: 'absolute',
    bottom: 0,
    left: -8,
  },
  replyContainer: {
    borderLeftWidth: 3,
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  replySender: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
  },
  image: {
    width: 250,
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: '600',
    fontSize: 14,
  },
  fileMeta: {
    fontSize: 11,
  },
});
