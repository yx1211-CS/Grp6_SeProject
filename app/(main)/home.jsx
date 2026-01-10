import { useRouter } from 'expo-router'
import { Alert, Button, StyleSheet, Text, View } from 'react-native'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { hp, wp } from '../../helpers/common'
import { supabase } from '../../lib/supabase'

const Home = () => {

    const router = useRouter(); 
    const { user, setAuth } = useAuth();

    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if(error){
            Alert.alert('Sign out', "Error signing out!")
        }
    }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Text style={styles.title}>Home Feed</Text>
        
        <View style={{marginTop: 20}}>
            <Text>Welcome user: {user?.email}</Text>
        </View>

        <View style={{marginTop: 50}}>
            <Button title="Logout" onPress={onLogout} color="red" />
        </View>

          <View style={{marginTop: 50}}>
            <Button 
                title="Go to Counselor （DEMObutton）" 
                onPress={() => router.push('/counselor')} 
            />
            <Button 
                title="Go to moderator （DEMObutton）" 
                onPress={() => router.push('/moderator')} 
            />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4)
    },
    title: {
        fontSize: hp(3),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    }
})