const { ApolloServer } = require('apollo-server');

const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');

const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

require('dotenv').config( { path: 'var.env' } );
connectDB();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context:  ({req}) => {
        const token = req.headers['authorization'] || '';
        //Verificar si el token de un usuario es válido
        if (token){
            try {
                const oficial = jwt.verify(token, process.env.FIRMA_SECRETA);
                return {
                    oficial
                }
            } catch (error){
                console.log(error);
            }
        }
    }
});

server.listen().then( ( { url } ) => {
    console.log(`Funcionando en: ${ url }`);
});