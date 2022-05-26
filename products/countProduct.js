const { productsCollection } = "../mongodb/collections.js";
const countProduct = async (req, res) => {
  const count = await productsCollection.countDocuments();
  res.send({ count });
  console.log("total products :", count);
};
