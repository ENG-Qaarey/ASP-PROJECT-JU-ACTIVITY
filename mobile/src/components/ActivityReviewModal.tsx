import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Star, X, CheckCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '@/src/context/LanguageContext';
import { Colors } from '@/src/data/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useToast } from '@/src/context/ToastContext';
import { client } from '@/src/lib/api';

interface ActivityReviewModalProps {
  visible: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
}

export const ActivityReviewModal: React.FC<ActivityReviewModalProps> = ({ 
  visible, 
  onClose, 
  activityId,
  activityTitle
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast({ message: t.feedback.ratingRequired, type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/reviews', {
        activityId,
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRating(0);
        setComment('');
        onClose();
      }, 2000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to submit review';
      showToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.closeArea} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{t.feedback.rateActivity}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successContainer}>
              <CheckCircle size={60} color="#10B981" />
              <Text style={[styles.successText, { color: theme.text }]}>{t.feedback.thankYou}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.activityTitle, { color: theme.textSecondary }]}>{activityTitle}</Text>
              
              <Text style={[styles.question, { color: theme.text }]}>{t.feedback.howWasIt}</Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Star 
                      size={40} 
                      fill={rating >= star ? "#F59E0B" : "transparent"} 
                      color={rating >= star ? "#F59E0B" : theme.textSecondary + '40'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t.feedback.commentPlaceholder}
                  placeholderTextColor={theme.textSecondary + '80'}
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{t.feedback.submitFeedback}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  closeArea: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  submitBtn: {
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    textAlign: 'center',
  }
});
