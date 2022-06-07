const { gql } = require( 'apollo-server' );

const typeDefs = gql `
    # Types
    type Oficial {
        id: ID
        nombre: String
        email: String
        creado: String
        bancoId: ID
    }
    
    type Banco {
        id: ID
        nombre: String
    }
    
    type Sucursal {
        id: ID
        nombre: String
        direccion: String
        bancoId: ID
    }
    
    type Cliente {
        id: ID
        nombre: String
        telf: String
        direccion: String
        saldoTotal: Float
        tipoCliente: TipoCliente
        oficialBancoId: ID
    }
    
    type Cuenta {
        id: ID
        tipoCuenta: TipoCuenta
        numeroCuenta: Int
        clienteId: ID
        bancoId: ID
        sucursal: ID
        saldoCuenta: Float
    }

    type Transaccion {
        id: ID
        cuentaOrigen: ID
        cuentaDestino: ID
        monto: Float
        referencia: String
        clienteOrigen: ID
        clienteDestino: ID
        sucursalOrigen: ID
        sucursalDestino: ID
        banco: ID
        fecha: String
    }
    
    type SaldoCliente {
        id: ID
        clienteId: ID
        saldoCuenta: Float
    }
    
    type TransaccionesClienteSucursal {
        cliente: Cliente
        sucursal: Sucursal
        montoTotal: Float
        transacciones: Int
    }
    
    type MejorOficial {
        cantidadClientes: Int
        oficial: Oficial
    }
    
    type Token {
        token: String
    }
    
    # Enums
    enum TipoCliente {
        CATEGORIA_A
        CATEGORIA_B
        CATEGORIA_C
    }
    
    enum TipoCuenta {
        CUENTA_CORRIENTE
        CAJA_AHORRO
    }
    # Inputs
    input AutenticarOficialInput {
        email: String
        password: String
    }
    
    input OficialInput {
        nombre: String!
        email: String!
        password: String!
        bancoId: ID!
    }
    
    input BancoInput {
        nombre: String!
    }
    
    input ClienteInput {
        nombre: String!
        direccion: String
        telf: String
        saldoTotal: Float!
        tipoCliente: TipoCliente!
        oficialBancoId: ID!
    }
    
    input SucursalInput {
        nombre: String!
        direccion: String!
        bancoId: ID!
    }
    
    input CuentaInput {
        tipoCuenta: TipoCuenta!
        numeroCuenta: Int!
        clienteId: ID!
        bancoId: ID!
        sucursalId: ID!
        saldoCuenta: Float!
    }

    input TransaccionInput {
        cuentaOrigen: ID!
        cuentaDestino: ID!
        monto: Float!
        referencia: String!
    }
    
    # Queries
    type Query {
        #Token
        encriptarTokenOficial( input: AutenticarOficialInput ): Token
        desencriptarTokenOficial( token: String ): Oficial
        #Oficial
        obtenerOficiales: [ Oficial ]
        #Banco
        obtenerBancos: [ Banco ]
        obtenerBancoId( id: ID! ): Banco
        #Cliente
        obtenerClientes: [ Cliente ]
        obtenerClienteId( id: ID ): Cliente
        obtenerClienteOficial: [ Cliente ]
        #Sucursal
        obtenerSucursales: [ Sucursal ]
        obtenerSucursalId( id: ID ): Sucursal
        obtenerSucursalesBancoId( id: ID ): [ Sucursal ]
        #Cuenta
        obtenerCuentas: [ Cuenta ]
        obtenerCuentaId( id: ID ): Cuenta
        obtenerCuentasCliente( id: ID ): [ Cuenta ]
        obtenerCuentasOficial: [ Cuenta ]
        #Transaccion
        obtenerTransacciones: [ Transaccion ]
        obtenerTransaccionId( id: ID ): Transaccion
        obtenerTransaccionesCliente( id: ID ): [Transaccion]
        #Queries avanzados
        obtenerSaldosPorSucursal( id: ID ): [ SaldoCliente ]
        obtenerClienteMasTransaccionesSucursal( id: ID ): TransaccionesClienteSucursal
        mejorOficial: MejorOficial
    }
    # Mutations
    type Mutation {
        #Oficiales
        nuevoOficial( input: OficialInput ): Oficial
        #Banco
        nuevoBanco( input: BancoInput ): Banco
        actualizarBanco( id: ID!, input: BancoInput ): Banco
        eliminarBanco( id: ID! ): String
        #Cliente
        nuevoCliente( input: ClienteInput ): Cliente
        actualizarCliente( id: ID, input: ClienteInput ): Cliente
        eliminarCliente( id: ID ): String
        #Sucursal
        nuevaSucursal( input: SucursalInput ): Sucursal
        actualizarSucursal( id: ID!, input: SucursalInput ): Sucursal
        eliminarSucursal( id: ID! ) : String
        #Cuenta
        nuevaCuenta(input: CuentaInput): Cuenta
        actualizarCuenta(id: ID!, input: CuentaInput): Cuenta
        eliminarCuenta(id: ID!): String
        #Transaccion
        nuevaTransaccion( input: TransaccionInput ): Transaccion
        revertirTransaccion( id: ID ): Transaccion
    }
`;

module.exports = typeDefs;