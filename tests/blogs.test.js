const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.Build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  page.close();
});

describe('When logged in...', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.red');
  });

  test('can see blog create form', async () => {  
    const label = await page.getContentsOf('form label');
  
    expect(label).toEqual('Blog Title');
  });

  describe('Using invalid inputs...', () => {
    beforeEach(async () => {
      await page.click('button[type="submit"]');
    });

    test('the form shows an error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });

  describe('Using valid inputs...', () => {
    beforeEach(async () => {
      await page.type('input[name="title"]', 'My Title');
      await page.type('input[name="content"]', 'My Content');
      await page.click('button[type="submit"]');
    });
  
    test('submit takes user to review screen', async () => {
      const title = await page.getContentsOf('h5');

      expect(title).toEqual('Please confirm your entries');
    });

    test('the form shows an error message', async () => {
      await page.click('button.green');
      await page.waitFor('div.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('My Title');
      expect(content).toEqual('My Content');
    });
  });
});

describe('When user is not logged in...', async () => {
  const actions = [{
    data: { title: 't', content: 'c' },
    method: 'post',
    path: '/api/blogs', 
  }, {
    method: 'get',
    path: '/api/blogs',
  }];

  test('blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions);

    for(let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });
});
