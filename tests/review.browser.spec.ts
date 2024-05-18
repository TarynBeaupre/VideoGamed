import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import { getPath } from "../src/url";
import Review, { ReviewProps } from "../src/models/Review";
import User, { UserProps } from "../src/models/User";
import Game, {GameProps} from "../src/models/Game";
import { createUTCDate } from "../src/utils";
import { title } from "process";
import { makeHttpRequest } from "./client";
import { l } from "vite/dist/node/types.d-aGj9QkWt";

const sql = postgres({
	database: "VideoGamedDB",
});

const createReview = async (props: Partial<ReviewProps> = {}) => {
	const reviewProps: ReviewProps = {
		title: props.title || "Test Review",
        stars: props.stars || 5,
        likes: props.likes || 5,
        review: props.review || "test review text",
        userId: props.userId || 1,
        reviewedGameId: props.reviewedGameId || 1
	};

	return await Review.create(sql, reviewProps);
};

const createUser = async (props: Partial<UserProps> = {}) => {
	return await User.create(sql, {
		email: props.email || "user@email.com",
		password: props.password || "password",
		createdAt: props.createdAt || createUTCDate(),
        editedAt: props.editedAt || createUTCDate(),
        pfp: props.pfp || "https://i.pinimg.com/564x/af/0a/0a/af0a0af3734b37b50e7f48eacb3b09a6.jpg",
        username: props.username || 'Guest',
	});
};

//Testing login with a hardcoded user
const login = async (
	page: Page,
	email: string = "user@email.com",
	password: string = "password",
) => {
	await page.goto(`/login`);
	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click("form#login-form #login-form-submit-button");
};

const logout = async (page: Page) => {
	await page.goto("/logout");
};

test.beforeEach(async () => {
    createUser();
});

test.afterEach(async ({ page }) => {
	const tables = ["reviews", "liked_reviews", "games", "users"];

	try {
		for (const table of tables) {
			await sql.unsafe(`DELETE FROM ${table}`);
			await sql.unsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`);
		}
        await sql.unsafe(`DELETE FROM users WHERE email='user@email.com';`);
	} catch (error) {
		console.error(error);
	}

	await logout(page);
});

test("Review was created successfully", async ({ page }) => {
    await page.goto(`/game/1`);
    makeHttpRequest("POST", "/login", {email: "user@email.com", password: "password"});
    makeHttpRequest("POST", "/played/1", )

    const review = await createReview({
        title: "Test Review",
        stars: 5,
        likes: 5,
        review: "test review text",
        userId: 3,
        reviewedGameId: 1
    });
    const reviewTitles = ["Test Review", "peak"];

    await page.goto(`/games/1`);
    const reviewElements = await page.$$("[review-id]");
    //Note that 1 review is hardcoded, so adding one makes 2 total
    expect(reviewElements.length).toBe(2);
    for (let i = 0; i < 2; i ++){
        expect(await reviewElements[i].innerText()).toMatch(reviewTitles[i]);
    }
});

test("Top 3 reviews were retrieved successfully", async ({ page }) => {
    await page.goto(`/home`);
    const top3ExpectedTitles = ["Peak", "I love this game", ""] //check these
    const top3ReviewsTitles = await page.$$("#top3review-titles");
    for (let i = 0; i < 2; i++){
        expect (top3ReviewsTitles[i].innerText()).toMatch(top3ExpectedTitles[i])
    }
});

test("Review not created successfully if not logged in", async ({page}) => {
    await page.goto(`/review`)
    expect(await page?.url()).toBe(getPath("login"));
});

test("Review not created successfully if game not played.", async ({page}) => {
    makeHttpRequest("POST", "/login", {email: "user@email.com", password: "password"});
    await page.goto("/played");
    makeHttpRequest("POST", "/played/1", )

    await page.goto("/review");
});


test("Review liked successfully while logged in.", async ({page}) => {
    makeHttpRequest("POST", "/login", {email: "user@email.com", password: "password"});

});

test("Review not liked while logged out.", async ({page}) => {
    makeHttpRequest("POST", "/review/like/1", {});
    expect(await page?.url()).toBe(getPath("login"));
});