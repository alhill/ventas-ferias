const fetch = require("node-fetch")
const functions = require("firebase-functions");
const firebaseAdmin = require("firebase-admin")
const serviceAccount = require("./serviceAccount.json");
const uuid = require("uuid")
const cors = require('cors')({origin: true});
const _ = require("lodash")


firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});
const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth()

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

const getSumupToken = async () => {
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
  return access_token
}

exports.createCheckout = functions.region("europe-west1").https.onCall(async ({ email, userId, amount, userData, description }, ctx) => {
  const access_token = await getSumupToken()
  const body = JSON.stringify({
    checkout_reference: uuid.v4(),
    amount,
    currency: "EUR",
    merchant_code: merchantId,
    description,
    return_url: "https://europe-west1-feriantes-5288d.cloudfunctions.net/sumupCallsHere"
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
  const docRoute = userId ? `/users/${userId}/orders/${checkout.id}` : `/unregisteredOrders/${email}/orders/${checkout.id}`
  const checkoutAndAddress = {
    ...checkout,
    userData,
    docRoute
  }

  const resp = await db.doc(docRoute).set(checkoutAndAddress)

  if(resp){
    return checkoutAndAddress
  } else {
    throw new Error("Fallo al guardar el intento de pago")
  }
})

exports.sumupCallsHere = functions.region("europe-west1").https.onRequest((req, res) => {
  cors(req, res, async () => {
    const access_token = await getSumupToken()
    const checkoutId = req?.body?.id
    if(!checkoutId){
      res.status(400).send({ error: "Checkout ID not provided" })
    } else {
      const body = JSON.stringify({
        checkout_reference: uuid.v4(),
        amount,
        currency: "EUR",
        merchant_code: merchantId,
        description,
        return_url: "https://europe-west1-feriantes-5288d.cloudfunctions.net/sumupCallsHere"
      }, null, 2)
      const checkoutResp = await fetch(baseURL + "/v0.1/checkouts/" + checkoutId, {
        headers: {
          ...headers,
          authorization: "Bearer " + access_token
        },
        method: "GET"
      })
      const checkout = await checkoutResp.json()
      console.log(checkout)
    }


//     id: '5bea300c-3e7b-4bbf-9868-68d69a2269e9',
// status: 'SUCCESSFUL',
//  event_type: 'CHECKOUT_STATUS_CHANGED'

    return res.status(200).send("holi")
  });
})

