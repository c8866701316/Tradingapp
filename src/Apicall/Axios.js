import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from "react-native";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "https://tradep.clustersofttech.com/api";

// const BASE_URL = 'https://tradep.clustersofttech.com/api';

export const api = axios.create({ baseURL: BASE_URL });

// ─────────── Helpers ──────────────

export const getStored = async () =>
  JSON.parse((await AsyncStorage.getItem('UserDetails')) || 'null');


export const saveStored = async (data) =>
  AsyncStorage.setItem('UserDetails', JSON.stringify(data));

export const clearStored = async () =>
  AsyncStorage.removeItem('UserDetails');

export const tokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

/*  */
// ─────────── Refresh Token API ──────────────
export const refreshAccessToken = async (refreshToken) => {
  const res = await api.post('/Auth/RefreshToken', {
    refreshToken,
  });

  if (!res.data?.data?.accessToken) {
    throw new Error('No accessToken in refresh response');
  }

  return res.data.data;
};

// ─────────── Interceptors ──────────────

let isRefreshing = false;
let queue = [];

api.interceptors.request.use(async (config) => {
  const stored = await getStored();

  if (stored?.accessToken) {
    config.headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const stored = await getStored();
      if (!stored?.refreshToken) {
        await clearStored();
        DeviceEventEmitter.emit('onLogout');
        return Promise.reject(error);
      }

      // Queue handling if multiple 401s
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const fresh = await refreshAccessToken(stored.refreshToken);
        await saveStored(fresh);

        queue.forEach((p) => p.resolve(fresh.accessToken));
        queue = [];

        original.headers.Authorization = `Bearer ${fresh.accessToken}`;
        return api(original);
      } catch (e) {
        await clearStored();
        DeviceEventEmitter.emit('onLogout');
        queue.forEach((p) => p.reject(e));
        queue = [];
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
    console.error('Invalid user data. Token is missing.', userData);
    return;
  }
  try {
    // Ensure userName and password are included if provided
    const dataToSave = {
      accessToken: userData.accessToken,
      refreshToken: userData.refreshToken,
      userDetails: userData.userDetails,
      userName: userData.userName || '',
      password: userData.password || '',
    };
    await AsyncStorage.setItem('UserDetails', JSON.stringify(dataToSave));
    console.log('User details saved successfully.');
  } catch (error) {
    console.error('Error saving user details to AsyncStorage:', error);
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

// Login API
export const login = async (obj) => {
  try {
    const response = await api.post('/Auth/Login', obj);
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
    const userDetails = await getStored();
    // console.log("User Details in Me API:", userDetails);
    if (!userDetails?.accessToken) {
      throw new Error("Access token is missing.");
    }

    const response = await api.get('/Me', {
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
    const userDetails = await getStored();
    const response = await api.get('/Me', {
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

