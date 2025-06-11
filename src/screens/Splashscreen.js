import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";

function Splashscreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace("Home");
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image source={require('../images/loginlogo.png')} style={styles.img}></Image>
            {/* <Text style={styles.logotxt}>CRICKET</Text> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#212133",
        justifyContent: "center",
        alignItems: "center",
        // padding:10
    },
    img: {
        height: '60%',
        width: '85%',
        justifyContent:"center",
        alignItems:"center"
    },
    logotxt: {
        fontSize: 40,
        color: 'white',
        paddingTop:'20%'
    }
});

export default Splashscreen;


