const mongoose = require( 'mongoose' );

const CuentaSchema = mongoose.Schema({
    tipoCuenta: {
        type: String,
        trim: true,
        required: true,
    },
    numeroCuenta: {
        type: Number,
        unique: true,
    },
    // Pertenece al cliente
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cliente',
    },
    // Es del banco
    bancoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Banco',
    },
    // En la sucursal
    sucursalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Sucursal',
    },
    saldoCuenta: {
        type: Number,
        required: true,
        default: 0.0,
    },
});

module.exports = mongoose.model('Cuenta', CuentaSchema);