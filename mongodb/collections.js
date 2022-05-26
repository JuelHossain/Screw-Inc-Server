const usersCollection = client.db("Screw").collection("users");
const productsCollection = client.db("Screw").collection("products");
const ordersCollection = client.db("Screw").collection("orders");
const paymentsCollection = client.db("Screw").collection("payments");

module.exports = { usersCollection, productsCollection, ordersCollection, paymentsCollection };