import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary ${this.props.name || 'Global'}] Caught error:`, error);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Crash Detected</Text>
            <Text style={styles.subtitle}>
              Location: {this.props.name || 'Unknown Component'}
            </Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.toString()}
              </Text>
            </View>

            {this.state.errorInfo && (
              <View style={styles.stackBox}>
                <Text style={styles.stackText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#FFEBEB',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#D8000C',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  stackBox: {
    backgroundColor: '#E5E7EB',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  stackText: {
    color: '#374151',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});