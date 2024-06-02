import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from '../reducers/userReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useLazyQuery } from '@apollo/client';
import { GET_USER_BY_PHONE_NUMBER } from '../queries';
import { StackParamList } from '../navigation/types';

const Main = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<StackParamList>>();
  const [loading, setLoading] = useState(true);

  const [getUserByPhoneNumber, { data, loading: queryLoading, error }] =
    useLazyQuery(GET_USER_BY_PHONE_NUMBER, {
      fetchPolicy: 'network-only',
      onCompleted: data => {
        if (data.getUserByPhoneNumber) {
          dispatch(loadUser(data.getUserByPhoneNumber));
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Register' }],
          });
        }
        setLoading(false);
      },
      onError: error => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      },
    });

  useEffect(() => {
    const checkUserRegistration = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const { phoneNumber } = JSON.parse(userData);
        getUserByPhoneNumber({ variables: { phoneNumber } });
      } else {
        setLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Register' }],
        });
      }
    };

    checkUserRegistration();
  }, [dispatch, navigation, getUserByPhoneNumber]);

  if (loading || queryLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Main;
