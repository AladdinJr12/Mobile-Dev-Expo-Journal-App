1) cd to the journalApp 
  cd journalApp

2) Run these installation commands based on what device you are using (Note that I personally used windows + android phone for this application):
# Navigation (for apple)
expo install @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/drawer \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-get-random-values \
  @react-native-community/masked-view

# Navigation (for windows)
expo install @react-navigation/native `
  @react-navigation/stack `
  @react-navigation/drawer `
  react-native-screens `
  react-native-safe-area-context `
  react-native-gesture-handler `
  react-native-reanimated `
  react-native-get-random-values `
  @react-native-community/masked-view

# Expo APIs (For Apple)
expo install expo-notifications expo-location react-native-maps \
  react-native-webview @react-native-community/datetimepicker \
  expo-image-picker expo-camera expo-sqlite expo-crypto \
  @react-native-async-storage/async-storage

# Expo APIs (For Windows)
expo install expo-notifications expo-location react-native-maps `
  react-native-webview @react-native-community/datetimepicker `
  expo-image-picker expo-camera expo-sqlite expo-crypto `
  @react-native-async-storage/async-storage

# Extra libraries (For Apple)
npm install react-native-tableview-simple react-native-responsive-fontsize \
  emoji-mart-native react-native-pell-rich-editor react-native-google-places-autocomplete

# Extra libraries (For windows)
npm install react-native-tableview-simple react-native-responsive-fontsize `
  emoji-mart-native react-native-pell-rich-editor react-native-google-places-autocomplete

# Dev dependencies (testing) (For Apple)
npm install --save-dev jest-expo @testing-library/react-native \
  @testing-library/jest-native babel-jest @babel/preset-env @babel/preset-react

# Dev dependencies (testing) (For Windows)
npm install --save-dev jest-expo @testing-library/react-native `
  @testing-library/jest-native babel-jest @babel/preset-env @babel/preset-react


3) Next start the expo with:
npx expo start -c

4) Scan the qr code with the expo go app on your phone/device and start trying out the journal app!

