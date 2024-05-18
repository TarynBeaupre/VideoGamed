import postgres, { toKebab } from "postgres";
import Game, { GameProps } from "../src/models/Game";
import { test, describe, expect, afterEach, beforeEach } from "vitest";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";

describe("Game CRUD operations", () => {
	// Set up the connection to the DB.
	const sql = postgres({
		database: "VideoGamedDB",
	});

	/**
	 * Helper function to create a Todo with default or provided properties.
	 * @see https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR#short-circuit_evaluation
	 * @param props The properties of the Todo.
	 * @default title: "Test Todo"
	 * @default description: "This is a test todo"
	 * @default status: "incomplete"
	 * @default dueAt: A week from today
	 * @default createdAt: The current date/time
	 * @returns A new Todo object that has been persisted in the DB.
	 */
	const createGame = async (props: Partial<GameProps> = {}) => {
		const gameProps: GameProps = {
			title: props.title || "Test Game",
			description: props.description || "This is a test game",
            developer: props.developer || "Test Dev",
			releaseYear: props.releaseYear || 2024,
		};

		return await Game.create(sql, gameProps);
	};

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
			// isAdmin: props.isAdmin || false, // Uncomment if implementing admin feature.
		});
	};

	beforeEach(async () => {
		await createUser();
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	afterEach(async () => {
		const tables = ["users", "games", "reviews"];

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
	});

	test("Game was created.", async () => {
		// Create a new game.
		const game = await createGame({ title: "Test Game 2" });
            expect(game?.props.title).toBe("Test Game 2");
            expect(game?.props.description).toBe("This is a test game");
            expect(game?.props.developer).toBe("Test Dev");
            expect(game?.props.releaseYear).toBe(2024);
        
	});

	test("Game was retrieved.", async () => {
		// Create a new todo.
		const game = await createGame();

		/**
		 * ! is a non-null assertion operator. It tells TypeScript that the value is not null or undefined.
		 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
		 */
		const readGame = await Game.read(sql, game?.props.id!);

		/**
		 * Check if the title, description, and status of the read todo are as expected.
		 * ?. is the optional chaining operator. It allows reading the value of a property
		 * located deep within a chain of connected objects without having to expressly validate that each reference in the chain is valid.
		 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
		 */
        expect(readGame?.props.title).toBe("Test Game");
        expect(readGame?.props.description).toBe("This is a test game");
        expect(readGame?.props.developer).toBe("Test Dev");
        expect(readGame?.props.releaseYear).toBe(2024);
        expect(readGame?.props.cover).toBe("https://www.huber-online.com/daisy_website_files/_processed_/8/0/csm_no-image_d5c4ab1322.jpg")
	});

	test("Games were listed.", async () => {
		// Create a new todo.
		const game1 = await createGame();
		const game2 = await createGame();
		const game3 = await createGame();

		// List all the todos from the database.
		const games = await Game.readAll(sql);

		// Check if the created todo is in the list of todos.
		expect(games).toBeInstanceOf(Array);
		expect(games).toContainEqual(game1);
		expect(games).toContainEqual(game2);
		expect(games).toContainEqual(game3);
	});



});
