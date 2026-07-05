//----Just for the login page-----//

import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { RFPercentage } from "react-native-responsive-fontsize";
import { TextInput } from 'react-native-gesture-handler';
import { useRoute } from "@react-navigation/native";
//---just icons for aesthetics---//
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faAnglesRight } from '@fortawesome/free-solid-svg-icons'

//----for the log in function from the database.js file---//
import { loginUser } from './../../database'

//---for saving the logged in status-----//
import AsyncStorage from '@react-native-async-storage/async-storage';

//-----For updating the user's logged in status----//
import { useContext } from "react";
import { UserContext } from "./../../App"

export default function LoginPage({navigation}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrorMsg] = useState("Default error message");
  const [displayErrorStatus, setDisplayErrorStatus] = useState(false);
  
  //---in case we got in here from CreatePage.js after successfully creating an account----//
  const route = useRoute();
  const { successMessage } = route.params || false //---default is false here----//
  const [showSuccessMessage, setShowSuccessMessage] = useState( successMessage || false);
  
  //-----For updating the user's logged in status----//
  const { setUser } = useContext(UserContext);

//--_______Logging in function_______--------//
  const loggingIn = async() =>{
    //---reset previous error messages-----//
    setDisplayErrorStatus(false);
    
//---____checks whether username is empty_____----//
    if(!username || username.trim().length === 0){
      //---updating error message and showing it----//
      setErrorMsg("Your username is empty!")
      setDisplayErrorStatus(true)
      
      //----Emptying out the inputs----//
      emptyInputs()
      return
    }

//--______checks whether password is empty__________----//
    if(!password || password.trim().length === 0){
      //---updating error message and showing it----//
      setErrorMsg("Your password is empty!")
      setDisplayErrorStatus(true)
      
      //----Emptying out the inputs----//
      emptyInputs()
      return
    }
    
    //----the logging in part---//
    try {
        const success = await loginUser(username, password);
        if (success) {
          console.log("Login successful!");
          //-----Save username to AsyncStorage (This is how we represent a user being logged in)---//
          await AsyncStorage.setItem('loggedInUser', username);
          setUser(username) //---save the logged in user to the context state----//
          //----navigate to main app page----//
          navigation.navigate("JournalApp"); 
        } 
        //------if there is an error---------//
        else {
          setErrorMsg("An invalid username or password was entered");
          setDisplayErrorStatus(true);
          emptyInputs();
        }
    } 
    catch (error) {
        console.log("Error during login:", error);
        setErrorMsg("Something went wrong. Please try again.");
        setDisplayErrorStatus(true);
    }
  }

//---___For each time the user makes a mistake in the input when they press the login button___---//
  const emptyInputs = () =>{
    setUsername("")
    setPassword("")
  }

  return(
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.HomepageScroll}>
        <View style={styles.navHeader}>
          {/*---- The side menu button ---*/}
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
           <FontAwesomeIcon icon={faAnglesRight} size={30} color="white" />
          </TouchableOpacity>

          {/*--- The App's title----*/}
          <Text style={styles.navHeaderTitle}> Login page </Text> 

        </View>

        {/*----The Login Form----*/}
      
        <View style={styles.loginContainer}>
          {/* success message if we came here after just creating an account */}
          {showSuccessMessage && (          
            <Text style={[styles.successMsg, styles.messageText]}> Your account was successfully created !</Text>
          )}

          {/* Error message that appears when something goes wrong with the inputs */}
          {displayErrorStatus && (
            <Text  style={[styles.errorMsg, styles.messageText]}> {errMsg} </Text>
          )}

          <Text style={styles.inputLabels}>Username</Text>
          <TextInput
            style={styles.usernameAndPasswordInput}
            placeholder="Enter username"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.inputLabels}>Password</Text>
          <TextInput
            style={styles.usernameAndPasswordInput}
            placeholder="Enter password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={loggingIn}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const mainBackgroundColour = "#124170"
const styles = StyleSheet.create({
  //----______css affecting the main body of the page------//
  mainContainer: {
    flex: 1,
    backgroundColor: mainBackgroundColour,
  },

  HomepageScroll:{
    paddingBottom: 200,
  },

//----______css affecting just the nav bar_____------//
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 15,
    backgroundColor: '#1A2F50',
  },

  navHeaderTitle: {
    fontSize: RFPercentage(3),
    color: 'white',
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },

  //----_______________CSS affecting the Login text inputs and labels_________------------//
  //---This affects the containing all of the inputs and labels-----//
  loginContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  inputLabels: {
    color: "1A2F50",
    fontSize: RFPercentage(3),
    marginBottom: RFPercentage(2),
  },

  usernameAndPasswordInput: {
    backgroundColor: "#1A2F50",
    color: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: "15%",
    fontSize: RFPercentage(2.2),
  },

  loginBtn: {
    backgroundColor: "#4A90E2",
    marginTop: "15%",
    padding: "8%",
    borderRadius: 10,
    alignItems: "center",
  },

  loginBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: RFPercentage(2.5),
  },

  //---This is for just the error and success messages---//
  errorMsg:{
    color: "red",
  },

  successMsg:{
    color: "green"
  },

  messageText:{
    paddingBottom: "5%",
    textAlign: "center",
    fontSize: 17
  }
});