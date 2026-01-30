import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SubmitFeedback() {
    const { user } = useAuth();
    const router = useRouter();
    const { requestId, helperId } = useLocalSearchParams(); // get task id
    
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

   const handleSubmit = async () => {
    if (!message.trim()) {
        Alert.alert("Required", "Please enter your feedback.");
        return;
    }

    setLoading(true);
    try {
        // submit feedback
        const { error: feedbackError } = await supabase
            .from('feedback')
            .insert([{
                userid: user.id,
                feedbackmessage: message,
                status: 'Pending',
                feedbacksubmittime: new Date().toISOString()
            }]);

        if (feedbackError) throw feedbackError;

        //status to alraeady comment
        const { error: requestError } = await supabase
            .from('help_request')
            .update({ has_feedback: true })
            .eq('id', requestId); 
        if (requestError) throw requestError;

        Alert.alert("Success", "Thank you! Your feedback helps us improve.");
        router.back();
    } catch (error) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
};

    return (
        <ScreenWrapper bg="white">
            <View style={{ flex: 1, padding: 20 }}>
                <Header title="Rate Service" showBackButton={true} />
                
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>Share your experience regarding this help request.</Text>
                </View>

                <TextInput
                    style={styles.input}
                    multiline
                    placeholder="How was the service? Any suggestions?"
                    value={message}
                    onChangeText={setMessage}
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>{loading ? "Submitting..." : "Submit Feedback"}</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    infoBox: { backgroundColor: '#F0F7FF', padding: 15, borderRadius: 12, marginVertical: 20 },
    infoText: { color: '#0056b3', fontSize: 14 },
    input: { 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 12, 
        padding: 15, 
        height: 200, 
        fontSize: 16,
        backgroundColor: '#F9FAFB'
    },
    submitBtn: { 
        backgroundColor: theme.colors.primary, 
        padding: 16, 
        borderRadius: 12, 
        marginTop: 30, 
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});