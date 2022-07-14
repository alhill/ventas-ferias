import React, { createContext, ReactNode, useContext } from "react";
import { useFirebase } from "./firebase";


const AuthenticationContext = createContext(undefined);

const AuthenticationProvider = ({ children }) => {
  const {
    createUserOnFirebase,
    doUserLoginOnFirebase,
    logoutUserFromFirebase,
    user,
    isFetchingUser,
  } = useFirebase();

  const getLoggedUser = () => user;

  const doLogin = (email, password) =>
    new Promise(async (resolve, reject) => {
      try {
        await doUserLoginOnFirebase(email, password);

        resolve();
      } catch (e) {
        reject(e);
      }
    });

  const doRegister = (email, password) =>
    new Promise(async (resolve, reject) => {
      try {
        await createUserOnFirebase(email, password);

        resolve();
      } catch (e) {
        reject(e);
      }
    });

  const doLogout = async () => await logoutUserFromFirebase();

  return (
    <AuthenticationContext.Provider
      value={{
        isLogged: !!getLoggedUser(),
        user: getLoggedUser(),
        isFetchingUser,
        doLogin,
        doRegister,
        doLogout,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

const useAuthentication = () => {
  const context = useContext(AuthenticationContext);

  if (context === undefined) {
    throw new Error(
      "useAuthentication must be used within a AuthenticationProvider"
    );
  }

  return context;
};

export { AuthenticationProvider, useAuthentication };
