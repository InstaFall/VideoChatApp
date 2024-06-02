import { gql } from '@apollo/client';

export const GET_USER_BY_PHONE_NUMBER = gql`
  query getUserByPhoneNumber($phoneNumber: String!) {
    getUserByPhoneNumber(phoneNumber: $phoneNumber) {
      phoneNumber
      fullName
    }
  }
`;

export const REGISTER_USER = gql`
  mutation register($phoneNumber: String!, $fullName: String!) {
    register(phoneNumber: $phoneNumber, fullName: $fullName) {
      phoneNumber
      fullName
    }
  }
`;
