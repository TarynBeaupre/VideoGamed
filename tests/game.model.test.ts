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
			totalStars: props.totalStars || 0
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

		const game1 = await createGame();
		const game2 = await createGame();
		const game3 = await createGame();

		const games = await Game.readAll(sql);

		expect(games).toBeInstanceOf(Array);
		expect(games).toContainEqual(game1);
		expect(games).toContainEqual(game2);
		expect(games).toContainEqual(game3);
	});

	
	test("Top 3 rated games were listed", async () => {

		const game = await createGame({title: "Test1", totalStars: 10});
		const game1 = await createGame({title: "Test2", totalStars: 1});
		const game2 = await createGame({title: "Test3", totalStars: 100});


		const top3 = await Game.readTop3Rated(sql)

		expect(top3).toBeDefined();

        expect(top3![0].props.title).toBe("Test3");
        expect(top3![1].props.title).toBe("Test1");
        expect(top3![2].props.title).toBe("Test2");


	});

	test("Top 3 recent games were listed", async () => {

		const game = await createGame({title: "Test1", releaseYear: 2005});
		const game1 = await createGame({title: "Test2", releaseYear: 2500});
		const game2 = await createGame({title: "Test3", releaseYear: 2010});


		const top3 = await Game.readTop3Recent(sql)

		expect(top3).toBeDefined();

        expect(top3![0].props.title).toBe("Test2");
        expect(top3![1].props.title).toBe("Test3");
        expect(top3![2].props.title).toBe("Test1");


	});

	test("Game stars were added", async () => {

        const game = await createGame({ title: "Test Game For Review" });

        const beforeStars = game?.props.totalStars

        await Game.addStars(sql,game?.props.id!,5)

        const afterReview = await Game.read(sql,game?.props.id!)

        const afterStars = afterReview!.props.totalStars

        expect(beforeStars).toBe(0);
        expect(afterStars).toBe(5);

        
	});

	test("Game was added to played games", async () => {

        const game = await createGame({ title: "Test Game For Review" });
		const user = await createUser({email: "newUser@email.com"});

		await Game.addPlayedList(sql,user.props.id!, game?.props.id!)
		const playedGame = await Game.getPlayedGame(sql,user.props.id!, game?.props.id!)

		expect(playedGame).toBeDefined()
        
	});
	test("Game was deleted from played games", async () => {

        const game = await createGame({ title: "Test Game For Review" });
		const user = await createUser({email: "newUser@email.com"});

		await Game.addPlayedList(sql,user.props.id!, game?.props.id!)
		await Game.deletePlayed(sql,user.props.id!, game?.props.id!)
		const playedGame = await Game.getPlayedGame(sql,user.props.id!, game?.props.id!)

		expect(playedGame).toBeNull()
        
	});

	test("Game was added to wishlist", async () => {

        const game = await createGame({ title: "Test Game For Review" });
		const user = await createUser({email: "newUser@email.com"});

		await Game.addWishlist(sql,user.props.id!, game?.props.id!)
		const wishlistGame = await Game.readWishlistGameFromId(sql,user.props.id!, game?.props.id!)

		expect(wishlistGame).toBeTruthy()
        
	});

	test("Game was deleted from wishlist", async () => {

        const game = await createGame({ title: "Test Game For Review" });
		const user = await createUser({email: "newUser@email.com"});

		await Game.addWishlist(sql,user.props.id!, game?.props.id!)
		await Game.deleteWishlist(sql,user.props.id!, game?.props.id!)
		const wishlistedGame = await Game.readWishlistGameFromId(sql,user.props.id!, game?.props.id!)

		expect(wishlistedGame).toBeNull()
        
	});



});
