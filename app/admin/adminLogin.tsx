import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, View } from 'react-native';

import Icon from '../../assets/icons';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';

const AdminLogin = () => {
    const router = useRouter();
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
      if (!emailRef.current || !passwordRef.current) {
        Alert.alert("Admin Login", "Please fill all the fields!");
        return;
      }
      
      let email = emailRef.current.trim();
      let password = passwordRef.current.trim();

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);
      
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      if (data.session) {
         
          router.replace('/admin/dashboard'); 
      }
    }

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        <View>
            <Text style={styles.welcomeText}>System Admin</Text>
            <Text style={[styles.welcomeText, {fontSize: hp(2.5), marginTop: 10}]}>Control Panel Access</Text>
        </View>

        <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                Authorized personnel only
            </Text>
            
            <Input 
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder="Admin Email" 
                onChangeText={value=> emailRef.current = value}
            />

            <Input 
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder="Password"
                secureTextEntry
                onChangeText={value=> passwordRef.current = value}
            />

            <Button 
                title={'Access Dashboard'} 
                loading={loading} 
                onPress={onSubmit} 
            />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default AdminLogin;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5),
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
    form: {
        gap: 25,
    },
});