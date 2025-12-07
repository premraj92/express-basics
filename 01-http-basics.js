const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`New user request has arrived`);
  // console.log(`Current REQuest method `, req.method);
  // console.log(`Current HTTP version `, req.httpVersion);
  // console.log(`req `, req.headers)

  console.log(`Req URL `, req.url);
  const url = req.url;

  // Home page
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    // Write/add a simple html snippet directly into the .write request
    res.write(
      "<h1 style='font-family: cursive; font-size: 28px'>Welcome to our app home page !!</h1>"
    );

    res.end();
    return;
  }

  // About page
  if (url === "/about") {
    res.writeHead(200, { "content-type": "text/html" });
    res.write(
      "<h1 style='font-family: cursive; font-size: 28px'>We are an awesome app, check us out !!</h1>"
    );
    res.end();
    return;
  }

  // Invalid path/route - 404 error
  res.writeHead(404, { "content-type": "text/html" });
  res.write(
    "<h1 style='font-family: cursive; font-size: 28px; color: red '>Page not found ):</h1>"
  );
  res.end();
});

server.listen(5000, () => {
  console.log(`Have started listening at port 5000 . . .`);
});
