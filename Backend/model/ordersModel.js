const mongoose = require("mongoose");
const ordersSchema = require("../schemas/ordersSchema");

const OrderModel = mongoose.model("Order", ordersSchema);
module.exports = { OrderModel };