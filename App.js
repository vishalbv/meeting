/**
 * Sample React Native App
 *
 * adapted from App.js generated by the following command:
 *
 * react-native init example
 *
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  NativeEventEmitter,
} from 'react-native';

import RNZoomUsBridge from 'react-native-zoom-us';

const ZOOM_APP_KEY = 'L5HeXkhG9ecSaTRfBeheh79SQUpMu5M1MWrI';
const ZOOM_APP_SECRET = 'IYgBpw3wxuOTKUjstCdFByz1yOWSo1PNUqYQ';
const ZOOM_JWT_APP_KEY = 'tI9KdgP9RVyQuhwr26lU1w';
const ZOOM_JWT_APP_SECRET = 'lmPFdSyraywa7NN7PLtYGHpoqtKFNAlrEDF2';

export default class App extends Component {
  state = {
    meetingId: '',
    meetingPassword: '',
    meetingTitle: '',
    userName: '',
    userEmail: '',
    userId: '',
    accessToken: '',
    userZoomAccessToken: '',
    meetingCreated: false,
    view: 'host',
  };

  componentDidMount() {
    console.log('did monut');
    this.createAccessToken();
    this.initializeZoomSDK();
  }

  initializeZoomSDK = () => {
    console.log('initialinmdk');
    if (!ZOOM_APP_KEY || !ZOOM_APP_SECRET) return false;

    // init sdk

    RNZoomUsBridge.initialize({
      clientKey: ZOOM_APP_KEY,
      clientSecret: ZOOM_APP_SECRET,
    });
  };

  //   RNZoomUsBridge.initialize(ZOOM_APP_KEY, ZOOM_APP_SECRET)
  //     .then()
  //     .catch(err => {
  //       console.warn(err);
  //       Alert.alert('error! dndj', err.message);
  //     });
  // };

  joinMeeting = async () => {
    const {meetingId, userName, meetingPassword} = this.state;

    if (!meetingId || !userName || !meetingPassword) return false;

    // RNZoomUsBridge.joinMeeting(String(meetingId), userName, meetingPassword)
    //   .then()
    //   .catch(err => {
    //     console.warn(err);
    //     Alert.alert('error!', err.message);
    //   });

    RNZoomUsBridge.joinMeeting({
      // userName: 'Johny',
      // meetingNumber: '12345678',

      meetingNumber: String(meetingId),
      userName,
      // meetingPassword,
    });
  };

  createAccessToken = async () => {
    // to talk to ZOOM API you will need access token
    if (!ZOOM_JWT_APP_KEY || !ZOOM_JWT_APP_SECRET) return false;
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6InRJOUtkZ1A5UlZ5UXVod3IyNmxVMXciLCJleHAiOjE2MjIzMDYwNzIsImlhdCI6MTYyMTcwMTI3MX0.1gUuKtVoWk2JhPl4BcZg78YRXPGHls3fqxKUW4sBjf0';
    // console.log('hhhhhhhhhhhh');
    // const accessToken = await RNZoomUsBridge.createJWT(
    //   ZOOM_JWT_APP_KEY,
    //   ZOOM_JWT_APP_SECRET,
    // )
    //   .then()
    //   .catch(err => console.log(err));

    console.log(`createAccessToken ${accessToken}`);

    if (accessToken) this.setState({accessToken});
  };

  getUserID = async (userEmail, accessToken) => {
    const fetchURL = `https://api.zoom.us/v2/users/${userEmail}`;
    const userResult = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });

    console.log('userResult', userResult);

    if (userResult && userResult.code === 429) {
      // rate error try again later
      Alert.alert('API Rate error try again in a few seconds');
    }

    if (userResult && userResult.id && userResult.status === 'active') {
      // set user id
      const {id: userId} = userResult;

      this.setState({userId});

      return userId;
    }

    return false;
  };

  createUserZAK = async (userId, accessToken) => {
    const fetchURL = `https://api.zoom.us/v2/users/${userId}/token?type=zak`;
    const userZAKResult = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });

    console.log('userZAKResult', userZAKResult);

    if (userZAKResult && userZAKResult.code === 429) {
      // rate error try again later
      Alert.alert('API Rate error try again in a few seconds');
    }

    if (userZAKResult && userZAKResult.token) {
      // set user id
      const {token} = userZAKResult;

      this.setState({
        userZoomAccessToken: token,
      });

      return token;
    }

    return false;
  };

  createMeeting = async () => {
    const {accessToken, userEmail, meetingTitle} = this.state;
    console.log('outside', accessToken);

    if (!accessToken || !meetingTitle || !userEmail) return false;
    console.log('indisde');
    // user ID is pulled from jwt end point using the email address
    const userId = await this.getUserID(userEmail, accessToken);
    await this.createUserZAK(userId, accessToken);

    if (userId) {
      // use api to create meeting

      const fetchURL = `https://api.zoom.us/v2/users/${userId}/meetings`;
      const createMeetingResult = await fetch(fetchURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: meetingTitle,
          type: 1,
          duration: 30,
          password: '123456', // set your own password is possible
          settings: {
            waiting_room: false,
            registrants_confirmation_email: false,
            audio: 'voip',
          },
        }),
      })
        .then(response => response.json())
        .then(json => {
          return json;
        })
        .catch(error => {
          console.error(error);
        });

      console.log('createMeetingResult', createMeetingResult);

      if (createMeetingResult && createMeetingResult.code === 429) {
        // rate error try again later
        Alert.alert('API Rate error try again in a few seconds');
      }

      if (createMeetingResult && createMeetingResult.id) {
        const {id, password} = createMeetingResult;
        this.setState({
          meetingId: id,
          meetingPassword: password,
          meetingCreated: true,
        });
      }
    }
  };

  startMeeting = async () => {
    const {meetingId, userId, userName, userZoomAccessToken} = this.state;
    console.log(meetingId, userId, userName, userZoomAccessToken);

    if (!meetingId || !userId || !userZoomAccessToken) return false;
    console.log('inside', meetingId, userId, userName, userZoomAccessToken);
    // await RNZoomUsBridge.startMeeting(
    //   String(meetingId),
    //   userName,
    //   userId,
    //   userZoomAccessToken,
    // );
    RNZoomUsBridge.startMeeting({
      userName: 'dsdsd',
      meetingNumber: String(meetingId),
      userId: userId,
      zoomAccessToken: userZoomAccessToken,
      userType: 2, // optional
    });
  };

  viewJoin = () => this.setState({view: 'join'});

  viewHost = () => this.setState({view: 'host'});

  render() {
    const {
      meetingId,
      userName,
      meetingCreated,
      userEmail,
      accessToken,
      meetingTitle,
      meetingPassword,
      view,
    } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>???RNZoomUsBridge example???</Text>
        {!ZOOM_APP_KEY || !ZOOM_APP_SECRET ? (
          <Text style={styles.welcome}>
            ZOOM_APP_KEY and ZOOM_APP_SECRET must be set
          </Text>
        ) : null}
        {!ZOOM_JWT_APP_KEY || !ZOOM_JWT_APP_SECRET ? (
          <Text style={styles.welcome}>
            optional ZOOM_JWT_APP_KEY and ZOOM_JWT_APP_SECRET must be set to
            host meetings
          </Text>
        ) : null}
        {view === 'select' ? (
          <>
            <TouchableOpacity onPress={this.viewJoin} style={styles.button}>
              <Text style={styles.buttonText}>Join a Meeting</Text>
            </TouchableOpacity>
            {accessToken ? (
              <TouchableOpacity onPress={this.viewHost} style={styles.button}>
                <Text style={styles.buttonText}>Host a Meeting</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
        {view === 'join' ? (
          <>
            <TextInput
              value={meetingId}
              placeholder="Meeting ID"
              onChangeText={text => this.setState({meetingId: text})}
              style={styles.input}
            />
            <TextInput
              value={meetingPassword}
              placeholder="Meeting Password"
              onChangeText={text => this.setState({meetingPassword: text})}
              style={styles.input}
            />
            <TextInput
              value={userName}
              placeholder="Your name"
              onChangeText={text => this.setState({userName: text})}
              style={styles.input}
            />
            <TouchableOpacity onPress={this.joinMeeting} style={styles.button}>
              <Text style={styles.buttonText}>Join Meeting</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {view === 'host' ? (
          <>
            <TextInput
              value={userEmail}
              placeholder="Your zoom email address"
              onChangeText={text => this.setState({userEmail: text})}
              style={styles.input}
            />
            <TextInput
              value={meetingTitle}
              placeholder="Meeting title"
              onChangeText={text => this.setState({meetingTitle: text})}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={this.createMeeting}
              style={styles.button}>
              <Text style={styles.buttonText}>Create Meeting</Text>
            </TouchableOpacity>
            {meetingCreated ? (
              <>
                <TextInput
                  value={meetingId.toString()}
                  placeholder="Meeting ID"
                  style={styles.input}
                  editable={false}
                />
                <TextInput
                  value={meetingPassword}
                  placeholder="Meeting Password"
                  style={styles.input}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={this.startMeeting}
                  style={styles.button}>
                  <Text style={styles.buttonText}>Start Meeting</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  input: {
    width: 200,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'grey',
    margin: 3,
  },
  button: {
    width: 200,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'salmon',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  buttonText: {
    color: 'white',
  },
});
