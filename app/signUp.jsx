import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native'
import Icon from '../assets/icons'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/Input'
import ScreenWrapper from '../components/ScreenWrapper'
import { hp, wp } from '../helpers/common'
import { theme } from '../constants/theme'
import { supabase } from '../lib/supabase'

const SignUp = () => {
    const router = useRouter();
    const emailRef = useRef("");
    const nameRef = useRef("");
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
      if (!emailRef.current || !passwordRef.current || !nameRef.current) {
        Alert.alert("Sign Up", "Please fill all the fields!");
        return;
      }

      let name = nameRef.current.trim();
      let email = emailRef.current.trim();
      let password = passwordRef.current.trim();

      setLoading(true);

      const { data: { session }, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: name, 
          },
        },
      });

      setLoading(false);

      if (error) {
        Alert.alert("Sign Up Error", error.message);
      } else {
        // 注册成功！通常 Supabase 会自动登录并更新 Session
        // 如果你是只开通了邮箱验证，可能需要提示用户去查收邮件
        // 但在教程里，默认是直接登录成功的
        // 可以在这里打印一下 data 看看
        console.log("Session created:", session);
        // 这里的跳转逻辑通常由 AuthContext 自动监听处理，不需要手动 router.push
      }
    };
    

   return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* Welcome Text */}
        <View>
            <Text style={styles.welcomeText}>Let's</Text>
            <Text style={styles.welcomeText}>Get Started</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                Please fill the details to create an account
            </Text>
            
            <Input 
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder="Enter your name"
                onChangeText={value=> nameRef.current = value}
            />

            <Input 
                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                placeholder="Enter your email"
                onChangeText={value=> emailRef.current = value}
            />

            <Input 
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder="Enter your password"
                secureTextEntry
                onChangeText={value=> passwordRef.current = value}
            />

            {/* Button */}
            <Button title={'Sign up'} loading={loading} onPress={onSubmit} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Already have an account?
            </Text>
            <Pressable onPress={()=> router.push('login')}>
                <Text style={[styles.footerText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>Login</Text>
            </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default SignUp

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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }
})