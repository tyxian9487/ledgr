import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface State { hasError: boolean; resetKey: number; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    try {
      // @ts-ignore — imported at runtime so missing DSN doesn't crash the boundary itself
      const Sentry = require('@sentry/react-native');
      if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
        Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-8 bg-white dark:bg-gray-950">
          <Text className="text-xl font-bold dark:text-white mb-2">Something went wrong</Text>
          <Text className="text-gray-500 text-sm text-center mb-6">
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState(prev => ({ hasError: false, resetKey: prev.resetKey + 1 }))}
            className="bg-green-600 px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Key forces full remount of children tree when resetKey increments
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
