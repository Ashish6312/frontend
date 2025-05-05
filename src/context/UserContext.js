import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser || storedUser === 'undefined') return null;
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  });

  const updateUser = (updatedUser) => {
    setUser(updatedUser); // triggers re-render
    localStorage.setItem('user', JSON.stringify(updatedUser)); // persists
  };
  

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
