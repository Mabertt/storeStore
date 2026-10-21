const productsGrid = document.querySelector("[data-products-grid]");
const productsStatus = document.querySelector("[data-products-status]");

function isProduct(product) {
  return (
    product &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    typeof product.description === "string" &&
    Array.isArray(product.tags) &&
    product.tags.every((tag) => typeof tag === "string") &&
    Array.isArray(product.sizes) &&
    product.sizes.every((size) => typeof size === "string") &&
    Array.isArray(product.color) &&
    product.color.every((color) => typeof color === "string") &&
    Array.isArray(product.colorClass) &&
    product.colorClass.length === product.color.length &&
    product.colorClass.every((className) =>
      /^bg-(black|white|red-[0-9]{3}|orange-[0-9]{3}|blue-[0-9]{3}|green-[0-9]{3}|yellow-[0-9]{3}|gray-[0-9]{3})$/.test(
        className,
      ),
    ) &&
    typeof product.imageLink === "string"
  );
}

async function fetchProducts() {
  const response = await fetch("/api/products", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load products: ${response.status}`);
  }

  return response.json();
}

function createProductCard(product, imageUrl) {
  const card = document.createElement("article");
  card.className =
    "product-card flex h-[400px] w-[240px] flex-col rounded-md border-2 border-sky-800 bg-gray-900 p-4 text-white";

  const image = document.createElement("img");
  image.className = "product-image";
  image.src = imageUrl;
  image.alt = product.name;

  const name = document.createElement("h2");
  name.className = "product-name";
  name.textContent = product.name;

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = `$${product.price.toFixed(2)}`;

  const details = document.createElement("div");
  details.className = "product-details";

  const colors = document.createElement("div");
  colors.className = "product-colors";

  product.color.forEach((color, index) => {
    const colorSwatch = document.createElement("span");
    colorSwatch.className = `product-color-swatch ${product.colorClass[index]}`;
    colorSwatch.title = color;
    colorSwatch.setAttribute("aria-label", `Color: ${color}`);
    colors.append(colorSwatch);
  });

  const sizes = document.createElement("div");
  sizes.className = "product-sizes";

  for (const size of product.sizes) {
    const sizeOption = document.createElement("div");
    sizeOption.className = "product-size";
    sizeOption.textContent = size;
    sizes.append(sizeOption);
  }

  const sizeRow = document.createElement("div");
  sizeRow.className = "product-size-row";
  sizeRow.append(sizes);

  details.append(colors, sizeRow);

  const tags = document.createElement("ul");
  tags.className = "product-tags";

  for (const tag of product.tags) {
    const item = document.createElement("li");
    item.className = "product-tag";
    item.textContent = tag;
    tags.append(item);
  }

  card.append(image, name, price, details, tags);
  return card;
}

async function renderProducts() {
  const products = await fetchProducts();

  if (!Array.isArray(products)) {
    throw new Error("The products API must return an array.");
  }

  if (products.length === 0) {
    productsStatus.textContent = "No products are available yet.";
    return;
  }

  productsGrid.replaceChildren(
    ...products.map(({ product, imageUrl }) => {
      if (!isProduct(product) || typeof imageUrl !== "string") {
        throw new Error("The products API returned invalid product data.");
      }

      return createProductCard(product, imageUrl);
    }),
  );
  productsStatus.hidden = true;
}

renderProducts().catch((error) => {
  console.error("Unable to render products:", error);
  productsStatus.textContent =
    "Products could not be loaded. Please try again later.";
});
