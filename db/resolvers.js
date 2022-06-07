const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Banco = require('../models/Banco');
const Cliente = require('../models/Cliente');
const Cuenta = require('../models/Cuenta');
const Oficial = require('../models/OficialBanco');
const Sucursal = require('../models/Sucursal');
const Transaccion = require('../models/Transaccion');

require('dotenv').config( { path: 'var.env' } );

const CrearToken = ( oficial, firma, expiresIn ) => {
    const { id, email, nombre, creado, bancoId } = oficial;
    return jwt.sign( { id, email, nombre, creado, bancoId }, firma, { expiresIn } );
};

const resolvers = {
    Query: {
        // TOKEN
        encriptarTokenOficial: async (_, { input } ) => {
            const { email, password } = input;

            const existeOficial = await Oficial.findOne( { email } );
            if(!existeOficial)
                throw new Error(`El email ${ email } no existe.`);

            const passwordCorrecto = await bcryptjs.compare(password, existeOficial.password);
            if(!passwordCorrecto)
                throw new Error('Password incorrecto');

            return {
                token: CrearToken(existeOficial, process.env.FIRMA_SECRETA, 300000)
            };
        },
        desencriptarTokenOficial: (_, { token } ) => {
            return jwt.verify( token, process.env.FIRMA_SECRETA);
        },
        // OFICIAL
        obtenerOficiales: async () => {
            return Oficial.find();
        },
        // BANCO
        obtenerBancos: async () => {
            return Banco.find({});
        },
        obtenerBancoId: async (_, { id } ) => {
            const existeBanco = await Banco.findById( id );
            if(!existeBanco)
                throw new Error(`No existe el banco con id ${ id }`);
            return existeBanco;
        },
        // CLIENTE
        obtenerClientes: async () => {
            return Cliente.find();
        },
        obtenerClienteId: async (_, { id }, ctx ) => {
            const existeCliente = await Cliente.findById( id );
            if(!existeCliente)
                throw new Error(`Cliente con id ${ id } no existe.`);
            // SOLO SU OFICIAL LO PUEDE VER
            if(existeCliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene los permisos para ver este usuario.');
            return existeCliente;
        },
        obtenerClienteOficial: async (_, {}, ctx ) => {
            const clientes = await Cliente.find( { oficialBancoId: ctx.oficial.id } );
            if(!clientes)
                throw new Error(`No existen clientes para este oficial.`);
            return clientes;
        },
        // SUCURSAL
        obtenerSucursales: async () => {
            return Sucursal.find();
        },
        obtenerSucursalId: async (_, { id } ) => {
            const sucursal = await Sucursal.findOne({ id } );
            if(!sucursal)
                throw new Error(`Sucursal con id ${ id } no existe.`);
            return sucursal;
        },
        obtenerSucursalesBancoId: async (_, { id } ) => {
            const existeBanco = await Banco.findById( id );
            if(!existeBanco)
                throw new Error(`Banco con ${ id } no existe.`);
            return Sucursal.find({bancoId: id});
        },
        // CUENTA
        obtenerCuentas: async () => {
            return Cuenta.find();
        },
        obtenerCuentaId: async (_, { id }, ctx ) => {
            const existeCuenta = await Cuenta.findById( id );
            if(!existeCuenta)
                throw new Error(`La cuenta con id ${ id } no existe.`)

            const cliente = await Cliente.findById(existeCuenta.clienteId);
            if(cliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para ver esta cuenta');

            return existeCuenta;
        },
        obtenerCuentasCliente: async (_, { id }, ctx ) => {
            const existeCliente = await Cliente.findById( id );
            if(!existeCliente)
                throw new Error(`El cliente con id ${ id } no existe.`);
            if(existeCliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para ver estas cuentas');
            return Cuenta.find( { clienteId: id } );
        },
        obtenerCuentasOficial: async (_, {}, ctx ) => {
            try {
                const cuentas = await Cuenta.find();
                let cuentasCliente = [];
                for(const cuenta of cuentas) {
                    const cliente = await Cliente.findById( cuenta.clienteId );
                    if(cliente.oficialBancoId.toString() === ctx.oficial.id) {
                        cuentasCliente.push(cuenta);
                    }
                }
                return cuentasCliente;
            } catch (e) {
                console.log(e);
            }
        },
        // TRANSACCION
        obtenerTransacciones: async () => {
            return Transaccion.find( { } );
        },
        obtenerTransaccionId: async (_, { id }, ctx ) => {
            const existeTransaccion = await Transaccion.findById( id );
            if(!existeTransaccion)
                throw new Error(`La transaccion con id ${ id } no existe.`);

            const clienteOrigen = await Cliente.findById( existeTransaccion.clienteOrigen );
            const clienteDestino = await Cliente.findById( existeTransaccion.clienteDestino );
            if(clienteOrigen.oficialBancoId.toString() !== ctx.oficial.id
                || clienteDestino.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para ver esta cuenta.');

            return existeTransaccion;
        },
        obtenerTransaccionesCliente: async (_, { id }, ctx ) => {
            const existeCliente = await Cliente.findById( id );
            if(!existeCliente)
                throw new Error(`El cliente con id ${ id } no existe.`);

            if(existeCliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para ver esta cuenta.');

            return Transaccion.find( { clienteOrigen: id } );
        },
        // QUERIES AVANZADOS
        obtenerSaldosPorSucursal: async (_, { id }, ctx) => {
            const existeSucursal = await Sucursal.findById( id );
            if(!existeSucursal)
                throw new Error(`La sucursal con id ${ id } no existe.`);

            if(existeSucursal.bancoId.toString() !== ctx.oficial.bancoId)
                throw new Error('No tiene las credenciales para ver estas cuentas.');

            return Cuenta.find( { sucursalId: id } );
        },
        obtenerClienteMasTransaccionesSucursal: async (_, { id }, ctx ) => {
            const existeSucursal = await Sucursal.findById( id );
            if(!existeSucursal)
                throw new Error(`La sucursal con id ${ id } no existe.`);

            if(existeSucursal.bancoId.toString() !== ctx.oficial.bancoId)
                throw new Error('No tiene las crendenciales para ver esta informacion.');

            const clienteMasTransacciones = {
                cliente: null,
                sucursal: existeSucursal,
                montoTotal: 0.0,
                transacciones: 0,
            };

            const cuentas = await Cuenta.find( { sucursalId: id } );
            for await (const cuenta of cuentas) {
                const { cliente } = cuenta;
                const filtro = {
                    clienteOrigen: cliente,
                    sucursalOrigen: id
                };
                const transacciones = await Transaccion.count( filtro );

                if(transacciones > clienteMasTransacciones.transacciones) {
                    clienteMasTransacciones.cliente = await Cliente.findById( cliente );
                    const transaccion = await Transaccion.find( filtro );
                    let montoAcum = 0.0;
                    for await (const tr of transacciones)
                        montoAcum += tr.monto;

                    clienteMasTransacciones.montoTotal = montoAcum;
                    clienteMasTransacciones.transacciones = transacciones;
                }
            }

            return clienteMasTransacciones;
        },
        mejorOficial: async () => {
            const oficiales = await Oficial.find( {} );
            const mejorOficial = {
                cantidadClientes: 0,
                oficial: null
            };

            for await (const oficial of oficiales) {
                const { id } = oficial;
                const cantClientes = await Cliente.count( { oficialBancoId: id } );
                if(cantClientes > mejorOficial.cantidadClientes) {
                    mejorOficial.cantidadClientes = cantClientes;
                    mejorOficial.oficial = oficial;
                }
            }

            return mejorOficial;
        }
    },
    Mutation: {
        // OFICIAL
        nuevoOficial: async (_, { input } ) => {
            const { email, password } = input;
            const existeOficial = await Oficial.findOne({ email } );
            if(existeOficial)
                throw new Error(`El correo ${ email } ya fue utilizado.`);

            const salt = await bcryptjs.genSaltSync(10);
            input.password = await bcryptjs.hash( password, salt );

            try {
                const oficial = new Oficial( input );
                await oficial.save();
                return oficial;
            } catch (e) {
                console.log(`Oficial: ${ e }`);
            }
        },
        // BANCO
        nuevoBanco: async (_, { input } ) => {
            const { nombre } = input;

            const existeBanco = await Banco.findOne( { nombre } );
            if(existeBanco)
                throw new Error(`El banco ${ nombre } ya existe.`);

            const banco = new Banco( input );
            return await banco.save();
        },
        actualizarBanco: async (_, { id, input } ) => {
            const existeBanco = await Banco.findById( id );
            if(!existeBanco)
                throw new Error(`El banco con id ${ id } no existe.`);

            return Banco.findByIdAndUpdate( id, input, { new: true } );
        },
        eliminarBanco: async (_, { id } ) => {
            await Banco.findByIdAndDelete( id );
            return 'Eliminacion finalizada';
        },
        // CLIENTE
        nuevoCliente: async (_, { input } ) => {
            const cliente = new Cliente( input );
            await cliente.save();
            return cliente;
        },
        actualizarCliente: async (_, { id, input } ) => {
            const existeCliente = await Cliente.findOne( { id } );
            if(!existeCliente)
                throw new Error(`Cliente con id ${ id } no existe.`);

            return Cliente.findByIdAndUpdate( id, input, { new: true } );
        },
        eliminarCliente: async (_, { id } ) => {
            await Cliente.findByIdAndDelete( id );
            return 'Cliente eliminado';
        },
        // SUCURSAL
        nuevaSucursal: async (_, { input } ) => {
            const { nombre, direccion, bancoId } = input;
            const existeDireccion = await Sucursal.findOne( { direccion } );
            if(existeDireccion)
                throw new Error(`La direccion ${ direccion } ya fue registrada.`);

            const sucursales = await Sucursal.find( { bancoId } );
            for( const sucursal of sucursales ) {
                if(sucursal.nombre === nombre)
                    throw new Error(`El nombre ${ nombre } ya fue registrado.`);
            }

            const sucursal = new Sucursal(input);
            return await sucursal.save();
        },
        actualizarSucursal: async (_, { id, input } ) => {
            const { nombre, direccion, bancoId } = input;
            const existeSucursal = await Sucursal.findById( id );
            if(!existeSucursal)
                throw new Error(`La sucursal con id ${ id } no existe.`);

            return Sucursal.findByIdAndUpdate( id, input, { new: true } );
        },
        eliminarSucursal: async (_, { id } ) => {
            const existeSucursal = await Sucursal.findById( id );
            if(!existeSucursal)
                throw new Error(`La sucursal con id ${ id } no existe.`);
            await Sucursal.findByIdAndDelete( id );
            return 'Sucursal eliminada';
        },
        // CUENTA
        nuevaCuenta: async (_, { input }, ctx ) => {
            const { numeroCuenta, clienteId, saldoCuenta, sucursalId } = input;
            const existeCliente = await Cliente.findById( clienteId );
            if (!existeCliente) {
                throw new Error(`El Cliente con el ID ${ clienteId } no existe.`)
            }
            const existeSucursal = await Sucursal.findById( sucursalId );
            if (!existeSucursal) {
                throw new Error(`La Sucursal con el ID ${ sucursalId } no existe`);
            }
            const banco = await Banco.findById( ctx.oficial.bancoId );
            if (existeSucursal.bancoId.toString() !== ctx.oficial.bancoId) {
                throw new Error(`La Sucursal ${ existeSucursal.nombre } no pertenece al banco ${ banco.nombre }.`)
            }
            if (existeCliente.oficialBancoId.toString() !== ctx.oficial.id) {
                throw new Error('No tiene las credenciales para realizar esta operación.')
            }
            const existeNumeroCuenta = await Cuenta.findOne( { numeroCuenta } );
            if (existeNumeroCuenta) {
                if (existeNumeroCuenta.bancoId.toString() === existeSucursal.bancoId.toString()) {
                    throw new Error(`El numero de cuenta ${ numeroCuenta } ya existe en el banco.`)
                }
            }
            if (saldoCuenta < 0) {
                throw new Error(`El saldo de cuenta ${ saldoCuenta } no puede ser negativo.`)
            }

            const actualizarCliente = await Cliente.findById( clienteId );
            actualizarCliente.saldoTotal = actualizarCliente.saldoTotal + saldoCuenta;
            await Cliente.findByIdAndUpdate( { _id: clienteId }, actualizarCliente, { new: true } );
            const nuevaCuenta = new Cuenta(input);
            nuevaCuenta.bancoId = ctx.oficial.bancoId;
            nuevaCuenta.sucursalId = sucursalId;
            return await nuevaCuenta.save();
        },
        actualizarCuenta: async (_, { id, input }, ctx ) => {
            const { numeroCuenta, clienteId, saldoCuenta, sucursalId } = input;
            const existeCuenta = await Cuenta.findById( id );
            if(!existeCuenta)
                throw new Error(`La cuenta con id ${ id } no existe.`);

            const existeCliente = await Cliente.findById( clienteId );
            if(!existeCliente)
                throw new Error(`El cliente con id ${ clienteId } no existe.`);

            const existeSucursal = await Sucursal.findById( sucursalId );
            if(!existeSucursal)
                throw new Error(`La sucursal con id ${ id } no existe.`);

            const banco = await Banco.findById( ctx.oficial.bancoId );
            if(existeSucursal.bancoId.toString() !== ctx.oficial.bancoId )
                throw new Error(`La sucursal ${ existeSucursal.nombre } no pertenece al banco ${ banco.nombre }`);

            if(existeCliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para realizar esta operacion.')

            if(numeroCuenta !== existeCuenta.numeroCuenta) {
                const existeNumeroCuenta = await Cuenta.findOne( { numeroCuenta } );
                if(existeNumeroCuenta) {
                    if (existeCuenta.bancoId.toString() === existeSucursal.bancoId.toString()) {
                        throw new Error(`El numero de cuenta ${numeroCuenta} ya existe en el banco.`)
                    }
                }
            }

            if(saldoCuenta < 0)
                throw new Error('El saldo de la cuenta no puede ser negativo.');

            const diferenciaSaldo = saldoCuenta - existeCuenta.saldoCuenta;
            const actualizarCliente = await Cliente.findById( clienteId );
            actualizarCliente.saldoTotal = actualizarCliente.saldoTotal + diferenciaSaldo;
            await Cliente.findByIdAndUpdate( { _id: clienteId }, input, { new: true } );
            return Cuenta.findByIdAndUpdate( { _id: id }, input, { new: true } );
        },
        eliminarCuenta: async (_, { id }, ctx ) => {
            const existeCuenta = await Cuenta.findById( id );
            if(!existeCuenta)
                throw new Error(`La cuenta con id ${ id } no existe.`);

            const cliente = await Cliente.findById( existeCuenta.clienteId );
            if(cliente.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para realizar esta operacion.');

            await Cuenta.findByIdAndDelete( id );
            return 'Cuenta eliminada';
        },
        // TRANSACCION
        nuevaTransaccion: async (_, { input }, ctx ) => {
            const { cuentaOrigen, cuentaDestino, monto } = input;
            const existeCuentaOrigen = await Cuenta.findById( cuentaOrigen );
            if(!existeCuentaOrigen)
                throw new Error(`La cuenta de origen con id ${ cuentaOrigen } no existe.`);

            const existeCuentaDestino = await Cuenta.findById( cuentaDestino );
            if(!existeCuentaDestino)
                throw new Error(`La cuenta de destino con id ${ cuentaDestino } no existe.`);

            const clienteOrigen = await Cliente.findById( existeCuentaOrigen.clienteId );
            const clienteDestino = await Cliente.findById( existeCuentaDestino.clienteId );
            if(clienteOrigen.oficialBancoId.toString() !== ctx.oficial.id
                || clienteDestino.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para realizar esta operacion.');

            if(monto <= 0)
                throw new Error('El monto debe ser mayor a cero.');

            if(monto > existeCuentaOrigen.saldoCuenta)
                throw new Error('Saldo insuficiente en la cuenta de origen.');

            clienteOrigen.saldoTotal = clienteOrigen.saldoTotal - monto;
            clienteDestino.saldoTotal = clienteDestino.saldoTotal + monto;
            if (clienteOrigen.id !== clienteDestino.id) {
                await Cliente.findByIdAndUpdate( { _id: existeCuentaOrigen.clienteId }, clienteOrigen, { new: true } );
                await Cliente.findByIdAndUpdate( { _id: existeCuentaDestino.clienteId }, clienteDestino, { new: true } );
            }

            existeCuentaOrigen.saldoCuenta = existeCuentaOrigen.saldoCuenta - monto;
            existeCuentaDestino.saldoCuenta = existeCuentaDestino.saldoCuenta + monto;
            await Cuenta.findByIdAndUpdate( { _id: cuentaOrigen }, existeCuentaOrigen, { new: true } );
            await Cuenta.findByIdAndUpdate( { _id: cuentaDestino }, existeCuentaDestino, { new: true } );

            try {
                const nuevaTransaccion = new Transaccion( input );
                nuevaTransaccion.clienteOrigen = existeCuentaOrigen.clienteId;
                nuevaTransaccion.clienteDestino = existeCuentaDestino.clienteId;
                nuevaTransaccion.sucursalOrigen = existeCuentaOrigen.sucursalId;
                nuevaTransaccion.sucursalDestino = existeCuentaDestino.sucursalId;
                nuevaTransaccion.bancoId = ctx.oficial.bancoId;

                return await nuevaTransaccion.save();
            } catch (e) {
                console.log(`TRANSACCION: ${ e }`);
            }
        },
        revertirTransaccion: async (_, { input }, ctx ) => {
            const existeTransaccion = await Transaccion.findById( id );
            if(!existeTransaccion)
                throw new Error(`La transaccion con id ${ id } no existe.`);

            const clienteOrigen = await Cliente.findById( existeTransaccion.clienteOrigen );
            const clienteDestino = await Cliente.findById( existeTransaccion.clienteDestino );
            if(clienteOrigen.oficialBancoId.toString() !== ctx.oficial.id
                || clienteDestino.oficialBancoId.toString() !== ctx.oficial.id)
                throw new Error('No tiene las credenciales para realizar esta operacion.');

            clienteOrigen.saldoTotal = clienteOrigen.saldoTotal + existeTransaccion.monto;
            clienteDestino.saldoTotal = clienteDestino.saldoTotal - existeTransaccion.monto;
            if(clienteOrigen.id !== clienteDestino.id) {
                await Cliente.findByIdAndUpdate( { _id: existeTransaccion.clienteOrigen }, clienteOrigen, { new: true } );
                await Cliente.findByIdAndUpdate( { _id: existeTransaccion.clienteDestino }, clienteDestino, { new: true } );
            }

            const cuentaOrigen = await Cuenta.findById(existeTransaccion.cuentaOrigen);
            const cuentaDestino = await Cuenta.findById(existeTransaccion.cuentaDestino);
            cuentaOrigen.saldoCuenta = cuentaOrigen.saldoCuenta + existeTransaccion.monto;
            cuentaDestino.saldoCuenta = cuentaDestino.saldoCuenta - existeTransaccion.monto;
            await Cuenta.findByIdAndUpdate( { _id: existeTransaccion.cuentaOrigen }, cuentaOrigen, { new: true } );
            await Cuenta.findByIdAndUpdate( { _id: existeTransaccion.cuentaDestino }, cuentaDestino, { new: true } );

            try {
                const nuevaTransaccion = new Transaccion();
                nuevaTransaccion.cuentaOrigen = existeTransaccion.cuentaDestino;
                nuevaTransaccion.cuentaDestino = existeTransaccion.cuentaOrigen;
                nuevaTransaccion.monto = existeTransaccion.monto;
                nuevaTransaccion.referencia = `Reversion: ${ existeTransaccion.referencia }`;
                nuevaTransaccion.clienteOrigen = existeTransaccion.clienteDestino;
                nuevaTransaccion.clienteDestino = existeTransaccion.clienteOrigen;
                nuevaTransaccion.sucursalOrigen = existeTransaccion.sucursalDestino;
                nuevaTransaccion.sucursalDestino = existeTransaccion.sucursalOrigen;
                nuevaTransaccion.bancoId = existeTransaccion.bancoId;
                return await nuevaTransaccion.save();
            } catch (e) {
                console.log(`N TRANSACCION: ${ e }`);
            }
        }
    },
};

module.exports = resolvers;