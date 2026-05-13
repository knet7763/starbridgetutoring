const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174/tutors', { waitUntil: 'networkidle2' });
    console.log('Navigated to /tutors');
    
    await page.waitForSelector('a[href^="/book-session/"]', { timeout: 10000 });
    const links = await page.$$eval('a[href^="/book-session/"]', els => els.map(e => e.href));
    console.log('Found book session links:', links);
    
    if (links.length === 0) {
      console.log('No links found.');
      return;
    }

    await Promise.all([
      page.click('a[href^="/book-session/"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Navigation timeout:', e.message))
    ]);
    
    console.log('Current URL after click:', page.url());
    
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('Body Text Snippet:', bodyText.substring(0, 300));
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
