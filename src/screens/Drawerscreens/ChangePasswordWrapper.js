import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import ChangePassword from './ChangePassword';

const ChangePasswordWrapper = ({ route, navigation }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(true);

  useEffect(() => {
    // When this screen is focused, show the modal
    const unsubscribe = navigation.addListener('focus', () => {
      setShowPasswordModal(true);
    });

    // Cleanup the listener when the component is unmounted
    return unsubscribe;
  }, [navigation]);

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    // Navigate back to the previous screen
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ChangePassword 
        visible={showPasswordModal} 
        onClose={handleCloseModal} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
});

export default ChangePasswordWrapper;
