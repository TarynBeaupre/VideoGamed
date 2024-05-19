import postgres, { toKebab } from "postgres";
import Game, { GameProps } from "../src/models/Game";
import { test, describe, expect, afterEach, beforeEach } from "vitest";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";
import Tag, { TagProps } from "../src/models/Tag";

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
	const createTag = async (props: Partial<TagProps> = {}) => {
		const tagProps: TagProps = {
			description: props.description || "Test tag"
		};

		return await Tag.create(sql, tagProps);
	};

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user3@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
			// isAdmin: props.isAdmin || false, // Uncomment if implementing admin feature.
		});
	};
	const createGame = async (props: Partial<GameProps> = {}) => {
		const gameProps: GameProps = {
			title: props.title || "Test Game",
			description: props.description || "This is a test game",
            developer: props.developer || "Test Dev",
			releaseYear: props.releaseYear || 2024,
			totalStars: props.totalStars || 0
		};

		return await Game.create(sql, gameProps);
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
		const tables = ["users", "games", "reviews", "tag"];

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

	test("Tag was created.", async () => {
		const tag = await createTag()


		
		expect(tag?.props.id).toBeDefined()
		expect(tag?.props.description).toBe("Test tag");
        
	});

	test("Tag was linked to a game.", async () => {

		const game = await createGame()
		const tag = await createTag()


		await Tag.addGameTag(sql, tag.props.id!, game?.props.id!)
		const tags: Tag[] = await Tag.readTagsForGame(sql, game?.props.id!)
		
		expect(tags[0].props.description).toBe(tag.props.description)
        
	});

	test("All tags were read.", async () => {

		await createTag()
		await createTag()
		await createTag()


		const tags: Tag[] = await Tag.readAll(sql)
		
		expect(tags.length).toBe(3)
        
	});




});
