const puppeteer = require('puppeteer');
const fs = require('fs');

const iconHtml = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet">
<style>
  body {
    margin: 0;
    width: 1024px;
    height: 1024px;
    background-color: #15130F;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .mark-quote {
    font-family: 'Archivo Black', sans-serif;
    font-size: 512px;
    color: #FF3B5C;
    line-height: 1;
    margin-top: 120px; /* Adjust to perfectly center the quotation mark visually */
  }
</style>
</head>
<body>
  <div class="mark-quote">&#8220;</div>
</body>
</html>
`;

const splashHtml = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet">
<style>
  body {
    margin: 0;
    width: 1242px;
    height: 2688px;
    background-color: #15130F;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .wordmark {
    font-family: 'Archivo Black', sans-serif;
    font-size: 140px;
    color: #F3EFE7;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wordmark .q { color: #FF3B5C; font-size: 180px; transform: translateY(12px); }
</style>
</head>
<body>
  <div class="wordmark"><span class="q">&#8220;</span>realtalk<span class="q">&#8221;</span></div>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Icon
  await page.setViewport({ width: 1024, height: 1024 });
  await page.setContent(iconHtml);
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'assets/icon.png' });
  console.log('Generated icon.png');

  // Splash
  await page.setViewport({ width: 1242, height: 2688 });
  await page.setContent(splashHtml);
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'assets/splash.png' });
  console.log('Generated splash.png');

  await browser.close();
})();
