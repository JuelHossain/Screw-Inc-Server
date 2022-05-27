const SSLCommerzPayment = require('sslcommerz').SslCommerzPayment
require("dotenv").config();
const pay = async (req, res) => {
    const data = req.headers.paymentData;
    console.log(data);
    const sslcommer = new SSLCommerzPayment(
        process.env.SSL_STORE_ID,
        process.env.SSL_PASS,
        true
    ); //true for live default false for sandbox
    sslcommer.init(data).then((data) => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        if (data?.GatewayPageURL) {
            return res.status(200).redirect(data?.GatewayPageURL);
        } else {
            return res
                .status(400)
                .json({ message: "ssl session was not successful" });
        }
    });
}
module.exports = pay;
// app.post('/success', async (req, res, next) => {
//     return res.status(200).json({
//         data: req.body
//     })
// });
// app.post('/failure', async (req, res) => {
//     return res.status(400).json({
//         data:req.body
//     })
// })
// app.post('/cancel', async (req, res) => {
//     return res.status(400).json({
//         data:req.body
//     })
// })
// app.post('/ipn', async (req, res) => {
//     return res.status(400).json({
//         data:req.body
//     })
// })
// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });