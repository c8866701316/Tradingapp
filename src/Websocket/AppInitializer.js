import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientData, setAuthToken } from "../Apicall/Axios";
import ConnectSignalR from "./ConnectSignalR";

const AppInitializer = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    //   const navigation = useNavigation();
    //   const dispatch = useDispatch();

    const clientsData = async () => {
        const watchListData = await clientData();
        console.log("watchlist:--", watchListData);

        // dispatch(setClientWatchListData(watchListData));
        // navigation.navigate("Home");
    };

    useEffect(() => {
        const checkUserData = async () => {
            try {
                const firstTime = await AsyncStorage.getItem("isFirstTime");

                if (firstTime === null) {
                    // App is being launched for the first time
                    await AsyncStorage.setItem("isFirstTimez", "false");
                    navigation.navigate("Login");
                    return;
                }

                const userDetailsString = await AsyncStorage.getItem("UserDetails");

                // if (!userDetailsString) {
                //     // No user details found, navigate to LoginScreen
                //     navigation.navigate("Login");
                //     return;
                // }

                const userDetails = userDetailsString ? JSON.parse(userDetailsString) : null;
                console.log("userdetails",userDetails);


                if (userDetails && userDetails.accessToken) {
                    await setAuthToken(userDetails.accessToken);
                    // If user data exists, navigate to HomeScreen and initialize SignalR
                    await ConnectSignalR.start();
                    console.log("SignalR Connection Started Successfully");
                    console.log("ConnectSignalR.start()------", ConnectSignalR.start());

                    // console.log("SignalR connected");
                    await clientsData();
                    navigation.navigate("Home");
                } else {
                    // If no accessToken, navigate to LoginScreen
                    navigation.navigate("Login");
                }
            } catch (error) {
                console.error("Error checking user data:", error);
                // Navigate to LoginScreen in case of error
                navigation.navigate("Login");
            } finally {
                setLoading(false);
            }
        };

        checkUserData();
    }, []);

    if (loading) {
        // Show a loading indicator while checking user data
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return null;
};

export default AppInitializer;
