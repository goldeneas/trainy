# Trainy
Trainy is a self-hosted gym app I created because I didn't like available alternatives.\
Its main focus are open-air gyms, but it can be used with regular training as well.

It allows users to create custom routines and exercises, save gym locations and checkout stats about their training.\
Checkout the `screenshots/` directory!

# How it was made
Trainy was created using React Native for its mobile app, an golang for the backend.\
This means that you have to:
- Host the backend on a machine with golang installed
- Compile and install the mobile app on your phone using expo

# How to setup
1. Download the repository
2. Go into react/ and install the app on your phone (see below for more info)
3. Go into backend/ and run `go run .` to start the backend
4. Backend is now running at `localhost:8080` by default

# How do I install the app on my phone!
I haven't tested android usage yet, but here are the steps I follow for iOS:
1. Go into react/
2. Run `npx expo run:ios --device --configuration Release`
3. Pick your device from the list
4. Unlock your device and wait! The app will open once done

I believe android steps are similar (if not easier), but I haven't tested it yet.
Feel free to contribute!

## I can't find my device on the list!
Make sure you are on the latest macOS version; then, update XCode from the app store.\
Open XCode and check if you can find your device there.\
If you can't, you need to connect your device using a cable to pair it with XCode.\
Once your device is paired, you should be able to see it in the list expo gives you.

# AI Usage
The frontend is mainly vibe coded (who cares lol).\
The backend and database structure are all-human.
