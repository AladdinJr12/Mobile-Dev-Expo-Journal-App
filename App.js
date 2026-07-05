import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Image, SafeAreaView, Button, TouchableOpacity } from 'react-native';
// import { Button, SafeAreaView } from 'react-native-web';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from "@react-navigation/drawer";

//-----This is for all of the pages-----//
import { LoginPage, CreatePage, JournalMainScreenPage, JournalEntryPage, MapChanger, SearchResultsPage } from './src/screens';
import { initDB } from './database'
import { useEffect, useState, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

//---for tracking the user's logged in status-------//
export const UserContext = createContext();
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

//---Drawer navigator for the Journal home page----//
function JournalDrawer() {
  const { user, setUser } = useContext(UserContext);

  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen 
        name="Home" 
        component={JournalMainScreenPage} 
      />

{/* When user is not logged in = the drawer displays either the login + "create new account" button  */}
        {!user ? (
          <>
            <Drawer.Screen name="Login" component={LoginPage} />
            <Drawer.Screen name="Create new account" component={CreatePage} />
          </>
        ):
      (
        <>
          {/* When user is logged in = displays a logout button  */}
            <Drawer.Screen 
              name="Logout" 
              children={() => (
                <TouchableOpacity
                  style={styles.logoutBtn}
                  //---log out functionality----//
                  onPress={async () => {
                    await AsyncStorage.removeItem('loggedInUser'); //--removes logged-in user from the async storage--//
                    console.log("---------------We are logging out--------")
                    setUser(null); //---update the user state----//
                    navigation.navigate("Home")
                  }}
                >
                  <Text style={styles.logoutBtnTxt}>Log Out</Text>
                </TouchableOpacity>
              )}
            />
        </>
      )}

    </Drawer.Navigator>
  );
}



export default function App() {  
  //---_________This is called when the app starts up_______------//
  useEffect(() => {
    //---Initializing the database when the app starts----//
    initDB(); 
  }, []);

  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/*-----This is the first screen that shows up----*/}
          {/* This is linked to a drawer navigation that contains the journal screen*/}
          <Stack.Screen 
            name="JournalApp" 
            //----passing in user and setUser states to the drawer---//
            component={JournalDrawer}
          />
          
          <Stack.Screen
            name='LoginPage'
            component={LoginPage}
          />
          <Stack.Screen
            name='CreatePage'
            component={CreatePage}
          />

          {/*-------This is the screen for when the user adds in a new journal entry--------*/}
          <Stack.Screen name="JournalEntry" component={JournalEntryPage} />

          <Stack.Screen name="MapChanger" component={MapChanger} />

          <Stack.Screen name="searchResults" component={SearchResultsPage} />


        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  //----css for the logout button----//
  logoutBtn:{
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center' 
  },
  logoutBtnTxt:{
    fontSize: 20
  }
});
