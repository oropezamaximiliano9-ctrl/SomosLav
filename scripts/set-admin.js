import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load service account from local file
let serviceAccount;
try {
  const serviceAccountPath = resolve('./serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error("❌ Error: No se encontró el archivo serviceAccountKey.json.");
  console.error("Asegúrate de descargar tu llave privada desde la consola de Firebase");
  console.error("(Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada)");
  console.error("y guardarla en la raíz del proyecto como 'serviceAccountKey.json'.");
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const makeUserAdmin = async (identifier) => {
  try {
    let userRecord;
    
    // Check if identifier is an email (contains @)
    if (identifier.includes('@')) {
      console.log(`Buscando usuario por correo: ${identifier}...`);
      userRecord = await admin.auth().getUserByEmail(identifier);
    } else {
      console.log(`Buscando usuario por UID: ${identifier}...`);
      userRecord = await admin.auth().getUser(identifier);
    }

    const uid = userRecord.uid;
    
    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Update user document in Firestore to reflect the role
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ ¡Éxito! El usuario ${userRecord.email || uid} ahora es administrador.`);
    console.log(`Por favor, pide al usuario que cierre sesión y vuelva a ingresar para aplicar los cambios.`);
    
  } catch (error) {
    console.error("❌ Error al otorgar permisos de administrador:");
    if (error.code === 'auth/user-not-found') {
      console.error(`No se encontró ningún usuario con el identificador: ${identifier}`);
    } else {
      console.error(error);
    }
  } finally {
    process.exit(0);
  }
};

const identifier = process.argv[2];

if (!identifier) {
  console.log("Uso: node scripts/set-admin.js <UID o CORREO>");
  console.log("Ejemplo: node scripts/set-admin.js admin@lavanderia.com");
  process.exit(1);
}

makeUserAdmin(identifier);
