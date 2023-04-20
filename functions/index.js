const fetch = require("node-fetch")
const functions = require("firebase-functions");
const firebaseAdmin = require("firebase-admin")
const serviceAccount = require("./serviceAccount.json");
const { HttpsError } = require("firebase-functions/v1/auth");
const uuid = require("uuid")
const _ = require("lodash")


firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});
const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth()

exports.createCheckout = functions.region("europe-west1").https.onCall(async ({ email, userId, amount, userData }, ctx) => {
  const { 
    SUMUP_CLIENT_ID: clientId,
    SUMUP_MERCHANT_CODE: merchantId,
    SUMUP_SECRET_KEY: secret
  } = process.env

  const baseURL = "https://api.sumup.com"
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }

  const sumupTokenResp = await fetch(baseURL + "/token", {
    headers,
    method: "POST",
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: secret
    })
  })
  const { access_token } = await sumupTokenResp.json()

  const body = JSON.stringify({
    checkout_reference: uuid.v4(),
    amount,
    currency: "EUR",
    merchant_code: merchantId,
    description: "atún",
  }, null, 2)
  const checkoutResp = await fetch(baseURL + "/v0.1/checkouts", {
    headers: {
      ...headers,
      authorization: "Bearer " + access_token
    },
    method: "POST",
    body
  })
  const checkout = await checkoutResp.json()
  const checkoutAndAddress = {
    ...checkout,
    userData
  }

  const docRoute = userId ? `/users/${userId}/checkouts/${checkout.id}` : `/unregisteredCheckouts/${email}/${checkout.id}`
  const resp = await db.doc(docRoute).set(checkoutAndAddress)

  if(resp){
    return checkout
  } else {
    throw new Error("Fallo al guardar el intento de pago")
  }
  
})

