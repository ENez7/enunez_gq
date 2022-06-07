const mongoose = require('mongoose');
require('dotenv').config( { path: 'var.env' } );

const connectDB = async () => {
  try{
      await mongoose.connect(process.env.DB_MONGO, {
          useNewUrlParser: true,
          useUnifiedTopology: true
      });
      console.log('Base de datos conectada');
  }catch (e) {
      console.log('No se pudo conectar con la base de datos');
      console.log(e);
      process.exit(1);
  }
};

module.exports = connectDB;