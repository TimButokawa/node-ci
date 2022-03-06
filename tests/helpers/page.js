const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/session-factory');
const userFactory = require('../factories/user-factory');

class CustomPage {
  static async Build () {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property]
          || browser[property]
          || page[property]
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login () {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
    // set cookie
    await this.page.setCookie({
      name: 'session',
      value: session,
    });
    // set cookie signature
    await this.page.setCookie({
      name: 'session.sig',
      value: sig,
    });
    // redirect to blogs
    await this.page.goto('http://localhost:3000/blogs');
    // wait for element
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  /**
   * 
   * @param {string} selector
   * @returns {string} innerHTML
   */
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
      }).then(res => res.json());
    }, path);
  }

  post(path, data) {
    return this. page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data),
      }).then(res => res.json());
    }, path, data);
  }

  execRequests(actions) {
    const promises = actions.map(({ data, method, path }) => {
      return this[method](path, data);
    });

    return Promise.all(promises);
  }
}

module.exports = CustomPage;
