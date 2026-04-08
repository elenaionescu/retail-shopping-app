import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FeedbackBannerProps {
  message: string;
  tone?: 'error' | 'info' | 'success';
}

export function FeedbackBanner({ message, tone = 'info' }: FeedbackBannerProps) {
  return (
    <View style={[styles.banner, tone === 'error' ? styles.error : tone === 'success' ? styles.success : styles.info]}>
      <Text accessibilityRole="alert" style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    padding: 12,
  },
  info: {
    backgroundColor: '#eef4ff',
  },
  error: {
    backgroundColor: '#fdecec',
  },
  success: {
    backgroundColor: '#ecfdf3',
  },
  text: {
    color: '#222',
  },
});
