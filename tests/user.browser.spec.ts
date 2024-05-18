import { test, expect } from "@playwright/test";
import { getPath } from "../src/url";
import postgres from "postgres";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";

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
/*
test.afterEach(async () => {
	const tables = ["todos", "subtodos", "users"];

	try {
		for (const table of tables) {
			await sql.unsafe(`DELETE FROM ${table}`);
			await sql.unsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`);
		}
	} catch (error) {
		console.error(error);
	}
});*/

test("User was registered.", async ({ page }) => {
	await page.goto(`/register`);

	await page.fill('form#register-form input[name="email"]', "user@email.com");
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

	await page.fill('form#register-form input[name="email"]', "user@email.com");
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

	await page.goto(`/`);

	let loginElement = await page.$(`div a[href="${getPath("login")}"]`);
	let logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	expect(await loginElement).toBeTruthy();
	expect(await logoutElement).toBeFalsy();

	await loginElement?.click();

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
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

	expect((await context.cookies()).length).toBe(0);

	await page.goto(`/login`);

	expect((await context.cookies()).length).toBe(1);

	await page.fill('form#login-form input[name="email"]', "chippichippi@email.com");
	await page.fill('form#login-form input[name="password"]', "chippi123");
	await page.click("form#login-form #login-form-submit-button");

	expect(await page?.url()).toBe(getPath("home"));

	const logoutElement = await page.$(`div a[href="${getPath("logout")}"]`);

	await logoutElement?.click();

	expect(await page?.url()).toBe(getPath("home"));

	const welcomeTextElement = await page.$(".welcomeHeading");
	expect(await welcomeTextElement?.innerText()).toBe("Welcome, Guest!");

	const loginElement = await page.$(`div a[href="${getPath("login")}"]`);

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