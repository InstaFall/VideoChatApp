import { gql } from '@apollo/client';

export const GET_USER_BY_PHONE_NUMBER = gql`
  query getUserByPhoneNumber($phoneNumber: String!) {
    getUserByPhoneNumber(phoneNumber: $phoneNumber) {
      phoneNumber
      fullName
      callerId
    }
  }
`;

export const REGISTER_USER = gql`
  mutation register($phoneNumber: String!, $fullName: String!) {
    register(phoneNumber: $phoneNumber, fullName: $fullName) {
      phoneNumber
      fullName
      callerId
    }
  }
`;

export const UPDATE_USER_NAME = gql`
  mutation editUserName($phoneNumber: String!, $fullName: String!) {
    editUserName(phoneNumber: $phoneNumber, fullName: $fullName) {
      phoneNumber
      fullName
    }
  }
`;
