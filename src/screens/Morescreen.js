import React, { useEffect, useState } from 'react'
import { Button, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';

function Morescreen({ navigation }) {

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("UserDetails");
      console.log("User details removed successfully.");

      navigation.navigate("Login");  // ✅ This ensures "Login" is loaded

    } catch (error) {
      console.error("Error removing user details from AsyncStorage:", error);
    }
  };
  return (
    <>
      <Text>More screen</Text>
      <View>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </>
  )
};

export default Morescreen
