import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useAuth } from '@/src/store/authStore';

export default function Privacy() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <ScrollView style={styles.container}>
      {user && (
        <>
          <Text style={styles.heading}>Account</Text>
          <Text style={styles.text}>{user.name} · {user.email}</Text>
          <TouchableOpacity style={styles.logout} onPress={logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </>
      )}
      
      <Text style={styles.title}>Privacy Policy</Text>
      
      <Text style={styles.heading}>1. Data Collection</Text>
      <Text style={styles.text}>
          LinguaEar records audio only when you 
          press the Listen button. Audio is 
          processed by our AI systems and 
          immediately deleted. Nothing is stored.
      </Text>

      <Text style={styles.heading}>2. Data Storage</Text>
      <Text style={styles.text}>
      Audio is processed in real time and 
      immediately discarded. Your account (name, 
      email, a salted password hash and your learning 
      preferences) is stored only on this device.
      </Text>

      <Text style={styles.heading}>3. GDPR</Text>
      <Text style={styles.text}>
        We do not store any personal data. Audio is 
        processed and immediately discarded. You are 
        always in control.
      </Text>

      <Text style={styles.heading}>4. Contact</Text>
      <Text style={styles.text}>linguaear@gmail.com</Text>

      <Text style={styles.title}>Impressum</Text>
      
      <Text style={styles.text}>
        Name: LinguaEar {'\n'}
        Address: Cologne,Germany{'\n'}
        Email: linguaear@gmail.com
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 30,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 20,
    marginBottom: 8,
  },
  logout: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  text: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
  },
});