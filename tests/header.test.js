const Page = require('./helpers/page');

let page;
beforeEach(async () => {
  page = await Page.Build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});


test('Header has the correct title', async () => {
  const text = await page.getContentsOf('a.brand-logo');

  expect(text).toEqual('Blogster');
});

test('Clicking login starts oauth flow', async () => {
  await page.click('.right a');
  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test('When signed in, logout appears', async () => {
  // login
  await page.login();

  const logout = await page.$eval('a[href="/auth/logout"]', (el) => {
    return el.innerHTML;
  });

  expect(logout).toEqual('Logout');
});
