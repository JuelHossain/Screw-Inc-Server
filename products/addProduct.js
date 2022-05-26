const { productsCollection } = "../mongodb/collections.js";
const addProduct = async (req, res) => {
  const product = req.body;
  const result = await productsCollection.insertOne(product);
  res.send(result);
  console.log(product.name, "posted");
};

module.exports = addProduct;
