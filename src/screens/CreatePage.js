//----The page for creating a new account-----//

import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { RFPercentage } from "react-native-responsive-fontsize";
import { TextInput } from 'react-native-gesture-handler';
//---just icons for aesthetics---//
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faAnglesRight } from '@fortawesome/free-solid-svg-icons'

import { registerUser, isUsernameTaken } from './../../database'

export default function CreatePage({navigation}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errMsg, setErrorMsg] = useState("Default error message");
  const [displayErrorStatus, setDisplayErrorStatus] = useState(false);

  //----create account logic---//  
  const createAccount = async() =>{
//---________________if their confirm password and password inputs are not the same_____________---//
    if(password != passwordConfirmation){
      //---updating error message and showing it----//
      setErrorMsg("Your passwords did not match!")
      setDisplayErrorStatus(true)
      
      //----Emptying out the inputs----//
      emptyInputs()
      //---So that it doesnt add in the user----//
      return 
    }

//-------__________if username is empty________________--------//
    if(!username || username.trim().length === 0){
      //---updating error message and showing it----//
      setErrorMsg("Your username is empty!")
      setDisplayErrorStatus(true)
      
      //----Emptying out the inputs----//
      emptyInputs()
      return
    }

//-------______check if username already exists inside the database_____--------//
    try {
      const taken = await isUsernameTaken(username);
      if (taken) {
        setErrorMsg("This username has already been taken. Please type in a different username.");
        setDisplayErrorStatus(true);
        emptyInputs();
        return;
      }
    } 
    catch (err) {
      console.log("Error when checking if username is taken:", err);
      setErrorMsg("Something went wrong. Please try again.");
      setDisplayErrorStatus(true);
      return;
    }

//----_________checks that the password has met the conditions___________----//
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg(
        "Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, and 1 number."
      );
      setDisplayErrorStatus(true);
      emptyInputs();
      return;
    }
    
//---____the method for adding in a new user__________----//
    try {
      // Await the registerUser function
      const result = await registerUser(username, password);

      // Optionally navigate to login page
      navigation.navigate("LoginPage", {'successMessage': true});
    } 

    catch (error) {
      console.log("Error registering user:", error);
      setErrorMsg("Failed to register user. Try again.");
      setDisplayErrorStatus(true);
    }
    
  }

//---____For each time the user makes a mistake in the input when they press the create account button___---//
  const emptyInputs = () =>{
    setUsername("")
    setPassword("")
    setPasswordConfirmation("")
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
          <Text style={styles.navHeaderTitle}> Create new account </Text> 

        </View>

        {/*----Create new account Form-----*/}
        <View style={styles.createAccountContainer}>

          {/* Error message that appears when something goes wrong with the inputs */}
          {displayErrorStatus && (
            <Text  style={styles.errorMsg}> {errMsg} </Text>
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
            style={[styles.usernameAndPasswordInput, styles.passwordInput]}
            placeholder="Enter password"
            placeholderTextColor="#aaa"
            secureTextEntry //---So that the password is covered by ***----//
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.passwordConditionText}> 
            Password should be 8 characters long and consists of at least 1 Upper casing, 1 lower casing and 1 numeral character  
          </Text>

          <Text style={styles.inputLabels}> Confirm your Password</Text>
          <TextInput
            style={styles.usernameAndPasswordInput}
            placeholder="Re-enter password"
            placeholderTextColor="#aaa"
            secureTextEntry //---So that the password is covered by ***----//
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
          />

          <TouchableOpacity style={styles.createAccountBtn} onPress={createAccount}>
            <Text style={styles.createAccountTxt}> Create new account </Text>
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
  
  navSideMenuBtn: {
    fontSize: RFPercentage(4),
    color: 'white',
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
  //--This affects the body containing the inputs and labels---//
  createAccountContainer: {
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
    marginBottom: "8%",
    fontSize: RFPercentage(2.2),
  },
  
  //---removing the margin for just the password input---//
  passwordInput:{
    marginBottom: 0
  },
  
  createAccountBtn: {
    backgroundColor: "#4A90E2",
    marginTop: "5%",
    padding: "8%",
    borderRadius: 10,
    alignItems: "center",
  },

  createAccountTxt: {
    color: "white",
    fontWeight: "bold",
    fontSize: RFPercentage(2.5),
  },

  passwordConditionText:{
    fontSize: RFPercentage(1.5),
    paddingTop: "3%",
    paddingBottom: "10%"
  },
  
  //---This is for just the error message---//
  errorMsg:{
    paddingBottom: "5%",
    textAlign: "center",
    color: "red",
    fontSize: 17
  }

});