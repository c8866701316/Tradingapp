// Create a UserContext.js
import React from 'react';

export const UserContext = React.createContext();

export const UserProvider = ({ children, userData }) => {
  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
};