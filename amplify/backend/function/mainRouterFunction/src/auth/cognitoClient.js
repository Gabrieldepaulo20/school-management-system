// src/auth/cognitoClient.js
const {
  CognitoIdentityProviderClient,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_APP_CLIENT_ID;

module.exports = { cognitoClient, userPoolId, clientId };