import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB', // Off-white premium aesthetic background
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 35,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563EB', // Blue accent
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonRecording: {
    backgroundColor: '#EF4444', // Red recording
    shadowColor: '#EF4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  attemptedCard: {
    borderLeftColor: '#10B981', // Green
  },
  explanationCard: {
    borderLeftColor: '#3B82F6', // Blue
  },
  grammarCard: {
    borderLeftColor: '#6366F1', // Indigo
  },
  quizCard: {
    borderLeftColor: '#8B5CF6', // Purple
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  content: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
  },
  resetButton: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  toneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginTop: 12,
  },
  toneText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    width: '100%',
  },
  quizButton: {
    backgroundColor: '#F5F3FF',
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '700',
  },
  privacyLink: {
    marginTop: 30,
    padding: 10,
  },
  privacyText: {
    color: '#9CA3AF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});