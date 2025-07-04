import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ChangePassword from './ChangePassword';

const ChangePasswordScreen = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Change Password</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.buttonText}>Open Change Password Modal</Text>
        </TouchableOpacity>

        <ChangePassword
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#03415A',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#03415A',
    padding: 15,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ChangePasswordScreen;
