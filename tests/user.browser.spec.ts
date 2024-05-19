import { test, expect } from "@playwright/test";
import { getPath } from "../src/url";
import postgres from "postgres";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";
import { makeHttpRequest } from "./client";
import { Page } from "@playwright/test";


let sql = postgres({
	database: "VideoGamedDB",
});

/*
const createUser = async (props: Partial<UserProps> = {}) => {
	return await User.create(sql, {
		email: props.email || "user@email.com",
		password: props.password || "password",
		createdAt: props.createdAt || createUTCDate(),
		// isAdmin: props.isAdmin || false, // Uncomment if implementing admin feature.
	});
};*/

/**
 * Clean up the database after each test. This function deletes all the rows
 * from the todos and subtodos tables and resets the sequence for each table.
 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
 */

test.afterEach(async ({ page }) => {

    const tables = ["users"];

    try {
            await sql.unsafe(`
            DROP TABLE IF EXISTS users CASCADE; 
            CREATE TABLE users (
				id SERIAL PRIMARY KEY,
				email VARCHAR(100) NOT NULL UNIQUE,
				username VARCHAR(100) DEFAULT 'Guest',
				pfp VARCHAR(300) DEFAULT 'https://i.pinimg.com/564x/af/0a/0a/af0a0af3734b37b50e7f48eacb3b09a6.jpg',
				password VARCHAR(255) NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`);
    } catch (error) {
        console.error(error);
    }


});


const logout = async (page: Page) => {

	await page.click("#logout");
}



test("User was registered.", async ({ page }) => {
	await page.goto(`/register`);

	await page.fill('form#register-form input[name="email"]', "user1@email.com");
	await page.fill('form#register-form input[name="password"]', "Password123");
	await page.fill(
		'form#register-form input[name="confirmPassword"]',
		"Password123",
	);
	await page.click("form#register-form #register-form-submit-button");

	expect(await page?.url()).toBe(getPath("login"));
});

test("User was not registered with blank email.", async ({ page }) => {
	await page.goto(`register`);

	await page.fill('form#register-form input[name="password"]', "Password123");
	await page.fill(
		'form#register-form input[name="confirmPassword"]',
		"Password123",
	);
	await page.click("form#register-form #register-form-submit-button");

	expect(await page?.url()).toMatch(getPath("register"));

	const errorElement = await page.$("#error");

	expect(await errorElement?.innerText()).toMatch("Email is required");
});

test("User was not registered with mismatched passwords.", async ({ page }) => {
	await page.goto(`register`);

	await page.fill('form#register-form input[name="email"]', "user2@email.com");
	await page.fill('form#register-form input[name="password"]', "Password123");
	await page.fill(
		'form#register-form input[name="confirmPassword"]',
		"Password124",
	);
	await page.click("form#register-form #register-form-submit-button");

	expect(await page?.url()).toMatch(getPath("register"));

	const errorElement = await page.$("#error");

	expect(await errorElement?.innerText()).toMatch("Passwords do not match");
});

test("User was logged in.", async ({ page }) => {

	await page.goto(`/register`);

	await page.fill('form#register-form input[name="email"]', "user2@email.com");
	await page.fill('form#register-form input[name="password"]', "Password123");
	await page.fill(
		'form#register-form input[name="confirmPassword"]',
		"Password123",
	);
	await page.click("form#register-form #register-form-submit-button");
	
	let loginElement = await page.$(`div a[href="${getPath("login")}"]`);
	let logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	expect(await loginElement).toBeTruthy();
	expect(await logoutElement).toBeFalsy();

	await loginElement?.click();

	await page.fill('form#login-form input[name="email"]', "user2@email.com");
	await page.fill('form#login-form input[name="password"]', "Password123");
	await page.click("form#login-form #login-form-submit-button");

	expect(await page?.url()).toBe(getPath("home"));

	loginElement = await page.$(`div a[href="${getPath("login")}"]`);
	logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	expect(await loginElement).toBeFalsy();
	expect(await logoutElement).toBeTruthy();
});

