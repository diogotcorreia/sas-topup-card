import puppeteer from "puppeteer";
import express from "express";
import "dotenv/config";

const FENIX_USERNAME = process.env.FENIX_USERNAME;
const FENIX_PASSWORD = process.env.FENIX_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// https://stackoverflow.com/questions/55601062/using-an-async-function-in-array-find
async function findAsync(arr, asyncCallback) {
  const promises = arr.map(asyncCallback);
  const results = await Promise.all(promises);
  const index = results.findIndex((result) => result);
  return arr[index];
}

const topup = async (price, fenixUsername, fenixPassword) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1300,
        height: 800,
      },
    });
    const page = await browser.newPage();

    await page.goto("https://www.sas.ulisboa.pt");

    // Accept cookies
    await page.waitForSelector(".gdprcookie-buttons");
    const el = await page.$(".gdprcookie-buttons button");

    await page.click(".gdprcookie-buttons button");

    // Click login button
    await page.click('button[title="Login"]');
    await page.waitForNetworkIdle();

    // Select IST from login provider
    await page.click("#IST");
    await page.waitForNetworkIdle();

    // Enter credentials for IST
    await page.type("#username", fenixUsername);
    await page.type("#password", fenixPassword);
    await page.click("#submit_button");
    await page.waitForNetworkIdle();
    // Accept OAuth app
    await page.click("#yesbutton");
    await page.waitForNetworkIdle();

    // Open user area dropdown
    await page.waitForSelector(".nav-link");
    const dropdownOpenerButtons = await page.$$(".nav-link");
    const userAreaButton = await findAsync(
      dropdownOpenerButtons,
      async (el) =>
        await el.evaluate((node) => node.innerText.trim() === "Utilizador SAS")
    );
    if (!userAreaButton) {
      throw new Error("Could not find the user area button");
    }
    await userAreaButton.click();
    await page.waitForTimeout(1500);

    // Click topup page link
    const dropdownLinks = await page.$$(".dropdown-item");
    const topupPageLink = await findAsync(
      dropdownLinks,
      async (el) =>
        await el.evaluate(
          (node) => node.innerText.trim() === "Saldo e Carregamento"
        )
    );
    if (!topupPageLink) {
      throw new Error("Could not find the topup page link");
    }
    await Promise.all([topupPageLink.click(), page.waitForNavigation()]);
    await page.waitForNetworkIdle();

    // Enter parameters to topup the card
    // Phonenumber is already filled
    await page.waitForSelector("#valor");
    await page.type("#valor", price.toFixed(2));

    // Click topup button
    await page.click("#submeter");
    await page.waitForNetworkIdle();
  } catch (e) {
    throw e;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const isAuthorized = (authorization) => {
  return authorization === `Bearer ${ACCESS_TOKEN}`;
};

const app = express();

app.get("/topup", (req, res) => {
  const { count } = req.query;

  if (!isAuthorized(req.get("authorization"))) {
    return res.sendStatus(401);
  }

  if (count === undefined) {
    return res.sendStatus(400);
  }

  const price = parseInt(count, 10) * 2.75;
  if (isNaN(price)) {
    return res.sendStatus(400);
  }

  try {
    topup(price, FENIX_USERNAME, FENIX_PASSWORD);
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listeing on port ${port}`);
});
