const express = require("express");
const app = express();
const { products } = require("./data");

app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      `<h1 style='font-family: cursive; font-size: 36px;'>Home page</h1> <a href="/api/products">products</a>`
    );
});

// // Send all Products - full product objects
// app.get("/api/products", (req, res) => {
//   res
//     .status(200)
//     .json(products)
// });

// // Send all Products - product objects - w/o desc && price
app.get("/api/products", (req, res) => {
  const basicProductInfoList = products.map((product) => {
    const { id, name, image } = product;
    return { id, name, image };
  });

  res.status(200).send(basicProductInfoList);
});

// // ROUTE PARAMS (i.e. routeParams) are just placeholders in a URL using which user can pass some information

// But lets say the user have seen the basic details of each product
// in some fancy UI created by our frontend && he clicks on a specific product
// Now we have send more details about that single product
// most times this user gives an unique identifier like productID as part of request
// But how will we receive productId as part of the request(syntax ?)
// For that we have something called "params" object which contains all routeParams sent by user
// REMEMBER => ROUTE PARAMS (i.e. routeParams) are just placeholders in a URL using which user can pass some information
// products/:productId - here :productId is a place holder for the user to send actual IDs
// Keep in mind all routeParam values will be strings
// So you have to do appropriate type conversions wher required
app.get("/api/products/:productId", (req, res) => {
  const params = req.params;
  // console.log(`params `,params)
  const selectedProductId = params.productId;

  const selectedProductInfo = products.find(
    (product) => product.id === Number(selectedProductId)
  );

  if (selectedProductInfo == null) {
    res
      .status(404)
      .send(
        `<h1 style='font-family: cursive; font-size: 28px; color: red'>Product not found</h1>`
      );
    return;
  }

  res.status(200).send(selectedProductInfo);
});

// // In real world apps - this routeParam won't be just one value(key value pair)
// // We can get multiple values passed as part of the url/route like below
// // we can then use all these info to filterOut/transform our data & send it back in requried format
app.get(
  "/api/products/:productId/userPreferences/:userPreferenceId/reviews/:reviewId",
  (req, res) => {
    const params = req.params;
    console.log(`params `, params);

    res
      .status(200)
      .send(
        `<h1 style='font-family: cursive; font-size: 28px;'>Hello, we have processed all your Route Params</h1>`
      );
  }
);

// QUERY PARAMS => similar to Route Params in the sense that this is another way FOR USER to pass more info in GET request
// BUT instead of inserting some information at intermediate stages of the URL
// all query params have to be added at the end of the URL
// it starts with a questionMark(?) at the end of URL
// After that you can add "n" no of "key:value" pairs
// each of these key value pair is then sperated using ampersand(&) like shown in next line
// /api/v1/query?name=raj&gender=male&org=trivium&city=banglore

// Lets say for our example we care about only two queryParams that the user has passed
// we have to define those two params (search & limit) here
// and these two queryParams are optional
// so if user doesn't send them we will return the full products list
// but if user does send them - we will use them for filtering

app.get("/api/v1/query", (req, res) => {
  console.log(req.query);

  let searchableProducts = [...products];
  const { search, limit } = req.query;

  if (search) {
    searchableProducts = searchableProducts.filter((product) =>
      product.name.includes(search)
    );
  }

  if (limit) {
    searchableProducts = searchableProducts.slice(0, Number(limit));
  }

  // Incase if user has provided valid/relevant queryParams but None of the products matched search criteria
  // we send a custom messages like below
  if (searchableProducts.length < 1) {
    // // You send a simple meaningful string resp message
    // res.status(200).send(`<h1 style='font-family: cursive; font-size: 36px;'>No products matched your search criteria</h1>`)

    // // OR you can send a json that indicates that search was conducted successfully - but no records matched
    res.status(200).json({ searchSuccess: true, data: [] });

    // ALSO YOU CANNOT have two res.send() or res.json() within a SINGLE REQUEST -
    // that are executed at the sametime
    // so inside each condition where we complete proccessing the request & send some kind of response
    // we have to return explicitly
    // OTHERWISE it will read the next res.json() or res.send() like below
    // And it will throw an error
    // Its similar to how you can't send anything after calling res.end() in core node
    return;
  }

  // Incase if user didn't provide any queryParams/search criteria - then searchableProducts === products(whole products list will be returned)
  // but when search criteria is provided by user and it match atleast one record then that modified list will be returned
  res.status(200).json(searchableProducts);
});

// about page
app.get("/about", (req, res) => {
  res
    .status(200)
    .send(`<h1 style='font-family: cursive; font-size: 36px;'>About page</h1>`);
});

// wildcard route handling(i.e. request URL that doesn't match any valid paths)
app.all("/{*any}", (req, res) => {
  res
    .status(404)
    .send(
      `<h1 style='font-family: cursive; font-size: 28px; color: red'>Resource not found</h1>`
    );
});

// express server setup at 5000
app.listen(5000, () => {
  console.log(`Have started listening at port 5000`);
});
