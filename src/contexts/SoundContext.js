import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Create the context
export const SoundContext = createContext();

// Create a provider component
export const SoundProvider = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState(null);
  
  // Load sound settings from AsyncStorage on mount
  useEffect(() => {
    const loadSoundSettings = async () => {
      try {
        const soundEnabled = await AsyncStorage.getItem('soundEnabled');
        if (soundEnabled !== null) {
          setIsSoundEnabled(soundEnabled === 'true');
        }
      } catch (error) {
        console.error('Error loading sound settings:', error);
      }
    };
    
    loadSoundSettings();
  }, []);
  
  // Initialize the notification sound
  useEffect(() => {
    const sound = new Sound(
      Platform.OS === 'ios' ? 'notification.mp3' : 'notification', // no extension for Android
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        setNotificationSound(sound);
      }
    );
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, []);
  
  // Toggle sound and save to AsyncStorage
  const toggleSound = async (value) => {
    const newValue = value !== undefined ? value : !isSoundEnabled;
    setIsSoundEnabled(newValue);
    
    try {
      await AsyncStorage.setItem('soundEnabled', newValue.toString());
      
      // Play a test sound if enabled
      if (newValue && notificationSound) {
        notificationSound.play((success) => {
          if (!success) {
            console.log('Playback failed due to audio decoding errors');
          }
        });
      }
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  };
  
  // Play notification sound if enabled
  const playNotificationSound = () => {
    if (isSoundEnabled && notificationSound) {
      notificationSound.play((success) => {
        if (!success) {
          console.log('Playback failed due to audio decoding errors');
        }
      });
    }
  };
  
  return (
    <SoundContext.Provider value={{ 
      isSoundEnabled, 
      toggleSound,
      playNotificationSound 
    }}>
      {children}
    </SoundContext.Provider>
  );
};

// Custom hook to use the sound context
export const useSound = () => useContext(SoundContext);
