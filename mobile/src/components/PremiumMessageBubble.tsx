
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { FileText, Clock, Pin, Ban, Play } from 'lucide-react-native';
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
  setViewerVideoUrl?: (url: string | null) => void;
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
  setViewerVideoUrl,
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
    : (colorScheme === 'dark' ? '#2D2D32' : '#F1F5F9');
  const bubbleBorderColor = isMe
    ? (colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)')
    : (colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
  const textColor = isMe
    ? '#FFF'
    : (colorScheme === 'dark' ? '#F1F5F9' : '#0F172A');

  return (
    <View style={[
      styles.bubble,
      isMe ? styles.myBubble : styles.theirBubble,
      {
        backgroundColor: bubbleColor,
        borderWidth: 1,
        borderColor: bubbleBorderColor,
        borderBottomRightRadius: isMe && isLastInGroup ? 8 : 20,
        borderTopRightRadius: isMe && !isFirstInGroup ? 8 : 20,
        borderBottomLeftRadius: !isMe && isLastInGroup ? 8 : 20,
        borderTopLeftRadius: !isMe && !isFirstInGroup ? 8 : 20,
        ...(isMe ? styles.sentShadow : styles.receivedShadow),
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
        <>
          <TouchableOpacity
            style={[styles.mediaWrap, isMe && styles.mediaWrapSent]}
            onPress={() => setViewerImageUrl(msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}`)}
            activeOpacity={0.92}
          >
            <Image
              source={{ uri: msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}` }}
              style={styles.image}
              contentFit="cover"
            />
          </TouchableOpacity>
          {msgItem.caption ? (
            <Text style={[styles.captionText, { color: textColor }]}>{msgItem.caption}</Text>
          ) : null}
        </>
      ) : msgItem.type === 'video' ? (
        <>
          <TouchableOpacity
            style={[styles.mediaWrap, styles.videoPreview, isMe && styles.mediaWrapSent]}
            onPress={() => setViewerVideoUrl?.(msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}`)}
            activeOpacity={0.92}
          >
            <View style={styles.videoPreviewPlaceholder} />
            <View style={styles.videoPlayOverlay}>
              <View style={styles.videoPlayCircle}>
                <View style={styles.videoPlayCircleInner}>
                  <Play size={28} color="#FFF" fill="#FFF" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          {msgItem.caption ? (
            <Text style={[styles.captionText, { color: textColor }]}>{msgItem.caption}</Text>
          ) : null}
        </>
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

      <View style={[styles.footer, (msgItem.type === 'image' || msgItem.type === 'video') && styles.footerMedia]}>
        {msgItem.pinned && <Pin size={10} color={isMe ? 'rgba(255,255,255,0.75)' : theme.textSecondary} style={{ marginRight: 4 }} fill={isMe ? 'rgba(255,255,255,0.75)' : theme.textSecondary} />}
        <Text style={[styles.time, { color: isMe ? 'rgba(255,255,255,0.85)' : (colorScheme === 'dark' ? '#94A3B8' : '#64748B') }]}>
          {formatTime(msgItem.timestamp)}
        </Text>
        {isMe && (
          <View style={styles.statusWrap}>
            {msgItem.status === 'sending' ? (
              <Clock size={11} color="rgba(255,255,255,0.6)" />
            ) : (
              <Text style={[styles.status, { color: msgItem.status === 'read' ? '#7DD3FC' : 'rgba(255,255,255,0.85)' }]}>
                {msgItem.status === 'read' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const MEDIA_SIZE = { width: 260, height: 200 };
const MEDIA_RADIUS = 16;

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
    position: 'relative',
  },
  myBubble: {
    borderBottomRightRadius: 8,
  },
  theirBubble: {
    borderBottomLeftRadius: 8,
  },
  sentShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  receivedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  footerMedia: {
    marginTop: 6,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusWrap: {
    marginLeft: 5,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
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
    padding: 10,
    marginBottom: 8,
    borderRadius: 10,
  },
  replySender: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
  },
  mediaWrap: {
    borderRadius: MEDIA_RADIUS,
    overflow: 'hidden',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  mediaWrapSent: {
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOpacity: 0.2,
      },
      android: {},
    }),
  },
  image: {
    width: MEDIA_SIZE.width,
    height: MEDIA_SIZE.height,
    borderRadius: MEDIA_RADIUS,
  },
  videoPreview: {
    width: MEDIA_SIZE.width,
    height: MEDIA_SIZE.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  videoPlayCircleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: '600',
    fontSize: 15,
  },
  fileMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
});
