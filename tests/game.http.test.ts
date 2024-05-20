import postgres from "postgres";
import { StatusCode } from "../src/router/Response";
import { HttpResponse, clearCookieJar, makeHttpRequest } from "./client";
import {
	test,
	describe,
	expect,
	afterEach,
	beforeEach,
} from "vitest";

describe("HTTP operations", () => {
	const sql = postgres({
		database: "VideoGamedDB",
	});

	beforeEach(async () => {
		// Anything you want to do before each test runs?
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	afterEach(async () => {
		// Replace the table_name with the name of the table(s) you want to clean up.
		const tables = ["users", "games", "reviews", "played_games"];

		try {
			for (const table of tables) {
				await sql.unsafe(`DELETE FROM ${table}`);
				await sql.unsafe(
					`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`,
				);
			}
		} catch (error) {
			console.error(error);
		}

		await makeHttpRequest("POST", "/logout");
		clearCookieJar();
	});

	test("Games page was retrieved successfully.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/games",
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(true);
		expect(body.message).toBe("Game list retrieved");
	});

	test("Specific game page was retrieved successfully", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/games/1",
		);

        expect(body.message).toBe("Game retrieved");
		expect(statusCode).toBe(StatusCode.OK);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(body.message).toBe("Game retrieved");
	});
});
