var firebaseadmin = require('firebase-admin');

var serviceAccount = require('./wprobo-ec23f-firebase-adminsdk-749b3-ef0238f1e2.json');

firebaseadmin.initializeApp({
  credential: firebaseadmin.credential.cert(serviceAccount)
});

const db = firebaseadmin.firestore();

exports.update = async function (userdata) {
  const userRegister = await db.collection('usuarios').doc(userdata['id']).set(userdata);
  return userRegister;
}

exports.queryByPhone = async function (phone) {
  let userdata = null;
  try {
      const queryRef = await db.collection('usuarios')
          .where('whatsapp', '==', phone)
          .get();
      if (!queryRef.empty) {
          queryRef.forEach((user) => {
              userdata = user.data();
              userdata['id'] = user.id;
          });
      }
  } catch (_error) {
      console.log(_error);
  }
  return userdata;
}
exports.save = async function (user) {
  user['date'] = firebaseadmin.firestore.Timestamp.fromDate(new Date());
  let newRegister = await db.collection('usuarios').add(user);
  user['id'] = newRegister.id;
  return user;
}
exports.queryByPhoneNot =  function (phone) {
  let userdata = null;
  try {
      const queryRef =  db.collection('usuarios')
          .where('whatsapp', '==', phone)
          .get();
      if (!queryRef.empty) {
           queryRef.forEach((user) => {
              userdata = user.data();
              userdata['id'] = user.id;
          });
      }
  } catch  {
    return userdata;
  }
  return userdata;
}