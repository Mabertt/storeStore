class StoreNavbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav>
        <div>
          <div>
            <img src="/src/img/StoreLogo.svg" alt="Store Logo" />
          </div>
          <span class="brand-label">store</span>
          <span class="brand-name">Store</span>
          <div>
            <ul>
              <li><a href="/src/pages/Products.html">Products</a></li>
              <li><a href="/src/pages/Cart.html">Cart</a></li>
              <li data-login-link>
                <a href="/src/pages/Login.html">Login</a>
              </li>
              <li class="user-menu" data-user-menu hidden>
                <button
                  class="user-menu-trigger"
                  type="button"
                  data-user-name
                  aria-haspopup="true"
                  aria-label="User menu"
                ></button>
                <div class="user-menu-dropdown" role="menu">
                  <button
                    class="user-menu-logout"
                    type="button"
                    data-logout
                    role="menuitem"
                  >
                    Log out
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `;

    const username = localStorage.getItem("authenticatedUser");
    const loginLink = this.querySelector("[data-login-link]");
    const userMenu = this.querySelector("[data-user-menu]");
    const userName = this.querySelector("[data-user-name]");

    if (username) {
      userName.textContent = username;
      loginLink.hidden = true;
      userMenu.hidden = false;
    }

    this.querySelector("[data-logout]").addEventListener("click", () => {
      localStorage.removeItem("authenticatedUser");
      userName.textContent = "";
      userMenu.hidden = true;
      loginLink.hidden = false;
    });
  }
}

customElements.define("store-navbar", StoreNavbar);
