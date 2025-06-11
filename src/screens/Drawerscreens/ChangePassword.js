import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { getUserDetails } from '../../Apicall/Axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSound } from '../../contexts/SoundContext';

const ChangePassword = ({ visible, onClose }) => {
    const { playNotificationSound, isSoundEnabled } = useSound();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState({
    message: '',
    type: '', // 'success' or 'error'
    visible: false,
  });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

  const validateForm = () => {
    if (!oldPassword) {
      showNotification('Old password is required', 'error');
      return false;
    }
    if (!newPassword) {
      showNotification('New password is required', 'error');
      return false;
    }
    // Removed minimum length requirement as per API requirements
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const userDetails = await getUserDetails();
     console.log("User ID:", userDetails?.userDetails?.id);
      
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing.');
      }

      // Get the clientId from userDetails
      const clientId = userDetails?.userDetails?.id || '';

      if (!clientId) {
        console.warn('ClientId not found in user details, proceeding without it');
      }

      console.log('Changing password with clientId:', clientId);

      const payload = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
        clientId: clientId
      };

      console.log('Change password payload:', JSON.stringify(payload));

      const response = await fetch('https://tradep.clustersofttech.com/api/Account/ChangePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userDetails.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Change password response:', result);

      if (response.ok) {
        // Display the actual response message from the API
        showNotification(result.message || 'Password changed successfully', 'success');

        // Reset form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Display the error message from the API
        throw new Error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

return (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#03415A" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Old Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={!showOldPassword}
              placeholder="Enter old password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowOldPassword(!showOldPassword)}
            >
              <Ionicons
                name={showOldPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#03415A"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#03415A"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#03415A"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>

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
      </View>
    </View>
  </Modal>
);
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03415A',
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#03415A',
    fontWeight: '600',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  input: {
    flex: 1,
    height: 45,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  submitButton: {
    backgroundColor: '#03415A',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notification: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChangePassword;
