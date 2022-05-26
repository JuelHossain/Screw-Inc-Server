const { productsCollection } = "../mongodb/collections.js";
const getProducts = async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  const query = {};
  const cursor = productsCollection.find(query);
  let products;
  if (page || size) {
    products = await cursor
      .skip(page * size)
      .limit(size)
      .toArray();
  } else {
    products = await cursor.toArray();
  }
  res.send(products);
  console.log(products.length, "sent successfully");
};
module.exports = getProducts;
