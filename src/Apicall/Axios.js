import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from "react-native";

const BASE_URL = "https://tradep.clustersofttech.com/api";

export const setAuthToken = (accessToken) => {
  if (accessToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    console.log("Authorization token set successfully.");
  } else {
    console.warn("Access token is missing.");
  }
};

// Clear auth token from headers
export const clearAuthToken = async () => {
  delete axios.defaults.headers.common["Authorization"];
  await AsyncStorage.removeItem('UserDetails');
  console.log("Authorization token cleared.");
};

// Save token and user details
export const saveToken = async (userData) => {
  if (!userData || !userData.accessToken) {
    console.error("Invalid user data. Token is missing.", userData);
  }
  try {
    await AsyncStorage.setItem("UserDetails", JSON.stringify(userData));
    console.log("User details saved successfully.");
  } catch (error) {
    console.error("Error saving user details to AsyncStorage:", error);
  }
};

// // Retrieve token
// export const getToken = async () => {
//   try {
//     const userDetails = await AsyncStorage.getItem("UserDetails");
//     if (!userDetails) {
//       console.warn("UserDetails not found in AsyncStorage.");
//       return null;
//     }
//     const parsedDetails = JSON.parse(userDetails);
//     return parsedDetails.accessToken || null;
//   } catch (error) {
//     console.error("Error retrieving token:", error);
//     return null;
//   }
// };


// Retrieve user details
export const getUserDetails = async () => {
  try {
    const userDetails = await AsyncStorage.getItem('UserDetails');
    if (!userDetails) {
      console.warn('No UserDetails found in AsyncStorage.');
      return null;
    }
    const parsedDetails = JSON.parse(userDetails);
    if (!parsedDetails || !parsedDetails.accessToken) {
      console.warn('Invalid or missing accessToken in UserDetails:', parsedDetails);
      return null;
    }
    return parsedDetails;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

export const debugAsyncStorage = async () => {
  try {
    const userDetails = await AsyncStorage.getItem('UserDetails');
    // console.log('Current AsyncStorage UserDetails:', userDetails);
    return userDetails ? JSON.parse(userDetails) : null;
  } catch (error) {
    console.error('Error reading AsyncStorage:', error);
    return null;
  }
};

// Login API
export const login = async (obj) => {
  try {
    const response = await axios.post(`${BASE_URL}/Auth/Login`, obj);
    console.log('Login API Status:', response.status);
    console.log("Login API Response:", JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      if (response.data?.data?.accessToken) {
        await saveToken(response.data.data);
        DeviceEventEmitter.emit('onLoginSuccess');
        return response.data.data;
      } else if (response.data?.message) {
        // If there's a message in the response but no token, it's likely an error
        throw new Error(response.data.message);
      } else {
        throw new Error("Login failed: No access token received");
      }
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (e) {
    console.error("Login API Error:", e);

    // Format error message for better display
    if (e.response) {
      console.log("Error response data:", e.response.data);

      if (e.response.data && e.response.data.message) {
        throw new Error(e.response.data.message);
      } else if (e.response.status === 401) {
        throw new Error("Invalid username or password");
      } else if (e.response.status === 400) {
        throw new Error("Invalid request. Please check your inputs.");
      }
    }
    throw e;
  }
};

// Me API Call
export const Me = async () => {
  try {
    const userDetails = await getUserDetails();
    // console.log("User Details in Me API:", userDetails);
    if (!userDetails?.accessToken) {
      throw new Error("Access token is missing.");
    }

    const response = await axios.get(`${BASE_URL}/Me`, {
      headers: {
        'Authorization': `Bearer ${userDetails.accessToken}`
      }
    });
    // console.log("response------Me", JSON.stringify(response.data.data, null, 2));

    if (response?.data?.status === true || response?.data?.status === "true") {
      return response.data.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (e) {
    console.error("API Error:", e);
    throw e;
  }
};

// Client Data API Call
export const clientData = async () => {
  try {
    const userDetails = await getUserDetails();
    // console.log("default header :", axios.defaults.headers);
    const response = await axios.get(`${BASE_URL}/Me`, {
      headers: {
        'Authorization': `Bearer ${userDetails.accessToken}`
      }
    });
    // console.log("ClientData :---", JSON.stringify(response.data.data.watchList, null, 2));
    return response?.data?.data?.watchList;
  } catch (e) {
    console.log("error", e);
    if (e.response?.status === 401) {
      console.log("Unauthorized request.");
    }
  }
};

