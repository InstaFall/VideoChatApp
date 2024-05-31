import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from '../reducers/userReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StackParamList } from '../navigation/types';

const Main = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<StackParamList>>();

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        dispatch(loadUser(JSON.parse(userData)));
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
    };

    loadUserData();
  }, [dispatch, navigation]);

  return null;
};

export default Main;