test("User was not logged in with blank email.", async ({ page }) => {
	await page.goto(`/login`);

	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.click("form#login-form #login-form-submit-button");

	expect(await page?.url()).toMatch(getPath("login"));

	const errorElement = await page.$("#error");

	expect(await errorElement?.innerText()).toMatch("Email is required.");
});

test("User was not logged in with incorrect password.", async ({ page }) => {
	await page.goto(`/login`);

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi");
	await page.click("form#login-form #login-form-submit-button");

	expect(await page?.url()).toMatch(getPath("login"));

	const errorElement = await page.$("#error");

	expect(await errorElement?.innerText()).toMatch("Invalid credentials.");
});

test("User was logged out.", async ({ page, context }) => {
	await page.goto(`/register`);

	await page.fill('form#register-form input[name="email"]', "user3@email.com");
	await page.fill('form#register-form input[name="password"]', "Password123");
	await page.fill(
		'form#register-form input[name="confirmPassword"]',
		"Password123",
	);
	await page.click("form#register-form #register-form-submit-button");
	
	let loginElement = await page.$(`div a[href="${getPath("login")}"]`);
	let logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	expect(await loginElement).toBeTruthy();
	expect(await logoutElement).toBeFalsy();

	await loginElement?.click();

	expect((await context.cookies()).length).toBe(0);

	await page.goto(`/login`);

	expect((await context.cookies()).length).toBe(1);

	await page.fill('form#login-form input[name="email"]', "user3@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.click("form#login-form #login-form-submit-button");

	expect(await page?.url()).toBe(getPath("home"));

	logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	await logoutElement?.click();

	expect(await page?.url()).toBe(getPath("home"));

	const welcomeTextElement = await page.$(".welcomeHeading");
	expect(await welcomeTextElement?.innerText()).toBe("Welcome, Guest!");

	loginElement = await page.$(`div a[href="${getPath("login")}"]`);

	expect(await loginElement).toBeTruthy();
});

test("User's email was remembered.", async ({ page }) => {
	await page.goto(`/login`);

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.check('form#login-form input[name="remember"]');
	await page.click("form#login-form #login-form-submit-button");

	const cookies = await page.context().cookies();

	const emailCookie = cookies.find((cookie) => cookie.name === "email");

	expect(emailCookie).toBeTruthy();
	expect(emailCookie?.value).toBe("chippichippi@email.com");
});

test("Retrieve user's profile.", async ({page}) => {
	/*
	await page.goto(`/login`);

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.check('form#login-form input[name="remember"]');
	await page.click("form#login-form #login-form-submit-button");*/
	makeHttpRequest("POST", `/login`, {email:"chippichippi@email.com", password:"chippi123"});

	makeHttpRequest("GET", `/profile`);
    await page.waitForSelector('.userInfo');
    
    const username = await page.textContent('.userInfo h3');
    expect(username).toBe('Chippi');
});

/*
test("Update username.", async ({page}) => {
	await page.goto(`/login`);

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.check('form#login-form input[name="remember"]');
	await page.click("form#login-form #login-form-submit-button");

    await page.goto(getPath('profile'));
    await page.click('#update-username-button input[type="submit"]');
    //await page.waitForSelector('form#update-username-form');

    await page.fill('form#update-username-form #newUsername', 'Chippi');
    await page.click('form#update-username-form #update-username-form-button');

    await page.goto(getPath('profile'));
    const updatedUsername = await page.$('#username');
    expect(updatedUsername?.innerText()).toBe('Chippi');
});

test("Update profile picture.", async ({page}) => {
	await page.goto(getPath('profile'));
    await page.click('#update-pfp-button input[type="submit"]');
    await page.waitForSelector('form#update-pfp-form');

    const newPfp = 'https://i.pinimg.com/564x/af/0a/0a/af0a0af3734b37b50e7f48eacb3b09a6.jpg';
    await page.fill('form#update-pfp-form input[name="newPfp"]', newPfp);
    await page.click('form#update-pfp-form input[type="submit"]');

	//expect(await page?.url()).toBe(getPath("profile"));

    await page.goto(getPath('profile'));
    const updatedPfpSrc = await page.getAttribute('.userInfo img.review-profile-pic', 'src');
    expect(updatedPfpSrc).toBe(newPfp);
});*/