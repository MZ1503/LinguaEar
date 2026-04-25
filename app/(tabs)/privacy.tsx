import { ScrollView, StyleSheet, Text } from 'react-native';

export default function Privacy() {
  return (
    <ScrollView style={styles.container}>
      
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
      We do not store any personal data.
      Audio is processed in real time and 
      immediately discarded.
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
  text: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
  },
});