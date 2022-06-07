const mongoose = require( 'mongoose' );

const ClienteSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    telf: {
        type: String,
        trim: true,
    },
    direccion: {
        type: String,
        trim: true,
        required: true,
    },
    saldoTotal: {
        type: Number,
        required: true,
        default: 0,
    },
    tipoCliente: {
        type: String,
        required: true,
        trim: true,
    },
    oficialBancoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'OficialBanco',
    },
});

module.exports = mongoose.model('Cliente', ClienteSchema);