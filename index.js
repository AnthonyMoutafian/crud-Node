const http = require("http");
const fs = require("fs").promises;
const {
  createPath,
  headerGenerator,
  defaultResGenerator,
} = require("./helpers");

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    return defaultResGenerator(res, "text/html", ["pages"], "index.html", 200);
  }

  if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === "GET") {
    const id = Number(req.url.split("/").pop());

    const users = JSON.parse(
      await fs.readFile(createPath("db", "users.json"), "utf-8"),
    );

    const currentUser = users.find((user) => user.id === id);

    headerGenerator(200, "application/json", res);
    res.write(JSON.stringify(currentUser || null));
    return res.end();
  }

  if (req.url.startsWith("/api/users") && req.method === "GET") {
    const users = JSON.parse(
      await fs.readFile(createPath("db", "users.json"), "utf-8"),
    );

    if (req.url.includes("?age=")) {
      const age = req.url.split("?age=").pop();
      let result = [];

      if (age === "min") {
        result = users.toSorted((a, b) => a.age - b.age);
      } else if (age === "max") {
        result = users.toSorted((a, b) => b.age - a.age);
      }

      headerGenerator(200, "application/json", res);
      res.write(JSON.stringify(result));
      return res.end();
    }

    if (req.url.includes("?name=")) {
      const query = req.url.split("?name=").pop().toLowerCase();

      const result = users.filter((user) =>
        user.name.toLowerCase().includes(query),
      );

      headerGenerator(200, "application/json", res);
      res.write(JSON.stringify(result));
      return res.end();
    }

    headerGenerator(200, "application/json", res);
    res.write(JSON.stringify(users));
    return res.end();
  }

  if (req.url === "/api/users" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      const parsedBody = JSON.parse(body);

      const users = JSON.parse(
        await fs.readFile(createPath("db", "users.json"), "utf-8"),
      );

      const newUser = {
        id: Date.now(),
        ...parsedBody,
      };

      users.push(newUser);

      await fs.writeFile(createPath("db", "users.json"), JSON.stringify(users));

      headerGenerator(200, "application/json", res);
      res.write(JSON.stringify(newUser));
      res.end();
    });

    return;
  }

  if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === "PUT") {
    const id = Number(req.url.split("/").pop());

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      const parsedBody = JSON.parse(body);

      const users = JSON.parse(
        await fs.readFile(createPath("db", "users.json"), "utf-8"),
      );

      const index = users.findIndex((u) => u.id === id);

      if (index === -1) {
        headerGenerator(404, "application/json", res);
        res.write(JSON.stringify({ message: "User not found" }));
        return res.end();
      }

      users[index] = {
        id,
        ...parsedBody,
      };

      await fs.writeFile(createPath("db", "users.json"), JSON.stringify(users));

      headerGenerator(200, "application/json", res);
      res.write(JSON.stringify(users[index]));
      res.end();
    });

    return;
  }

  if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === "PATCH") {
    const id = Number(req.url.split("/").pop());

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      const parsedBody = JSON.parse(body);

      const users = JSON.parse(
        await fs.readFile(createPath("db", "users.json"), "utf-8"),
      );

      const index = users.findIndex((u) => u.id === id);

      if (index === -1) {
        headerGenerator(404, "application/json", res);
        res.write(JSON.stringify({ message: "User not found" }));
        return res.end();
      }

      users[index] = {
        ...users[index],
        ...parsedBody,
      };

      await fs.writeFile(createPath("db", "users.json"), JSON.stringify(users));

      headerGenerator(200, "application/json", res);
      res.write(JSON.stringify(users[index]));
      res.end();
    });

    return;
  }

  if (req.url.match(/^\/api\/users\/([0-9]+)$/) && req.method === "DELETE") {
    const id = Number(req.url.split("/").pop());

    const users = JSON.parse(
      await fs.readFile(createPath("db", "users.json"), "utf-8"),
    );

    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      headerGenerator(404, "application/json", res);
      res.write(JSON.stringify({ message: "User not found" }));
      return res.end();
    }

    const deletedUser = users.splice(index, 1)[0];

    await fs.writeFile(createPath("db", "users.json"), JSON.stringify(users));

    headerGenerator(200, "application/json", res);
    res.write(
      JSON.stringify({
        message: "User deleted successfully",
        user: deletedUser,
      }),
    );
    res.end();

    return;
  }

  return defaultResGenerator(res, "text/html", ["pages"], "error.html", 404);
});

server.listen(PORT, (err) => {
  err ? console.log(err) : console.log(`Server Is Running On Port ${PORT}`);
});
