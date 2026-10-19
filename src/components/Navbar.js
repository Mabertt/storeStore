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
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
              <li><a href="/src/pages/Login.html">Login</a></li>
            </ul>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define("store-navbar", StoreNavbar);
