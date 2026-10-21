import { createServer } from "node:http";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const productsDirectory = resolve(projectRoot, "products", "product_entity");
const productImagesDirectory = resolve(projectRoot, "products", "product_image");
const usersFile = resolve(projectRoot, "users.json");
const port = Number(process.env.PORT ?? 3000);

const contentTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function isWithinDirectory(directory, filePath) {
  const relativePath = relative(directory, filePath);
  return relativePath !== "" && relativePath !== ".." && !relativePath.startsWith(`..${sep}`);
}

async function getProducts() {
  const filenames = (await readdir(productsDirectory))
    .filter((filename) => extname(filename).toLowerCase() === ".json")
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    filenames.map(async (filename) => {
      const productPath = resolve(productsDirectory, filename);
      const product = JSON.parse(await readFile(productPath, "utf8"));
      const imagePath = resolve(dirname(productPath), product.imageLink);

      if (!isWithinDirectory(productImagesDirectory, imagePath)) {
        throw new Error(`Product image must be inside products/product_image: ${filename}`);
      }

      const imageStats = await stat(imagePath);
      if (!imageStats.isFile()) {
        throw new Error(`Product image is not a file: ${filename}`);
      }

      const imageUrl = `/${relative(projectRoot, imagePath).split(sep).join("/")}`;
      return { product, imageUrl };
    }),
  );
}

async function readRequestJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 10_000) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStaticFile(pathname, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const requestedPath =
    decodedPath === "/" ? "/src/index.html" : decodedPath;
  const filePath = resolve(projectRoot, `.${requestedPath}`);
  const isAllowedPath =
    isWithinDirectory(resolve(projectRoot, "src"), filePath) ||
    isWithinDirectory(resolve(projectRoot, "products"), filePath);

  if (!isAllowedPath) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const contentType =
      contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(await readFile(filePath));
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    throw error;
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);

  if (requestUrl.pathname === "/api/login") {
    if (request.method !== "POST") {
      response.writeHead(405, { Allow: "POST" });
      response.end("Method not allowed");
      return;
    }

    try {
      const credentials = await readRequestJson(request);

      if (
        !credentials ||
        typeof credentials.login !== "string" ||
        typeof credentials.password !== "string"
      ) {
        sendJson(response, 400, { error: "Login and password are required." });
        return;
      }

      const usersData = JSON.parse(await readFile(usersFile, "utf8"));
      if (
        !usersData ||
        !Array.isArray(usersData.users) ||
        !usersData.users.every(
          (user) =>
            user &&
            typeof user.login === "string" &&
            typeof user.password === "string",
        )
      ) {
        throw new Error("users.json must contain a users array with login and password strings.");
      }

      const user = usersData.users.find(
        (candidate) =>
          candidate.login === credentials.login &&
          candidate.password === credentials.password,
      );

      if (!user) {
        sendJson(response, 401, { error: "Invalid login or password." });
        return;
      }

      sendJson(response, 200, { login: user.login });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: "Invalid JSON request body." });
        return;
      }

      console.error("Unable to authenticate user:", error);
      sendJson(response, 500, { error: "Unable to authenticate user." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/products") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end("Method not allowed");
      return;
    }

    try {
      sendJson(response, 200, await getProducts());
    } catch (error) {
      console.error("Unable to load products:", error);
      sendJson(response, 500, { error: "Unable to load products." });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  try {
    await serveStaticFile(requestUrl.pathname, response);
  } catch (error) {
    console.error("Unable to serve request:", error);
    response.writeHead(500);
    response.end("Internal server error");
  }
});

server.listen(port, () => {
  console.log(`Store app running at http://localhost:${port}`);
});
