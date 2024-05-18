import { test, expect } from "@playwright/test";
import { getPath } from "../src/url";
import postgres from "postgres";
import { createUTCDate } from "../src/utils";
import Tag, { TagProps } from "../src/models/Tag";
import { makeHttpRequest } from "./client";

let sql = postgres({
	database: "VideoGamedDB",
});

// Helper function to log in as the test user
async function loginAsUser(page) {
    await page.goto(getPath('login'));
    await page.fill('form#login-form input[name="email"]', 'chippichippi@email.com');
    await page.fill('form#login-form input[name="password"]', 'chippi123');
    await page.click('form#login-form #login-form-submit-button');
}

test("Adding a tag to a game successfully", async ({ page }) => {
    await loginAsUser(page);

    const gameId = 2;
    await page.goto(getPath(`games/${gameId}`));
    const selectElement = await page.$('select[name="tagId"]');
    await selectElement?.selectOption('1');
    await page.click('button[type="submit"]');

    const newTags = await page.$$('.tag');
    const newTagDescriptions = await Promise.all(newTags.map(tag => tag.textContent()));
    expect(newTagDescriptions).toContain('Action');
});


test ("Cannot add duplicate tag to a game", async ({page}) => {
    await loginAsUser(page);

    const gameId = 1;
    await page.goto(getPath(`games/${gameId}`));
    const selectElement = await page.$('select[name="tagId"]');
    await selectElement?.selectOption('5');
    await page.click('button[type="submit"]');

    //await page.click('button[type="submit"]');

    let errorMessage = await page.$(`#error`);
    expect(errorMessage?.innerText()).toBe("This tag already exists.")
});