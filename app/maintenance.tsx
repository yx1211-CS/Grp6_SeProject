import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Maintenance() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Under Maintenance</Text>
      <Text style={styles.subtitle}>Please check back later.</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/admin/adminLogin')}
      >
        <Text style={styles.btnText}>Admin Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'white' 
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 30 },
  button: { 
    backgroundColor: 'black', 
    padding: 15, 
    borderRadius: 10 
  },
  btnText: { color: 'white', fontWeight: 'bold' }
});