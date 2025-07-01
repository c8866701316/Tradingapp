import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Pressable,
    ActivityIndicator,
    Animated,
    Alert,
    useColorScheme,
} from 'react-native';
import CheckBox from 'react-native-check-box';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { clientData, login, Me, saveToken, setAuthToken } from '../Apicall/Axios';
import ConnectSignalR from '../Websocket/ConnectSignalR';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSound } from '../contexts/SoundContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {

    const { playNotificationSound, isSoundEnabled } = useSound();
    const [loginData, setLoginData] = useState(null);
    const [loading, setLoading] = useState(false); // State to track loading
    const [userName, setUserName] = useState("");
    const [pass, setPass] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [notification, setNotification] = useState({
        message: '',
        type: '', // 'success' or 'error'
        visible: false,
    });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Load saved credentials when component mounts
    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                const savedUsername = await AsyncStorage.getItem('savedUsername');
                const savedPassword = await AsyncStorage.getItem('savedPassword');
                const rememberMe = await AsyncStorage.getItem('rememberMe');

                if (rememberMe === 'true' && savedUsername) {
                    setUserName(savedUsername);
                    setIsChecked(true);


                    if (savedPassword) {
                        setPass(savedPassword);
                    }
                }
            } catch (error) {
                console.error('Error loading saved credentials:', error);
            }
        };

        loadSavedCredentials();
    }, []);

    // Handle username change and check for saved password
    const handleUsernameChange = async (text) => {
        setUserName(text);
        setUsernameError('');
        setPass(''); // Clear password field when username changes

        if (isChecked && text) {
            try {
                const savedPassword = await AsyncStorage.getItem(`password_${text}`);
                if (savedPassword) {
                    setPass(savedPassword);
                }
            } catch (error) {
                console.error('Error checking saved password:', error);
            }
        }
    };

    const showNotification = (message, type) => {
        setNotification({
            message,
            type,
            visible: true,
        });
        // Play notification sound if enabled
        if (isSoundEnabled) {
            playNotificationSound();
        }
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Hide notification after 3 seconds
        setTimeout(hideNotification, 3000);
    };

    const hideNotification = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        });
    };

    const validateInputs = () => {
        let isValid = true;
        if (!userName.trim()) {
            setUsernameError("Please enter a username");
            isValid = false;
        } else {
            setUsernameError("");
        }

        if (!pass.trim()) {
            setPasswordError("Please enter a password");
            isValid = false;
        } else {
            setPasswordError("");
        }

        return isValid;
    };

    const onLoginPress = async () => {
        if (!validateInputs()) {
            return;
        }
        setLoading(true); // Set loading state to true when API call starts
        try {
            const obj = {
                userName: userName,
                password: pass,
                role: "client",
            };

            // console.log("Attempting login with:", userName);
            const loginApi = await login(obj);

            if (loginApi?.accessToken) {
                console.log("Login successful, token received");
                showNotification("Login successful!", "success");

                await saveToken(loginApi);
                setAuthToken(loginApi.accessToken);

                // Save credentials if "Remember Me" is checked
                if (isChecked) {
                    try {
                        await AsyncStorage.setItem('savedUsername', userName);
                        await AsyncStorage.setItem(`password_${userName}`, pass);
                        await AsyncStorage.setItem('rememberMe', 'true');
                    } catch (error) {
                        console.error('Error saving credentials:', error);
                    }
                } else {
                    // Clear saved credentials if "Remember Me" is unchecked
                    try {
                        await AsyncStorage.removeItem('savedUsername');
                        await AsyncStorage.removeItem(`password_${userName}`);
                        await AsyncStorage.removeItem('rememberMe');
                    } catch (error) {
                        console.error('Error removing credentials:', error);
                    }
                }

                const meApiResponse = await Me();
                console.log("meApiResponse", meApiResponse);

                setLoginData(loginApi);
                // clientData();
                // Navigate after a short delay to allow the notification to be seen
                setTimeout(() => {
                    navigation.navigate("Home", { meData: meApiResponse });
                }, 100);

            } else {
                console.error("Login failed or token not received.");
                showNotification("Login failed. Please check your credentials.", "error");
            }
        } catch (error) {
            console.error("Error during login:", error);
            let errorMessage = "Login failed. Please try again.";
            if (error.response) {
                console.log("Error response data:", error.response.data);

                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.status === 401) {
                    errorMessage = "Invalid username or password";
                } else if (error.response.status === 400) {
                    errorMessage = "Invalid request. Please check your inputs.";
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            }
            showNotification(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };


    const clientsData = async () => {
        try {
            console.log("Fetching watchlist data...");
            const watchListData = await clientData();
            console.log("watchListData", watchListData);
        } catch (error) {
            console.error("Error fetching client data:", error);
        }
    };

    useEffect(() => {
        console.log("loginData", loginData?.accessToken);
        if (loginData?.accessToken) {
            ConnectSignalR.start();
            clientsData();
        }
    }, [loginData]);



    const toggleCheckbox = async () => {
        const newCheckedState = !isChecked;
        setIsChecked(newCheckedState);

        // If user is checking the box and username exists, try to load password
        if (newCheckedState && userName) {
            try {
                const savedPassword = await AsyncStorage.getItem(`password_${userName}`);
                if (savedPassword) {
                    setPass(savedPassword);
                }
            } catch (error) {
                console.error('Error loading saved password:', error);
            }
        } else {
            setPass(''); // Clear password if "Remember Me" is unchecked
        }
    };
    // const handleViewSavedPassword = async () => {
    //     try {
    //         const savedPassword = await AsyncStorage.getItem(`password_${userName}`);
    //         if (savedPassword) {
    //             Alert.alert(
    //                 "Saved Password",
    //                 `Password for ${userName} is saved. Would you like to use it?`,
    //                 [
    //                     {
    //                         text: "Cancel",
    //                         style: "cancel"
    //                     },
    //                     {
    //                         text: "Use It",
    //                         onPress: () => {
    //                             setPass(savedPassword);
    //                             setIsChecked(true);
    //                         }
    //                     }
    //                 ]
    //             );
    //         } else {
    //             Alert.alert(
    //                 "No Saved Password",
    //                 `No password is saved for ${userName || 'this user'}.`
    //             );
    //         }
    //     } catch (error) {
    //         console.error('Error retrieving saved password:', error);
    //         Alert.alert(
    //             "Error",
    //             "Could not retrieve saved password."
    //         );
    //     }
    // };


    return (
        <SafeAreaView style={styles.container}>
            {/* Logo */}
            <View style={styles.logobox}>
                <Image source={require('../images/loginlogo.png')} style={styles.logo} />
            </View>

            {/* Login Box */}
            <View style={styles.login}>
                <LinearGradient colors={['#383D4A', '#4183EF']} style={styles.loginBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.loginText}>Login</Text>
                </LinearGradient>

                <View style={{ paddingHorizontal: 10, paddingTop: 15, }}>
                    {/* User ID Input */}
                    <View
                        style={[
                            styles.inputContainer,
                            // { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }
                        ]}
                    >
                        <SimpleLineIcons name="envelope" size={20} color="#315966" style={styles.icon} />
                        <TextInput
                            placeholder="User Id"
                            placeholderTextColor="#B9B5B9"
                            style={[
                                styles.input,
                                // { color: isDark ? '#fff' : '#000' }      // text
                            ]}
                            value={userName}
                            onChangeText={handleUsernameChange}
                            autoCapitalize="none"
                        />
                    </View>
                    {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
                    {/* Password Input */}
                    <View
                        style={[
                            styles.inputContainer,
                            // { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }
                        ]}
                    >
                        <Ionicons name="key-outline" size={20} color="#315966" style={styles.icon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#B9B5B9"
                            secureTextEntry
                            value={pass}
                            style={[
                                styles.input,
                                // { color: isDark ? '#fff' : '#000' }      // text
                            ]}
                            onChangeText={(text) => { setPass(text); setPasswordError(""); }}
                            autoCapitalize="none"
                        />
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>

                {/* Remember section */}
                <View style={styles.rememberContainer}>
                    <CheckBox
                        isChecked={isChecked}
                        onClick={toggleCheckbox}
                        checkBoxColor={isChecked ? 'white' : '#315966'} // Main color
                        checkedCheckBoxColor="white"  // Color when checked
                        uncheckedCheckBoxColor="white" // Color when unchecked
                        style={{ top: -4 }}
                    />
                    <Text style={styles.remember}>Remember Me</Text>
                    <Pressable>
                        <Text style={styles.savepass}>View Saved Password</Text>
                    </Pressable>
                </View>

                {/* Sign In Button */}
                <View style={{ padding: 10 }}>
                    <LinearGradient colors={['#383D4A', '#4183EF']} style={styles.submitbtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <TouchableOpacity style={styles.button} onPress={onLoginPress} activeOpacity={0.85} disabled={loading} >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

            </View>

            {/* Sign Up Link */}
            <View style={{ justifyContent: 'center', flexDirection: 'row', top: 6 }}>
                <Text style={styles.signupText}>
                    Didn't have an Account?
                </Text>
                <Pressable>
                    <Text style={styles.signupLink}> Sign Up</Text>
                </Pressable>
            </View>
            {/* Notification */}
            {notification.visible && (
                <Animated.View
                    style={[
                        styles.notification,
                        {
                            backgroundColor: notification.type === 'success' ? '#4CAF50' : '#F44336',
                            opacity: fadeAnim,
                            transform: [{
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <Text style={styles.notificationText}>{notification.message}</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#012330',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logobox: {
        height: 100,
        width: 200,
        // borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 20,
    },
    logo: {

        width: '70%',
        height: '66%',
        resizeMode: 'cover',

    },
    loginBox: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomWidth: 1,
        borderColor: '#246AA4',
        padding: 13,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 5 },
    },
    login: {
        height: 360,
        width: 330,
        backgroundColor: 'rgba(3,66,89,0.4)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#246AA4',
        elevation: 2
    },
    loginText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        // marginBottom: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 2,
        paddingHorizontal: 10,
        marginVertical: 10
        // marginHorizontal: 3,

    },
    input: {
        // backgroundColor:'pink',
        width: '90%',
        color: '#000',
    },
    icon: {
        marginRight: 10,
    },
    rememberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5
        // marginHorizontal: 8
    },
    remember: {
        fontSize: 11,
        color: 'white',
        left: -33
    },
    savepass: {
        color: 'white',
        fontSize: 11,
        left: 13,
        textDecorationLine: 'underline',

    },
    submitbtn: {
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 5 },
    },
    button: {

        paddingVertical: 20,

        alignItems: 'center',

    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        // fontWeight: 'bold',
    },
    signupText: {
        color: '#4B7D98',
        fontSize: 12,
        textAlign: 'center',
    },
    signupLink: {
        color: '#fff',
        fontWeight: 'bold',
        bottom: 2
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginLeft: 35,
        marginTop: -10,
        marginBottom: 5,
    },
    notification: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    notificationText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default LoginScreen;
