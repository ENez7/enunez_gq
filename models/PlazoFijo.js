const mongoose = require('mongoose');

const PlazoFijoSchema = mongoose.Schema({
    oficialId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'OficialBanco'
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cliente',
    },
    sucursalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Sucursal',
    },
    fechaDeposito: {
        type: Date,
        default: Date.now(),
    },
    plazoDeposito: {
        type: String,
        required: true,
    },
    monedaDeposito: {
        type: String,
        required: true,
    },
    montoDeposito: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model('PlazoFijo', PlazoFijoSchema);